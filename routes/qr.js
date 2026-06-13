const { 
    pantherId,
    removeFile
} = require('../panther');
const { SESSION_PREFIX, GC_JID, BOT_REPO, WA_CHANNEL, MSG_FOOTER } = require('../config');
const { isConfigured, saveSession } = require('../panther/sessionStore');
const QRCode = require('qrcode');
const express = require('express');
const zlib = require('zlib');
const path = require('path');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const { sendButtons } = require('gifted-btns');
const {
    default: pantherConnect,
    useMultiFileAuthState,
    Browsers,
    delay,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const sessionDir = path.join(__dirname, "session");

router.get('/session', async (req, res) => {
    const id = pantherId();
    const sessionType = (req.query.type || 'short').toLowerCase();
    let responseSent = false;
    let sessionCleanedUp = false;

    async function cleanUpSession() {
        if (!sessionCleanedUp) {
            await removeFile(path.join(sessionDir, id));
            sessionCleanedUp = true;
        }
    }

    async function PANTHER_QR_CODE() {
        const { version } = await fetchLatestBaileysVersion();
        const { state, saveCreds } = await useMultiFileAuthState(path.join(sessionDir, id));
        try {
            let Panther = pantherConnect({
                version,
                auth: state,
                printQRInTerminal: false,
                logger: pino({ level: "silent" }),
                browser: Browsers.macOS("Desktop"),
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 30000
            });

            Panther.ev.on('creds.update', saveCreds);
            Panther.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect, qr } = s;

                if (qr && !responseSent) {
                    const qrImage = await QRCode.toDataURL(qr);
                    if (!res.headersSent) {
                        res.send(`
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <title>PANTHERR X ULTRA | QR CODE</title>
                                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                                <link rel="preconnect" href="https://fonts.googleapis.com">
                                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
                                <style>
                                    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                                    body {
                                        display: flex;
                                        justify-content: center;
                                        align-items: center;
                                        min-height: 100vh;
                                        background: #07070e;
                                        font-family: 'Inter', sans-serif;
                                        color: #f1f1f1;
                                        padding: 20px;
                                    }
                                    .container {
                                        text-align: center;
                                        width: 100%;
                                        max-width: 420px;
                                    }
                                    .logo-ring {
                                        width: 64px; height: 64px;
                                        border-radius: 50%;
                                        background: linear-gradient(135deg, #f97316, #ef4444);
                                        display: flex; align-items: center; justify-content: center;
                                        margin: 0 auto 16px;
                                        box-shadow: 0 0 0 8px rgba(249,115,22,0.12), 0 0 30px rgba(249,115,22,0.3);
                                    }
                                    .logo-ring svg { width: 30px; height: 30px; fill: #fff; }
                                    h1 {
                                        font-size: 1.4rem; font-weight: 800;
                                        background: linear-gradient(135deg, #f97316, #ef4444);
                                        -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
                                        margin-bottom: 6px;
                                    }
                                    p.sub { color: #6b7280; font-size: 0.82rem; margin-bottom: 28px; }
                                    .qr-wrap {
                                        background: rgba(255,255,255,0.03);
                                        border: 1px solid rgba(255,255,255,0.08);
                                        border-radius: 20px;
                                        padding: 24px;
                                        margin-bottom: 20px;
                                        position: relative;
                                    }
                                    .qr-wrap img {
                                        width: 260px; height: 260px;
                                        border-radius: 12px;
                                        border: 3px solid rgba(249,115,22,0.25);
                                        animation: pulse 2s infinite;
                                    }
                                    @keyframes pulse {
                                        0%,100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.4); }
                                        50% { box-shadow: 0 0 0 12px rgba(249,115,22,0); }
                                    }
                                    .badge {
                                        display: inline-flex; align-items: center; gap: 6px;
                                        background: rgba(249,115,22,0.1); border: 1px solid rgba(249,115,22,0.2);
                                        border-radius: 999px; padding: 4px 14px;
                                        font-size: 0.72rem; font-weight: 600; color: #f97316;
                                        margin-bottom: 24px;
                                    }
                                    .dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 6px #4ade80; }
                                    .back-btn {
                                        display: inline-flex; align-items: center; gap: 8px;
                                        padding: 10px 24px; border-radius: 12px;
                                        background: linear-gradient(135deg, #f97316, #ef4444);
                                        color: #fff; font-weight: 600; font-size: 0.82rem;
                                        text-decoration: none; border: none; cursor: pointer;
                                        transition: transform 0.18s, box-shadow 0.18s;
                                    }
                                    .back-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(249,115,22,0.4); }
                                    @media (max-width: 480px) { .qr-wrap img { width: 220px; height: 220px; } }
                                </style>
                            </head>
                            <body>
                                <div class="container">
                                    ${(sessionType === 'short' && !isConfigured()) ? `
                                    <div style="margin-bottom:16px;padding:10px 14px;border-radius:12px;border:1px solid rgba(249,115,22,0.2);background:rgba(249,115,22,0.06);text-align:left;font-size:0.75rem;color:#fb923c;">
                                        ℹ️ Session store not configured — switched to <strong>Long session</strong>.
                                    </div>` : ''}
                                    <div class="logo-ring">
                                        <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                                    </div>
                                    <h1>PANTHERR X ULTRA</h1>
                                    <p class="sub">Scan QR in WhatsApp → Linked Devices → Link a Device</p>
                                    <span class="badge"><span class="dot"></span> Ready to Scan</span>
                                    <div class="qr-wrap">
                                        <img src="${qrImage}" alt="QR Code"/>
                                    </div>
                                    <a href="./" class="back-btn">← Back to Home</a>
                                </div>
                            </body>
                            </html>
                        `);
                        responseSent = true;
                    }
                }

                if (connection === "open") {
                    try {
                        await Panther.groupAcceptInvite(GC_JID);
                    } catch (e) {
                        console.log("Group join error:", e.message);
                    }

                    await delay(10000);

                    let sessionData = null;
                    let attempts = 0;
                    const maxAttempts = 10;

                    while (attempts < maxAttempts && !sessionData) {
                        try {
                            const credsPath = path.join(sessionDir, id, "creds.json");
                            if (fs.existsSync(credsPath)) {
                                const data = fs.readFileSync(credsPath);
                                if (data && data.length > 100) {
                                    sessionData = data;
                                    break;
                                }
                            }
                            await delay(2000);
                            attempts++;
                        } catch (readError) {
                            console.error("Read error:", readError);
                            await delay(2000);
                            attempts++;
                        }
                    }

                    if (!sessionData) {
                        await cleanUpSession();
                        return;
                    }

                    try {
                        let compressedData = zlib.gzipSync(sessionData);
                        let b64data = compressedData.toString('base64');
                        const fullSession = SESSION_PREFIX + b64data;

                        let msgText, msgButtons;
                        if (isConfigured() && sessionType === 'short') {
                            const shortId = await saveSession(fullSession);
                            const shortSession = `${SESSION_PREFIX}${shortId}`;
                            msgText = `*SESSION ID ✅*\n\n${shortSession}`;
                            msgButtons = [
                                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: 'Copy Session', copy_code: shortSession }) },
                                { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Visit Bot Repo', url: BOT_REPO }) },
                                { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Join WaChannel', url: WA_CHANNEL }) }
                            ];
                        } else {
                            msgText = `*SESSION ID ✅*\n\n${fullSession}`;
                            msgButtons = [
                                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: 'Copy Session', copy_code: fullSession }) },
                                { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Visit Bot Repo', url: BOT_REPO }) },
                                { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Join WaChannel', url: WA_CHANNEL }) }
                            ];
                        }

                        await sendButtons(Panther, Panther.user.id, {
                            title: '',
                            text: msgText,
                            footer: MSG_FOOTER,
                            buttons: msgButtons
                        });

                        await delay(2000);
                        await Panther.ws.close();
                    } catch (sendError) {
                        console.error("Error sending session:", sendError);
                    } finally {
                        await cleanUpSession();
                    }

                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output?.statusCode != 401) {
                    await delay(10000);
                    PANTHER_QR_CODE();
                }
            });
        } catch (err) {
            console.error("Main error:", err);
            if (!responseSent) {
                res.status(500).json({ code: "QR Service is Currently Unavailable" });
                responseSent = true;
            }
            await cleanUpSession();
        }
    }

    try {
        await PANTHER_QR_CODE();
    } catch (finalError) {
        console.error("Final error:", finalError);
        await cleanUpSession();
        if (!responseSent) {
            res.status(500).json({ code: "Service Error" });
        }
    }
});

module.exports = router;
