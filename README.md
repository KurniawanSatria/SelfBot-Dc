# Discord SelfBot

Discord selfbot with auto voice channel join and Spotify presence integration.

## Features

- **Multi-token support** - Run multiple selfbot instances simultaneously
- **Auto voice channel join** - Automatically joins specified voice channel on startup
- **Smart voice management** - Detects real device presence and yields accordingly
- **Spotify presence integration** - Syncs your Spotify playback to Discord rich presence
- **Real-time track updates** - Automatically updates presence when songs change
- **WebSocket reconnection** - Auto-reconnects to Spotify on connection loss
- **Listening history** - Submits tracks to Discord content inventory

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the root directory:

```env
TOKEN=your_discord_token_here
AUTO_JOIN_GUILD_ID=guild_id_here
AUTO_JOIN_CHANNEL_ID=channel_id_here
SPOTIFY_CONNECTION_ID=spotify_connection_id_here
```

### Multi-token setup

For multiple accounts, separate tokens with commas:

```env
TOKEN=token1,token2,token3
SPOTIFY_CONNECTION_IDS=connection_id1,connection_id2,connection_id3
```

### Getting Spotify Connection ID

1. Open Discord Developer Tools (Ctrl+Shift+I)
2. Go to Network tab
3. Filter: `connections/spotify`
4. Look for requests to `/access-token`
5. Copy the connection ID from the URL

## Usage

```bash
npm start
```

## Project Structure

```
.
├── index.js              # Entry point (multi-token fork handler)
├── bot.js                # Individual bot instance launcher
├── src/
│   ├── index.js          # Client setup and initialization
│   ├── config.js         # Environment configuration
│   ├── events/
│   │   ├── ready.js      # Ready event handler
│   │   ├── voiceStateUpdate.js   # Voice state management
│   │   └── unhandledPacket.js    # Proto packet handler
│   └── utils/
│       ├── voice.js      # Voice channel utilities
│       └── spotify.js    # Spotify presence integration
```

## How It Works

### Voice Management

- On startup, checks if a real device (non-deafened user) is in the target voice channel
- If no real device present, joins with self-deaf and self-mute
- When real device joins, selfbot disconnects and stands by
- When real device leaves, selfbot rejoins after 3 seconds
- Prevents duplicate presence when using Discord on multiple devices

### Spotify Integration

- Connects to Spotify WebSocket Dealer API
- Subscribes to player state change events
- Updates Discord presence with current track info
- Syncs track progress with accurate timestamps
- Submits listening history to Discord content inventory
- Auto-reconnects on WebSocket disconnect (max 10 attempts)

## Color Scheme

Console output uses custom color palette:

- **Timestamp** - `#71717A` (Gray)
- **Username** - `#60A5FA` (Blue, underlined)
- **Success** - `#22C55E` (Green)
- **Warning** - `#F59E0B` (Orange)
- **Error** - `#EF4444` (Red)
- **Info** - `#E5E7EB` (Light gray)

## Dependencies

- `discord.js-selfbot-v13` - Discord selfbot library
- `@discordjs/voice` - Voice connection handling
- `axios` - HTTP requests
- `ws` - WebSocket client
- `chalk` - Terminal colors
- `figlet` - ASCII banner
- `moment-timezone` - Time formatting
- `dotenv` - Environment variables
- `discord-protos` - Protocol buffer handling

## Disclaimer

**Discord selfbots are against Discord Terms of Service.** Use at your own risk. This project is for educational purposes only.

## Author

Created by **Saturiaaa**

## Version

1.0.0
