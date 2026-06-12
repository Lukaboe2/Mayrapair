<div align="center">

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Rockstar-ExtraBold&color=00b8ff&lines=FORK+AND+STAR+THE+REPO+BEFORE+DEPLOYMENT)](https://git.io/typing-svg)

[![BLACK PANTHER Banner](https://i.ibb.co/k6SxWhdr/84bb97a4a575.jpg)](https://github.com/GuruhTech/PANTHERR-X-ULTRA-PAIR)

<p align="center">
  <a href="https://github.com/GuruhTech/PANTHERR-X-ULTRA-PAIR">
    <img src="https://res.cloudinary.com/dqxlb29uz/image/upload/v1780267810/bwm_uploads/media-1780267810008.jpg" width="100%" alt="PANTHERR-X-ULTRA Banner">
  </a>
</p>

# 🐾 PANTHERR-X-ULTRA PAIR 🎖️

[![Author](https://img.shields.io/badge/AUTHOR-GURUTECH+LAB-00b8ff?style=for-the-badge&logo=github&logoColor=white)](https://github.com/GuruhTech)
[![Stars](https://img.shields.io/github/stars/GuruhTech/PANTHERR-X-ULTRA-PAIR?style=for-the-badge&label=STARS&color=FFD700&logo=github&logoColor=white)](https://github.com/GuruhTech/PANTHERR-X-ULTRA-PAIR/stargazers/)
[![Forks](https://img.shields.io/github/forks/GuruhTech/PANTHERR-X-ULTRA-PAIR?style=for-the-badge&label=FORKS&color=00b8ff&logo=github&logoColor=white)](https://github.com/GuruhTech/PANTHERR-X-ULTRA-PAIR/network/members)
<img src="https://komarev.com/ghpvc/?username=GuruhTech&label=PROFILE+VIEWS&color=00b8ff&style=for-the-badge" alt="Profile Views">

> WhatsApp session generator for **BLACK-PANTHER-MD** / **ULTRA-GURU-MD** and any Baileys-based bot.  
> Supports **pair code** and **QR code** login.

</div>

---

## 🛠️ QUICK SETUP

**1. FORK THE REPO**

[![Fork Repo](https://img.shields.io/badge/FORK%20REPO-1E90FF?style=for-the-badge&logo=github&logoColor=white)](https://github.com/GuruhTech/PANTHERR-X-ULTRA-PAIR/fork)

**2. DOWNLOAD ZIP**

[![Download ZIP](https://img.shields.io/badge/DOWNLOAD%20ZIP-4169E1?style=for-the-badge&logo=github&logoColor=white)](https://github.com/GuruhTech/PANTHERR-X-ULTRA-PAIR/archive/refs/heads/main.zip)

---

## ✨ Features

- 🔗 **Pair Code login** — enter number, get code, link on WhatsApp — no QR scan
- 📷 **QR Code login** — traditional QR scan
- 🗜️ **Long session** — full zlib/base64 inline string, works anywhere
- ⚡ **No database required** — works out of the box with no config

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Optional | MongoDB or PostgreSQL for short session IDs |
| `SESSION_PREFIX` | Optional | Prefix for session strings. Default: `Guruh~` |
| `PORT` | Optional | Port to listen on. Default: `5000` |
| `BOT_REPO` | Optional | GitHub URL shown in WhatsApp message |
| `WA_CHANNEL` | Optional | WhatsApp channel URL in message |
| `MSG_FOOTER` | Optional | Footer text in WhatsApp session message |

---

## 🚀 DEPLOYMENT

### ☁️ Deploy on Render (Free)

> **Step-by-step guide for Render free plan:**

**1. Fork this repo**

Go to [github.com/GuruhTech/PANTHERR-X-ULTRA-PAIR](https://github.com/GuruhTech/PANTHERR-X-ULTRA-PAIR) and click **Fork**.

**2. Create account on Render**

Sign up at [render.com](https://render.com) — free plan available.

**3. Create a new Web Service**

- Click **New → Web Service**
- Connect your GitHub account
- Select your forked repo **PANTHERR-X-ULTRA-PAIR**

**4. Configure the service**

| Setting | Value |
|---|---|
| **Name** | `pantherr-x-ultra-pair` (or any name) |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node index.js` |
| **Plan** | **Free** |

**5. Add Environment Variables** *(optional)*

In the Render dashboard → **Environment** tab, add:
```
PORT=10000
BOT_REPO=https://github.com/GuruhTech/PANTHERR-X-ULTRA-PAIR
WA_CHANNEL=https://whatsapp.com/channel/0029VbCl2UX3rZZilMSvxN1e
```
> ⚠️ Render free plan uses port `10000` — set `PORT=10000`

**6. Click Deploy**

Wait ~2 minutes. Your session generator will be live at:
```
https://your-service-name.onrender.com
```

**7. Keep it alive (free plan)**

> Free Render services sleep after 15 min of inactivity. To keep it awake:
> - Use [UptimeRobot](https://uptimerobot.com) — free service that pings your URL every 5 minutes
> - Set monitor URL to: `https://your-service-name.onrender.com/health`

---

### ☁️ Heroku

[![Deploy to Heroku](https://img.shields.io/badge/DEPLOY%20TO%20HEROKU-430098?style=for-the-badge&logo=heroku&logoColor=white)](https://dashboard.heroku.com/new?template=https://github.com/GuruhTech/PANTHERR-X-ULTRA-PAIR)

---

### 🐧 VPS / Termux

```bash
git clone https://github.com/GuruhTech/PANTHERR-X-ULTRA-PAIR.git
cd PANTHERR-X-ULTRA-PAIR
npm install
npm start
```

---

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /` | Home landing page |
| `GET /pair` | Pair code login page |
| `GET /qr` | QR code login page |
| `GET /qr/session?type=long` | Generates QR code |
| `GET /code?number=2547xxx&type=long` | Returns pair code |
| `GET /health` | Server health check |

---

## 📞 Support

[![JOIN CHANNEL](https://img.shields.io/badge/JOIN%20CHANNEL-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://whatsapp.com/channel/0029VbCl2UX3rZZilMSvxN1e)
[![YOUTUBE TUTORIAL](https://img.shields.io/badge/YOUTUBE%20TUTORIAL-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://youtube.com/@GuruTech)

---

### Related Projects

- 🐾 [BLACK-PANTHER-MD](https://github.com/koyoteh/BLACK-PANTHER) — Multi-Device WhatsApp Bot by GuruTech
- 🎖️ [ULTRA-GURU-MD](https://github.com/GuruhTech/ULTRA-GURU) — Ultimate WhatsApp Bot by GuruTech

---

<div align="center">
Made with ❤️ by GuruTech Lab 🇰🇪
</div>
