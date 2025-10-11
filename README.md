# Discord Bot v14

## ✨ Features

- Slash command support (Discord Interactions API)
- Modular command and event handlers
- Ban system using fast and light `bun:sqlite` database with automated unbans
- Built with [Bun](https://bun.sh/) for fast runtime and tooling
- Type-safe and maintainable development with TypeScript
- Clean and intuitive folder structure
- Easy setup and minimal configuration required
- Simple built-in logger for console and file output and error tracking
- Embed logger for Discord channels
- YouTube videos and Twitch streams notifier
- CS2 update notifier

## 📦 Requirements

- [Bun](https://bun.sh/) - Install latest version of bun.

## ⚙️ Configuration

### 1. Clone the repository

```bash
$ git clone https://github.com/CabbyWebDev/discord-bot-ts.git
$ cd discord-bot-ts
```

### 2. Create a `.env.dev` file in the root dir and a `.env.prod` file if you need a production environment.

### 3. Modify the .env files, filling in empty fields according to the .env.example file.

```
BOT_TOKEN=your-discord-bot-token
YOUTUBE_API_KEY=your-youtube-api-key
TWITCH_CLIENT_ID=your-twitch-client-id
TWITCH_CLIENT_SECRET=your-twitch-client-secret
TWITCH_TOKEN_ENCRYPTION_KEY=your-encryption-key
```

### 4. Generate your own Twitch token ecryption key by following command.

```bash
$ node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Create your Discord bot and invite the bot to your discord server.

#### Invite your bot by replacing YOUR_CLIENT_ID with your bot's own client id.

```
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&integration_type=0&scope=bot+applications.commands
```

### 6. Modify config/env.ts by editing the fields as shown below.

```ts
{
  locale: '',
  clientId: '',
  guildId: '',
  channelIds: {
    ...
  },
  roleIds: {
    ...
  },
}
```

## ⚡ Running the bot

### Run the scripts below in the given order.

```bash
$ bun deploy:commands:dev # Always run this when you add new slash command.
$ bun db:generate:dev # This command generates drizzle folder where all schemas are stored.
$ bun db:migrate:dev # This command create the actual database file at data/db.dev.sqlite.
```

### Start your Discord bot.

```bash
$ bun start:dev
$ bun start:prod
```

### Deploy slash commands.

```bash
$ bun deploy:commands:dev
$ bun deploy:commands:prod
```

### Compile your bot to JavaScript for production.

```bash
$ bun build
```

## 🧑‍💻 Author

[CabbyWebDev](https://github.com/CabbyWebDev)

## 📄 License

This project is licensed under the [Non-Commercial License](LICENSE).
