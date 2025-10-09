# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Discord bot built with NestJS and Necord (a Discord.js wrapper for NestJS) that captures messages from Discord channels and forwards them to an external webhook. The bot is designed to monitor all text-based channels in servers where it has access and send message data to a configured webhook endpoint.

## Architecture

- **Framework**: NestJS with Necord for Discord integration
- **Language**: TypeScript
- **Discord Library**: Discord.js v14 via Necord wrapper
- **HTTP Client**: ofetch for webhook requests

### Key Components

- `src/main.ts` - Application entry point using NestFactory.createApplicationContext (no HTTP server)
- `src/app.module.ts` - Main module configuring Necord with Discord intents
- `src/app.listeners.ts` - Core event listeners for Discord events

### Discord Intents

The bot requires these Discord Gateway Intents:
- Guilds
- GuildMessages
- GuildMessageReactions
- GuildMessageTyping
- MessageContent (privileged)

## Development Commands

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Development mode with hot-reload
npm run start:dev

# Production mode
npm run start:prod

# Linting
npm run lint

# Tests
npm run test
npm run test:watch    # Watch mode
npm run test:cov      # Coverage
npm run test:e2e      # End-to-end tests
```

## Environment Configuration

Required environment variables in `.env`:
- `DISCORD_TOKEN` - Discord bot token
- `WEBHOOK_URL` - URL to receive captured message data
- `DISCORD_DEVELOPMENT_GUILD_ID` (optional) - Specific server ID for development

## Message Processing

The bot captures all non-bot messages in text channels and sends them to the webhook with this JSON structure:

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

## Docker Support

The project includes Docker support with pre-built images available from GitHub Container Registry:

```bash
# Pull and run with .env file
docker pull ghcr.io/hu9osaez/hss-discord-bot:latest
docker run -d --name hss-discord-bot --env-file .env ghcr.io/hu9osaez/hss-discord-bot:latest
```

## Important Notes

- The bot runs as a NestJS application context, not a web server
- Messages from bot accounts are automatically filtered out
- Only messages in guild (server) text channels are processed (no DMs)
- Webhook requests are made asynchronously using ofetch
- The bot requires Message Content Intent to be enabled in Discord Developer Portal