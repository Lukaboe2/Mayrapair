const { 
    guruhId,
    removeFile
} = require('../guru');
const { SESSION_PREFIX, GC_JID, BOT_REPO, WA_CHANNEL, MSG_FOOTER } = require('../config');
const { isConfigured, saveSession } = require('../guru/sessionStore');
const zlib = require('zlib');
const express = require('express');
const fs = require('fs');
const path = require('path');
let router = express.Router();
const pino = require("pino");
const {
    default: guruhConnect,
    useMultiFileAuthState,
    delay,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers
} = require("@whiskeysockets/baileys");

const sessionDir = path.join(__dirname, "session");

// Cleanup stale session dirs older than 10 minutes on startup
try {
    if (fs.existsSync(sessionDir)) {
        const cutoff = Date.now() - 10 * 60 * 1000;
        for (const entry of fs.readdirSync(sessionDir)) {
            try {
                const p = path.join(sessionDir, entry);
                if (fs.statSync(p).isDirectory() && fs.statSync(p).mtimeMs < cutoff) {
                    fs.rmSync(p, { recursive: true, force: true });
                }
            } catch (_) {}
        }
    }
} catch (_) {}

router.get('/', async (req, res) => {
    const id = guruhId();
    let num = (req.query.number || '').replace(/[^0-9]/g, '');
    const sessionType = (req.query.type || 'short').toLowerCase();
    let responseSent = false;
    let sessionCleanedUp = false;
    let pairingDone = false;
    let reconnectCount = 0;
    const MAX_RECONNECTS = 10;

    async function cleanUpSession() {
        if (!sessionCleanedUp) {
            sessionCleanedUp = true;
            try { await removeFile(path.join(sessionDir, id)); } catch (_) {}
        }
    }

    async function GURUH_PAIR_CODE() {
        const { version } = await fetchLatestBaileysVersion();
        const { state, saveCreds } = await useMultiFileAuthState(path.join(sessionDir, id));

        let Guruh;
        try {
            const pinoLogger = pino({ level: "fatal" }).child({ level: "fatal" });
            Guruh = guruhConnect({
                version,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pinoLogger),
                },
                printQRInTerminal: false,
                logger: pinoLogger,
                browser: Browsers.macOS("Safari"),
                syncFullHistory: false,
                generateHighQualityLinkPreview: true,
                shouldIgnoreJid: jid => !!jid?.endsWith('@g.us'),
                getMessage: async () => undefined,
                markOnlineOnConnect: true,
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 30000
            });
        } catch (err) {
            console.error(`[pair:${id}] guruhConnect failed:`, err.message);
            if (!responseSent && !res.headersSent) {
                res.status(500).json({ code: "Service is Currently Unavailable" });
                responseSent = true;
            }
            await cleanUpSession();
            return;
        }

        Guruh.ev.on('creds.update', saveCreds);

        Guruh.ev.on("connection.update", async (s) => {
            const { connection, lastDisconnect } = s;
            const statusCode = lastDisconnect?.error?.output?.statusCode;

            if (connection === "open") {
                pairingDone = true;
                try {
                    try { await Guruh.groupAcceptInvite(GC_JID); } catch (_) {}

                    await delay(50000);

                    let sessionData = null;
                    let attempts = 0;
                    while (attempts < 15 && !sessionData) {
                        try {
                            const credsPath = path.join(sessionDir, id, "creds.json");
                            if (fs.existsSync(credsPath)) {
                                const data = fs.readFileSync(credsPath);
                                if (data && data.length > 100) { sessionData = data; break; }
                            }
                            await delay(8000);
                        } catch (_) { await delay(2000); }
                        attempts++;
                    }

                    if (!sessionData) { await cleanUpSession(); return; }

                    const compressedData = zlib.gzipSync(sessionData);
                    const b64data = compressedData.toString('base64');
                    const fullSession = SESSION_PREFIX + b64data;

                    let sessionId;
                    if (isConfigured() && sessionType === 'short') {
                        const shortId = await saveSession(fullSession);
                        sessionId = `${SESSION_PREFIX}${shortId}`;
                    } else {
                        sessionId = fullSession;
                    }

                    await delay(5000);
                    let sessionSent = false, sendAttempts = 0;
                    while (sendAttempts < 5 && !sessionSent) {
                        try {
                            // Send session ID alone as a plain text message
                            await Guruh.sendMessage(Guruh.user.id, { text: sessionId });
                            await delay(1500);
                            // Send info separately
                            await Guruh.sendMessage(Guruh.user.id, {
                                text: `*✅ Session Generated Successfully*\n\n📦 Bot Repo: ${BOT_REPO}\n📢 Channel: ${WA_CHANNEL}\n\n${MSG_FOOTER}`
                            });
                            sessionSent = true;
                            console.log(`[pair:${id}] Session sent successfully`);
                        } catch (sendError) {
                            console.error(`[pair:${id}] Send attempt ${sendAttempts + 1} failed:`, sendError.message);
                            sendAttempts++;
                            if (sendAttempts < 5) await delay(3000);
                        }
                    }

                    await delay(3000);
                    try { await Guruh.ws.close(); } catch (_) {}
                } catch (sessionError) {
                    console.error(`[pair:${id}] Session processing error:`, sessionError.message);
                } finally {
                    await cleanUpSession();
                }

            } else if (connection === "close") {
                if (pairingDone || statusCode === 401 || reconnectCount >= MAX_RECONNECTS) {
                    await cleanUpSession();
                    return;
                }
                reconnectCount++;
                await delay(5000);
                GURUH_PAIR_CODE();
            }
        });

        if (!Guruh.authState.creds.registered) {
            await delay(2000);
            try {
                const code = await Guruh.requestPairingCode(num);
                console.log(`[pair:${id}] Got code: ${code}`);
                if (!responseSent && !res.headersSent) {
                    res.json({ code: code, fallback: sessionType === 'short' && !isConfigured() });
                    responseSent = true;
                }
            } catch (codeErr) {
                console.error(`[pair:${id}] requestPairingCode error:`, codeErr.message);
                if (!responseSent && !res.headersSent) {
                    res.status(500).json({ code: "Failed to generate pairing code" });
                    responseSent = true;
                }
                await cleanUpSession();
            }
        } else {
            console.log(`[pair:${id}] Creds already registered — awaiting reconnect/open`);
        }
    }

    try {
        await GURUH_PAIR_CODE();
    } catch (finalError) {
        console.error(`[pair:${id}] Final error:`, finalError.message);
        await cleanUpSession();
        if (!responseSent && !res.headersSent) {
            res.status(500).json({ code: "Service Error" });
        }
    }
});

module.exports = router;
