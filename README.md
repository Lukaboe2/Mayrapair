# 🔥 ULTRA GURU MD — Session Generator

> **Open Source** WhatsApp Session Generator for **ULTRA GURU MD** and any Baileys-based WhatsApp bot.  
> Generate secure session IDs via **Pair Code** or **QR Code** login — fast, encrypted, and zero-trace.

<p align="center">
  <a href="https://github.com/GuruhTech/ULTRA-GURU-PAIR/fork">
    <img alt="Fork Repo" src="https://img.shields.io/badge/-FORK%20REPO-ff4500?style=for-the-badge&logo=github&logoColor=white"/>
  </a>
  &nbsp;
  <a href="https://github.com/GuruhTech/ULTRA-GURU-PAIR/stargazers">
    <img alt="Stars" src="https://img.shields.io/github/stars/GuruhTech/ULTRA-GURU-PAIR?style=for-the-badge&color=ff6a00&labelColor=0a0400"/>
  </a>
  &nbsp;
  <a href="LICENSE">
    <img alt="License MIT" src="https://img.shields.io/badge/License-MIT-ffb347?style=for-the-badge&labelColor=0a0400"/>
  </a>
  &nbsp;
  <a href="https://github.com/GuruhTech/ULTRA-GURU">
    <img alt="ULTRA GURU MD" src="https://img.shields.io/badge/Bot-ULTRA%20GURU%20MD-ff4500?style=for-the-badge&logo=whatsapp&logoColor=white&labelColor=0a0400"/>
  </a>
</p>

---

## What is this?

**ULTRA GURU MD Session Generator** is the official open-source session tool for the [ULTRA GURU MD](https://github.com/GuruhTech/ULTRA-GURU) WhatsApp bot project. It lets you link a WhatsApp account to your bot by generating a **Session ID** — a compressed, encrypted credential string your bot uses to authenticate without scanning a QR code every restart.

Built on the [Baileys](https://github.com/WhiskeySockets/Baileys) library, it supports:

- **Pair Code** — enter an 8-digit code directly in WhatsApp Linked Devices (no QR needed)
- **QR Code** — classic optical scan via phone camera
- **Long sessions** — full self-contained zlib/base64 strings (no database required)
- **Short sessions** — compact IDs stored in MongoDB or PostgreSQL

---

## Features

| Feature | Description |
|---|---|
| 🔗 Pair Code Login | No QR needed — enter a code in WhatsApp → Linked Devices |
| 📷 QR Code Login | Traditional scan with your phone camera |
| 🗜️ Long Session | Full inline session string, works anywhere, no DB needed |
| 🗃️ Short Session | Compact ID backed by MongoDB or PostgreSQL |
| ⚡ Auto DB Detection | Detects `mongodb://` or `postgres://` from `DATABASE_URL` |
| 🔒 Zero-Trace | Credentials are never logged or stored publicly |
| 🌐 Open Source | MIT licensed — fork, modify, self-host freely |

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/GuruhTech/ULTRA-GURU-PAIR.git
cd ULTRA-GURU-PAIR

# Install dependencies
npm install

# Start the server
node index.js
```

Then open `http://localhost:5000` in your browser.

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Required for short sessions (optional — long sessions work without it)
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/sessions
# or
DATABASE_URL=postgres://user:pass@host:5432/sessions

# Customization
SESSION_PREFIX=GURU~
PORT=5000
BOT_REPO=https://github.com/GuruhTech/ULTRA-GURU
WA_CHANNEL=https://whatsapp.com/channel/0029Vb7jauLHLHQbkcbcHi0e
MSG_FOOTER=> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ULTRA GURU MD*
```

### All Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | *(none)* | MongoDB or PostgreSQL URL for short sessions. If unset, all sessions use long format. |
| `SESSION_PREFIX` | `GURU~` | Prefix prepended to every session string. |
| `PORT` | `5000` | Port the server listens on. |
| `BOT_REPO` | ULTRA GURU repo | GitHub URL shown in the WhatsApp session message. |
| `WA_CHANNEL` | GuruhTech channel | WhatsApp channel URL shown in the session message. |
| `MSG_FOOTER` | GuruhTech footer | Footer text in the WhatsApp session delivery message. |

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Home landing page |
| `/pair` | GET | Pair code login UI |
| `/qr` | GET | QR code login UI |
| `/code?number=2547xxx&type=long` | GET | Returns `{ code, fallback }` JSON with pairing code |
| `/qr/session?type=long` | GET | Generates and renders QR code inline |
| `/session/:id` | GET | Retrieves a short session string from the database |
| `/health` | GET | Server status and storage backend info |

> `fallback: true` in the `/code` response means short was requested but no DB is configured — it automatically falls back to long session.

---

## Using the Session in ULTRA GURU MD

### 1. Load the Session in Your Bot

```js
// lib/session.js
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');
const axios = require('axios');

const sessionDir = path.join(__dirname, '..', 'session');
const credsPath = path.join(sessionDir, 'creds.json');

if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

async function loadSession(SESSION_ID) {
    if (!SESSION_ID || typeof SESSION_ID !== 'string') {
        throw new Error('SESSION_ID is missing or invalid');
    }

    if (fs.existsSync(credsPath)) fs.unlinkSync(credsPath);

    const PREFIX = 'GURU~';

    if (!SESSION_ID.startsWith(PREFIX)) {
        throw new Error(`Invalid session format. Must start with "${PREFIX}"`);
    }

    const payload = SESSION_ID.slice(PREFIX.length);

    if (payload.length < 50) {
        // SHORT SESSION — fetch from server
        const res = await axios.get(`https://your-session-server.com/session/${payload}`, { timeout: 10000 });
        return loadSession(res.data.trim());
    } else {
        // LONG SESSION — decode inline
        const compressed = Buffer.from(payload, 'base64');
        const decompressed = zlib.gunzipSync(compressed);
        fs.writeFileSync(credsPath, decompressed, 'utf8');
        console.log('✅ ULTRA GURU MD session loaded');
    }
}

module.exports = { loadSession };
```

### 2. Connect Your Bot

```js
// index.js
const { loadSession } = require('./lib/session');
const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');

async function startBot() {
    await loadSession(process.env.SESSION_ID);

    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
    });

    sock.ev.on('creds.update', saveCreds);
}

startBot();
```

### 3. Your `.env` for the Bot

```env
SESSION_ID=GURU~H4sIAAAAAAAAA...   # long session (recommended)
# or
SESSION_ID=GURU~aBc123XyZ          # short session (requires server DB)
```

---

## Deployment

Self-host this session server anywhere:

<a href="https://dashboard.render.com" target="_blank">
  <img alt="Deploy to Render" src="https://img.shields.io/badge/-DEPLOY%20TO%20RENDER-ff4500?style=for-the-badge&logo=render&logoColor=white"/>
</a>
&nbsp;
<a href="https://dashboard.heroku.com/new?template=https://github.com/GuruhTech/ULTRA-GURU-PAIR" target="_blank">
  <img alt="Deploy to Heroku" src="https://img.shields.io/badge/-DEPLOY%20TO%20HEROKU-ff6a00?style=for-the-badge&logo=heroku&logoColor=white"/>
</a>
&nbsp;
<a href="https://app.koyeb.com" target="_blank">
  <img alt="Deploy to Koyeb" src="https://img.shields.io/badge/-DEPLOY%20TO%20KOYEB-ffb347?style=for-the-badge&logo=koyeb&logoColor=white"/>
</a>

---

## Community

Join the ULTRA GURU MD community:

| Platform | Link |
|---|---|
| 💬 WhatsApp Group | [Join Group](https://chat.whatsapp.com/Cp6waPAdT3hLVcbdfBeV61) |
| 📢 WhatsApp Channel | [Follow Channel](https://whatsapp.com/channel/0029Vb7jauLHLHQbkcbcHi0e) |
| ✈️ Telegram | [@GURU_TECHLAB](https://t.me/GURU_TECHLAB) |
| 🤖 Main Bot Repo | [ULTRA-GURU](https://github.com/GuruhTech/ULTRA-GURU) |

---

## Contributing

This project is **open source** under the [MIT License](LICENSE). Contributions are welcome!

1. Fork the repo
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

Please keep PRs focused and follow the existing code style.

---

## License

```
MIT License

Copyright (c) 2026 GuruhTech Labs

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

---

<p align="center">
  Made with 🔥 by <a href="https://github.com/GuruhTech">GuruhTech Labs</a> · Powering <strong>ULTRA GURU MD</strong>
</p>
