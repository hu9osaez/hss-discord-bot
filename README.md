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

```bash
# Build the image
docker build -t hss-discord-bot .

# Run the container
docker run -d --name hss-discord-bot --env-file .env hss-discord-bot
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
