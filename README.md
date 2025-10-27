# HSS Discord Bot

Discord bot for capturing and forwarding messages to an external webhook.

## Features

- **Message Capture**: The bot captures all messages sent in channels it has access to.
- **Data Parsing**: Extracts relevant information from messages, including:
  - Message content
  - Attachments
  - Author information
  - Channel and server details
  - Timestamp
- **Webhook Forwarding**: Sends all captured data to a configured external webhook.

## Requirements

- Node.js 22 or higher
- Discord Bot Token
- Webhook URL to receive the data

## Environment Variables

Create a `.env` file in the project root with the following variables:

```
DISCORD_TOKEN=your_discord_bot_token
WEBHOOK_URL=your_webhook_url
DISCORD_DEVELOPMENT_GUILD_ID=optional_server_id
```

## Getting a Discord Bot Token

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click on "New Application" and give it a name
3. Navigate to the "Bot" tab in the left sidebar
4. Click "Add Bot" and confirm
5. Under the "Token" section, click "Reset Token" or "Copy" to get your bot token
   - Keep this token secure as it provides full access to your bot
6. In the "Privileged Gateway Intents" section, enable:
   - Message Content Intent
   - Server Members Intent
   - Presence Intent
7. Save your changes

To invite the bot to your server, go to the "OAuth2" → "URL Generator" tab:
1. Select the "bot" scope
2. Select appropriate permissions (at minimum: "Read Messages/View Channels", "Send Messages", "Read Message History")
3. Copy the generated URL and open it in your browser to invite the bot

## Installation

### Using npm

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the bot
npm run start:prod
```

### Using Docker

#### Using Pre-built Image from GitHub Container Registry

```bash
# Pull the latest image
docker pull ghcr.io/hu9osaez/hss-discord-bot:latest

# Option 1: Run using an .env file
docker run -d --name hss-discord-bot --env-file .env ghcr.io/hu9osaez/hss-discord-bot:latest

# Option 2: Run with individual environment variables
docker run -d --name hss-discord-bot \
  -e DISCORD_TOKEN=your_discord_bot_token \
  -e WEBHOOK_URL=your_webhook_url \
  ghcr.io/hu9osaez/hss-discord-bot:latest
```

## Development

```bash
# Development mode (with hot-reload)
npm run start:dev

# Linting
npm run lint

# Tests
npm run test
```

## Additional Documentation

For detailed research and planning on voice integration with ElevenLabs, see [docs/voice-integration-research-plan.md](docs/voice-integration-research-plan.md).

## Project Structure

- `src/` - Source code
  - `app.module.ts` - Main NestJS module
  - `app.listeners.ts` - Discord event listeners
  - `main.ts` - Application entry point

## Webhook Message Format

```json
{
  "content": "message content",
  "attachments": [
    {
      "url": "file_url",
      "proxyURL": "file_proxy_url",
      "size": 12345,
      "contentType": "content_type"
    }
  ],
  "author": {
    "id": "user_id",
    "bot": false,
    "username": "username",
    "globalName": "global_name",
    "discriminator": "discriminator"
  },
  "channel": {
    "id": "channel_id",
    "name": "channel_name"
  },
  "guild": {
    "id": "server_id",
    "name": "server_name"
  },
  "timestamp": "2025-09-11T12:00:00.000Z"
}
```

## License

[UNLICENSED]
