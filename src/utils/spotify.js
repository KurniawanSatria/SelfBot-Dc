import { SpotifyRPC } from 'discord.js-selfbot-v13';
import axios from 'axios';
import WebSocket from 'ws';
import chalk from 'chalk';
import moment from 'moment-timezone';

moment.tz.setDefault('Asia/Jakarta');

function log(msg) {
    console.log(chalk.hex('#71717A')(`[${moment().format('HH:mm')}]`), msg);
}

function logError(msg) {
    console.error(chalk.hex('#71717A')(`[${moment().format('HH:mm')}]`), chalk.hex('#EF4444')(msg));
}

let spotifyToken = null;
let ws = null;
let subscribed = false;
let reconnectAttempts = 0;
let heartbeatInterval = null;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 5000;

let currentState = {
    isPlaying: false,
    trackId: null,
    progressMs: 0,
    lastSyncTime: 0,
    durationMs: 0,
    track: null,
    album: null,
    artists: []
};


async function submitListeningHistory(client, state) {
    const connectionId = process.env.SPOTIFY_CONNECTION_ID;

    if (!connectionId || !state.track || !state.album || !state.artists) return;

    try {
        const payload = {
            connection_id: connectionId,
            tracks: [{
                id: state.track.id,
                name: state.track.name,
                duration: state.track.duration_ms,
                type: "track",
                album: {
                    id: state.album.id,
                    name: state.album.name,
                    image: state.album.images?.[0]
                        ? {
                            height: state.album.images[0].height,
                            url: state.album.images[0].url,
                            width: state.album.images[0].width
                        }
                        : null,
                    type: "album"
                },
                artists: state.artists.map(artist => ({
                    external_urls: artist.external_urls || { spotify: `https://open.spotify.com/artist/${artist.id}` },
                    href: artist.href || `https://api.spotify.com/v1/artists/${artist.id}`,
                    id: artist.id,
                    name: artist.name,
                    type: "artist",
                    uri: artist.uri || `spotify:artist:${artist.id}`
                })),
                isLocal: false
            }]
        };

        await axios.post(
            "https://discord.com/api/v9/content-inventory/users/@me/spotify",
            payload,
            {
                headers: {
                    Authorization: client.token,
                    'Content-Type': 'application/json'
                }
            }
        );

        log(chalk.hex('#22C55E')(`Track submitted: ${state.track.name}`));
    } catch (err) {
        logError(`Failed to submit history: ${err.message}`);
    }
}

async function getSpotifyToken(client) {
    try {
        const connectionId = process.env.SPOTIFY_CONNECTION_ID;
        if (!connectionId) {
            logError('SPOTIFY_CONNECTION_ID not set in environment');
            return null;
        }
        const { data } = await axios.get(
            `https://discord.com/api/v9/users/@me/connections/spotify/${connectionId}/access-token`,
            { headers: { Authorization: client.token } }
        );
        return data.access_token;
    } catch (err) {
        logError(`Failed to get Spotify token: ${err.message}`);
        return null;
    }
}

async function refreshToken(client) {
    spotifyToken = await getSpotifyToken(client);
    return spotifyToken;
}

function buildSpotifyPresence(client, state) {
    const { track, album, artists } = state;

    if (!track || !album || !artists.length) return null;

    const largeImageId = album.images?.[0]?.url?.split('image/')[1] || '';
    const artistNames = artists.map(a => a.name).join(', ');
    const artistIds = artists.map(a => a.id);

    return new SpotifyRPC(client)
        .setAssetsLargeImage(largeImageId ? `spotify:${largeImageId}` : 'spotify:album')
        .setAssetsLargeText(album.name)
        .setState(artistNames)
        .setDetails(track.name)
        .setSongId(track.id)
        .setAlbumId(album.id)
        .setArtistIds(artistIds);
}

function updatePresence(client, state) {
    if (!state.isPlaying || !state.track) {
        client.user.setPresence({
            activities: [],
            status: 'online'
        });
        log(`${chalk.hex('#60A5FA').underline(client.user.tag)} ${chalk.hex('#F59E0B')('Cleared presence (not playing)')}`);
        return;
    }

    const now = Date.now();
    const progress = state.progressMs + (now - state.lastSyncTime);
    const remaining = state.durationMs - progress;

    const spotify = buildSpotifyPresence(client, state);
    if (!spotify) return;

    spotify
        .setStartTimestamp(now - progress)
        .setEndTimestamp(now + remaining);

    client.user.setPresence({
        activities: [spotify],
        status: 'online'
    });

    log(`${chalk.hex('#60A5FA').underline(client.user.tag)} ${chalk.hex('#22C55E')('Now Playing:')} ${state.track.name} - ${state.artists.map(a => a.name).join(', ')}`);
}

async function handlePlayerStateChanged(client, playerState) {
    if (!playerState) return;

    const isPlaying = playerState.is_playing;
    const track = playerState.item;
    const progressMs = playerState.progress_ms || 0;

    const trackChanged = !currentState.trackId || currentState.trackId !== track?.id;
    const playStateChanged = currentState.isPlaying !== isPlaying;

    if (!isPlaying) {
        currentState = {
            isPlaying: false,
            trackId: null,
            progressMs: 0,
            lastSyncTime: 0,
            durationMs: 0,
            track: null,
            album: null,
            artists: []
        };
    } else {
        currentState = {
            isPlaying,
            trackId: track?.id || null,
            progressMs,
            lastSyncTime: Date.now(),
            durationMs: track?.duration_ms || 0,
            track: track || null,
            album: track?.album || null,
            artists: track?.artists || []
        };
    }

    if (trackChanged && track) {
        await submitListeningHistory(client, currentState);
        log(`${chalk.hex('#60A5FA').underline(client.user.tag)} ${chalk.hex('#E5E7EB')(`Track changed: ${track.name} - ${track.artists.map(a => a.name).join(', ')}`)}`);
    }

    if (playStateChanged) {
        log(`${chalk.hex('#60A5FA').underline(client.user.tag)} ${isPlaying ? chalk.hex('#22C55E')('Playback started') : chalk.hex('#F59E0B')('Playback paused')}`);
    }

    updatePresence(client, currentState);
}

function connectWebSocket(client) {
    if (ws) {
        ws.removeAllListeners();
        ws.close();
    }

    if (!spotifyToken) {
        logError(`${chalk.hex('#60A5FA').underline(client.user.tag)} No Spotify token available`);
        return;
    }

    subscribed = false;

    log(`${chalk.hex('#60A5FA').underline(client.user.tag)} ${chalk.hex('#F59E0B')('Connecting to Spotify WebSocket...')}`);

    ws = new WebSocket(`wss://dealer.spotify.com/?access_token=${spotifyToken}`);

    ws.on('open', () => {
        log(`${chalk.hex('#60A5FA').underline(client.user.tag)} ${chalk.hex('#22C55E')('Connected to Spotify WebSocket')}`);
        reconnectAttempts = 0;
    });

    ws.on('message', async (raw) => {
        try {
            const event = JSON.parse(raw.toString());

            if (!subscribed) {
                const connectionId =
                    event.headers?.['Spotify-Connection-Id'] ||
                    event.uri?.split('connections/')[1];

                if (connectionId) {
                    subscribed = true;

                    try {
                        await axios.put(
                            `https://api.spotify.com/v1/me/notifications/player?connection_id=${encodeURIComponent(connectionId)}`,
                            {},
                            { headers: { Authorization: `Bearer ${spotifyToken}` } }
                        );
                        log(`${chalk.hex('#60A5FA').underline(client.user.tag)} ${chalk.hex('#22C55E')('Subscribed to player events')}`);
                    } catch (err) {
                        logError(`${chalk.hex('#60A5FA').underline(client.user.tag)} Failed to subscribe: ${err.message}`);
                    }
                }
                return;
            }

            if (event.type === 'message' && event.payloads) {
                const payloads = event.payloads;

                for (const payload of payloads) {
                    if (!payload.events) continue;

                    for (const evt of payload.events) {
                        const eventType = evt.type;

                        if (eventType === 'PLAYER_STATE_CHANGED') {
                            const playerState = evt.event?.state;
                            await handlePlayerStateChanged(client, playerState);
                        }
                    }
                }
            }
        } catch (err) {
            logError(`${chalk.hex('#60A5FA').underline(client.user.tag)} Failed to parse WebSocket message: ${err.message}`);
        }
    });

    ws.on('error', (err) => {
        logError(`${chalk.hex('#60A5FA').underline(client.user.tag)} WebSocket error: ${err.message}`);
    });

    ws.on('close', (code, reason) => {
        log(`${chalk.hex('#60A5FA').underline(client.user.tag)} ${chalk.hex('#F59E0B')('🔌 Disconnected from Spotify WebSocket')} (${code}: ${reason.toString()})`);
        subscribed = false;

        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            log(`${chalk.hex('#60A5FA').underline(client.user.tag)} ${chalk.hex('#F59E0B')('Reconnecting in')} ${RECONNECT_DELAY / 1000}s... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

            setTimeout(async () => {
                await refreshToken(client);
                connectWebSocket(client);
            }, RECONNECT_DELAY);
        } else {
            logError(`${chalk.hex('#60A5FA').underline(client.user.tag)} Max reconnection attempts reached`);
        }
    });
}

export async function initSpotify(client) {
    spotifyToken = await getSpotifyToken(client);

    if (!spotifyToken) {
        logError(`${chalk.hex('#60A5FA').underline(client.user.tag)} Could not obtain Spotify token. Make sure Spotify is connected to your Discord account.`);
        return;
    }

    log(`${chalk.hex('#60A5FA').underline(client.user.tag)} ${chalk.hex('#22C55E')('Spotify token obtained')}`);

    connectWebSocket(client);

    heartbeatInterval = setInterval(() => {
        if (currentState.isPlaying && currentState.track) {
            updatePresence(client, currentState);
        } else if (!currentState.isPlaying) {
            client.user.setPresence({
                activities: [],
                status: 'online'
            });
        }
    }, 15000);

    process.on('SIGINT', () => {
        log(`${chalk.hex('#60A5FA').underline(client.user.tag)} ${chalk.hex('#F59E0B')('Shutting down Spotify...')}`);
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        if (ws) ws.close();
    });
}

export function stopSpotify() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
    if (ws) {
        ws.removeAllListeners();
        ws.close();
        ws = null;
    }
    subscribed = false;
    reconnectAttempts = 0;
    currentState = {
        isPlaying: false,
        trackId: null,
        progressMs: 0,
        lastSyncTime: 0,
        durationMs: 0,
        track: null,
        album: null,
        artists: []
    };
}