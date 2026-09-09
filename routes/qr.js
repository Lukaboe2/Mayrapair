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
<html lang="en">
<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    >

    <title>MAYRA-AI | QR CODE</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
    >

    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        :root {
            --bg: #e8eee9;
            --light: #ffffff;
            --dark-shadow: #c7d0ca;
            --green: #00a884;
            --green-dark: #008f72;
            --green-light: #25d366;
            --text: #26332d;
            --muted: #718078;
        }

        body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 22px;

            font-family: 'Inter', sans-serif;
            color: var(--text);

            background:
                radial-gradient(
                    circle at 15% 15%,
                    rgba(255,255,255,0.95),
                    transparent 30%
                ),
                radial-gradient(
                    circle at 90% 85%,
                    rgba(0,168,132,0.08),
                    transparent 30%
                ),
                var(--bg);
        }

        .container {
            width: 100%;
            max-width: 430px;
            text-align: center;

            animation: pageIn .65s ease;
        }

        @keyframes pageIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* LOGO */

        .logo-ring {
            width: 76px;
            height: 76px;

            margin: 0 auto 18px;

            border-radius: 50%;

            display: flex;
            align-items: center;
            justify-content: center;

            background: var(--bg);

            box-shadow:
                10px 10px 20px var(--dark-shadow),
                -10px -10px 20px var(--light);

            color: var(--green);

            animation: floatLogo 3s ease-in-out infinite;
        }

        @keyframes floatLogo {
            0%, 100% {
                transform: translateY(0);
            }

            50% {
                transform: translateY(-4px);
            }
        }

        .logo-ring svg {
            width: 34px;
            height: 34px;

            fill: var(--green);

            filter:
                drop-shadow(2px 2px 3px rgba(0,0,0,0.12));
        }

        /* TITLE */

        h1 {
            font-size: 1.55rem;
            font-weight: 800;

            color: var(--green-dark);

            letter-spacing: -0.5px;

            margin-bottom: 7px;
        }

        .sub {
            max-width: 330px;
            margin: 0 auto 22px;

            color: var(--muted);

            font-size: 0.80rem;
            line-height: 1.6;
        }

        /* STATUS */

        .badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;

            padding: 9px 17px;

            border-radius: 50px;

            background: var(--bg);

            color: var(--green-dark);

            font-size: 0.72rem;
            font-weight: 700;

            box-shadow:
                inset 3px 3px 7px var(--dark-shadow),
                inset -3px -3px 7px var(--light);

            margin-bottom: 22px;
        }

        .dot {
            width: 8px;
            height: 8px;

            border-radius: 50%;

            background: var(--green-light);

            box-shadow:
                0 0 0 4px rgba(37,211,102,0.12),
                0 0 8px rgba(37,211,102,0.55);

            animation: statusPulse 1.5s infinite;
        }

        @keyframes statusPulse {
            0%, 100% {
                opacity: 1;
            }

            50% {
                opacity: .45;
            }
        }

        /* NOTICE */

        .notice {
            margin-bottom: 18px;

            padding: 13px 16px;

            border-radius: 16px;

            background: var(--bg);

            color: #567064;

            text-align: left;

            font-size: 0.73rem;
            line-height: 1.5;

            box-shadow:
                7px 7px 14px var(--dark-shadow),
                -7px -7px 14px var(--light);
        }

        .notice strong {
            color: var(--green-dark);
        }

        /* QR CARD */

        .qr-wrap {
            position: relative;

            padding: 25px;

            border-radius: 28px;

            background: var(--bg);

            box-shadow:
                14px 14px 28px var(--dark-shadow),
                -14px -14px 28px var(--light);

            margin-bottom: 24px;
        }

        .qr-wrap::after {
            content: "";

            position: absolute;

            inset: 10px;

            border-radius: 20px;

            pointer-events: none;

            box-shadow:
                inset 2px 2px 6px rgba(199,208,202,0.55),
                inset -2px -2px 6px rgba(255,255,255,0.75);
        }

        .qr-inner {
            position: relative;
            z-index: 2;

            display: inline-flex;

            padding: 13px;

            border-radius: 19px;

            background: #f7faf8;

            box-shadow:
                7px 7px 15px #c8d1cb,
                -7px -7px 15px #ffffff;
        }

        .qr-wrap img {
            display: block;

            width: 260px;
            height: 260px;

            border-radius: 10px;

            background: white;
        }

        .scan-text {
            position: relative;
            z-index: 3;

            margin-top: 18px;

            color: var(--muted);

            font-size: 0.73rem;
            line-height: 1.55;
        }

        .scan-text strong {
            color: var(--green-dark);
        }

        /* BACK BUTTON */

        .back-btn {
            display: inline-flex;

            align-items: center;
            justify-content: center;

            gap: 8px;

            min-width: 160px;

            padding: 13px 24px;

            border-radius: 15px;

            background: var(--bg);

            color: var(--green-dark);

            font-size: 0.80rem;
            font-weight: 700;

            text-decoration: none;

            box-shadow:
                8px 8px 16px var(--dark-shadow),
                -8px -8px 16px var(--light);

            transition:
                transform .2s ease,
                box-shadow .2s ease,
                color .2s ease;
        }

        .back-btn:hover {
            transform: translateY(-2px);

            color: var(--green);

            box-shadow:
                5px 5px 10px var(--dark-shadow),
                -5px -5px 10px var(--light);
        }

        .back-btn:active {
            transform: translateY(1px);

            box-shadow:
                inset 4px 4px 8px var(--dark-shadow),
                inset -4px -4px 8px var(--light);
        }

        /* FOOTER */

        .footer {
            margin-top: 24px;

            color: #87938d;

            font-size: 0.67rem;
            font-weight: 500;
        }

        .footer span {
            color: var(--green-dark);
            font-weight: 800;
        }

        /* MOBILE */

        @media (max-width: 480px) {

            body {
                padding: 16px;
            }

            .container {
                max-width: 100%;
            }

            .logo-ring {
                width: 68px;
                height: 68px;
            }

            .logo-ring svg {
                width: 30px;
                height: 30px;
            }

            h1 {
                font-size: 1.38rem;
            }

            .sub {
                font-size: 0.77rem;
                margin-bottom: 20px;
            }

            .qr-wrap {
                padding: 19px;
                border-radius: 23px;
            }

            .qr-wrap img {
                width: 220px;
                height: 220px;
            }

            .qr-inner {
                padding: 10px;
                border-radius: 16px;
            }

            .badge {
                margin-bottom: 19px;
            }
        }

        @media (max-width: 350px) {

            .qr-wrap img {
                width: 190px;
                height: 190px;
            }

            .qr-wrap {
                padding: 16px;
            }

            .back-btn {
                width: 100%;
            }
        }
    </style>
</head>

<body>

    <div class="container">

        ${(sessionType === 'short' && !isConfigured()) ? `
        <div class="notice">
            ℹ️ Session store not configured —
            switched to <strong>Long session</strong>.
        </div>
        ` : ''}

        <div class="logo-ring">
            <svg viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
        </div>

        <h1>MAYRA-AI</h1>

        <p class="sub">
            Scan QR in WhatsApp → Linked Devices → Link a Device
        </p>

        <span class="badge">
            <span class="dot"></span>
            Ready to Scan
        </span>

        <div class="qr-wrap">

            <div class="qr-inner">
                <img
                    src="${qrImage}"
                    alt="MAYRA-AI QR Code"
                />
            </div>

            <div class="scan-text">
                Open <strong>WhatsApp</strong> and scan this QR code
                from <strong>Linked Devices</strong>.
            </div>

        </div>

        <a href="./" class="back-btn">
            ← Back to Home
        </a>

        <div class="footer">
            Powered by <span>MAYRA-AI</span>
        </div>

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
                                {
                                    name: 'cta_copy',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: 'Copy Session',
                                        copy_code: shortSession
                                    })
                                },
                                {
                                    name: 'cta_url',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: 'Visit Bot Repo',
                                        url: BOT_REPO
                                    })
                                },
                                {
                                    name: 'cta_url',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: 'Join WaChannel',
                                        url: WA_CHANNEL
                                    })
                                }
                            ];

                        } else {
                            msgText = `*SESSION ID ✅*\n\n${fullSession}`;

                            msgButtons = [
                                {
                                    name: 'cta_copy',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: 'Copy Session',
                                        copy_code: fullSession
                                    })
                                },
                                {
                                    name: 'cta_url',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: 'Visit Bot Repo',
                                        url: BOT_REPO
                                    })
                                },
                                {
                                    name: 'cta_url',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: 'Join WaChannel',
                                        url: WA_CHANNEL
                                    })
                                }
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

                } else if (
                    connection === "close" &&
                    lastDisconnect &&
                    lastDisconnect.error &&
                    lastDisconnect.error.output?.statusCode != 401
                ) {
                    await delay(10000);
                    PANTHER_QR_CODE();
                }
            });

        } catch (err) {
            console.error("Main error:", err);

            if (!responseSent) {
                res.status(500).json({
                    code: "QR Service is Currently Unavailable"
                });

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
            res.status(500).json({
                code: "Service Error"
            });
        }
    }
});

module.exports = router;
