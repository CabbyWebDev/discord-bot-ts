# Discord Bot v14 TS

## ✨ Features

- Slash command support (Discord Interactions API)
- Modular command and event handlers
- Ban system using fast and light `bun:sqlite` database with automated unbans
- Built with [Bun](https://bun.sh/) for fast run time and tooling
- Type-safe and maintainable development with TypeScript
- Clean and intuitive folder structure
- Easy setup and minimal configuration required
- Simple built-in logger for console and file output and error tracking
- Embed logger for Discord channels

## 📦 Requirements

- [Bun](https://bun.sh/) - install latest version
- [Discord Developer Portal](https://discord.com/developers/applications) - bot token

## 🚀 Getting Started

### 1. Clone the repository

```bash
$ git clone https://github.com/CabbyWebDev/discord-bot-ts.git
$ cd discord-bot-ts
```

### 2. Create a `.env` file to root dir

```
BOT_TOKEN=your-discord-bot-token
```

### 3. Create your Discord bot and invite the bot to your guild.

#### Invite your bot by replacing YOUR_CLIENT_ID with your bot's own client id.

```
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&integration_type=0&scope=bot+applications.commands
```

### 4. Change config file config/main.ts by adding following ids

```ts
const clientId = '';
const guildId = '';

const logChannels = {
  messagesChannelId: '',
  commandsChannelId: '',
};
```

## ⚡ Usage

### Start your Discord bot

```bash
$ bun start
```

### Start your Discord bot in watch mode (auto-restart on file changes)

```bash
$ bun start-dev
```

### Deploy slash commands using following command

```bash
$ bun deploy-commands
```
