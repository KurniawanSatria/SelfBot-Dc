import { joinVoiceChannel } from '@discordjs/voice';
import { AUTO_JOIN_GUILD_ID, AUTO_JOIN_CHANNEL_ID } from '../config.js';
import chalk from 'chalk';
import moment from 'moment-timezone';

moment.tz.setDefault('Asia/Jakarta');

export function isRealDevice(client, state) {
    return state.user?.id === client.user.id && state.selfDeaf === false;
}

export async function tryAutoJoin(client) {
    if (client.realDeviceInVC || client.InVC) return;

    const guild = client.guilds.cache.get(AUTO_JOIN_GUILD_ID);
    if (!guild) return;

    const channel = client.channels.cache.get(AUTO_JOIN_CHANNEL_ID);
    if (!channel) return;

    const hasRealDevice = guild.voiceStates.cache.some(state =>
        state.channelId === channel.id &&
        state.member &&
        state.member.id !== client.user.id &&
        state.selfDeaf === false
    );
    if (hasRealDevice) {
        await new Promise(r => setTimeout(r, 1500));
        const stillPresent = guild.voiceStates.cache.some(state =>
            state.channelId === channel.id &&
            state.member &&
            state.member.id !== client.user.id &&
            state.selfDeaf === false
        );
        if (!stillPresent) {
            console.log(
                chalk.hex('#71717A')(`[${moment().format('HH:mm')}]`),
                chalk.hex('#60A5FA').underline(client.user.username),
                chalk.hex('#E5E7EB')('Initial real device check was stale — joining')
            );
        } else {
            client.realDeviceInVC = true;
            console.log(chalk.hex('#71717A')(`[${moment().format('HH:mm')}]`), chalk.hex('#60A5FA').underline(client.user.username), chalk.hex('#E5E7EB')('Real device already in VC — not auto‑joining'));
            return;
        }
    }

    try {
        joinVoiceChannel({
            channelId: AUTO_JOIN_CHANNEL_ID,
            guildId: AUTO_JOIN_GUILD_ID,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: true,
        });
        client.InVC = true;
        console.log(chalk.hex('#71717A')(`[${moment().format('HH:mm')}]`), chalk.hex('#60A5FA').underline(client.user.username), chalk.hex('#22C55E')(`Joined ${channel.name}`));
    } catch (err) {
        console.error(chalk.hex('#71717A')(`[${moment().format('HH:mm')}]`), chalk.hex('#60A5FA').underline(client.user.username), chalk.hex('#EF4444')(`Failed to join: ${err.message}`));
    }
}

export function scheduleRejoin(client) {
    if (client.rejoinTimeout) clearTimeout(client.rejoinTimeout);
    client.rejoinTimeout = setTimeout(() => {
        client.rejoinTimeout = null;
        tryAutoJoin(client);
    }, 3000);
}