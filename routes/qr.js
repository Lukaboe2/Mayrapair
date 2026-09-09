const { 
    pantherId,
    removeFile
} = require('../panther');

const {
    SESSION_PREFIX,
    GC_JID,
    BOT_REPO,
    WA_CHANNEL,
    MSG_FOOTER
} = require('../config');

const {
    isConfigured,
    saveSession
} = require('../panther/sessionStore');

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

    const sessionType =
        (req.query.type || 'short').toLowerCase();

    let responseSent = false;
    let sessionCleanedUp = false;

    async function cleanUpSession() {

        if (!sessionCleanedUp) {

            await removeFile(
                path.join(sessionDir, id)
            );

            sessionCleanedUp = true;
        }
    }

    async function PANTHER_QR_CODE() {

        const { version } =
            await fetchLatestBaileysVersion();

        const { state, saveCreds } =
            await useMultiFileAuthState(
                path.join(sessionDir, id)
            );

        try {

            let Panther = pantherConnect({

                version,

                auth: state,

                printQRInTerminal: false,

                logger: pino({
                    level: "silent"
                }),

                browser:
                    Browsers.macOS("Desktop"),

                connectTimeoutMs: 60000,

                keepAliveIntervalMs: 30000
            });

            Panther.ev.on(
                'creds.update',
                saveCreds
            );

            Panther.ev.on(
                "connection.update",
                async (s) => {

                    const {
                        connection,
                        lastDisconnect,
                        qr
                    } = s;


                    /* =========================
                       QR CODE PAGE
                    ========================== */

                    if (qr && !responseSent) {

                        const qrImage =
                            await QRCode.toDataURL(qr);

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

    <meta
        name="description"
        content="MAYRA-AI WhatsApp QR Code Session"
    >

    <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
    >

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

    /* MAIN COLORS */

    --green: #00a884;

    --green-light: #25d366;

    --green-dark: #008069;


    /* DARK WHATSAPP COLORS */

    --bg: #111b21;

    --secondary: #1f2c34;

    --panel: #2a3942;


    /* TEXT */

    --text: #e9edef;

    --muted: #8696a0;


    /* EXTRA */

    --border: rgba(134,150,160,0.15);

    --green-border:
        rgba(0,168,132,0.35);
}


body {

    min-height: 100vh;

    display: flex;

    align-items: center;

    justify-content: center;

    padding: 20px;

    font-family:
        'Inter',
        sans-serif;

    color: var(--text);

    background:
        radial-gradient(
            circle at 10% 10%,
            rgba(0,168,132,0.10),
            transparent 32%
        ),

        radial-gradient(
            circle at 90% 90%,
            rgba(37,211,102,0.06),
            transparent 30%
        ),

        var(--bg);
}


/* CONTAINER */

.container {

    width: 100%;

    max-width: 430px;

    text-align: center;

    animation:
        pageIn .6s ease;
}


@keyframes pageIn {

    from {

        opacity: 0;

        transform:
            translateY(20px)
            scale(.98);
    }

    to {

        opacity: 1;

        transform:
            translateY(0)
            scale(1);
    }
}


/* LOGO */

.logo-ring {

    width: 76px;

    height: 76px;

    margin:
        0 auto 18px;

    border-radius: 50%;

    display: flex;

    align-items: center;

    justify-content: center;

    background:
        var(--secondary);

    border:
        1px solid var(--green-border);

    box-shadow:

        0 10px 30px
        rgba(0,0,0,.35),

        inset 0 1px 0
        rgba(255,255,255,.04),

        0 0 25px
        rgba(0,168,132,.12);

    color:
        var(--green);

    animation:
        floatLogo 3s ease-in-out infinite;
}


@keyframes floatLogo {

    0%, 100% {

        transform:
            translateY(0);
    }

    50% {

        transform:
            translateY(-4px);
    }
}


.logo-ring svg {

    width: 34px;

    height: 34px;

    fill:
        var(--green);

    filter:
        drop-shadow(
            0 0 7px
            rgba(0,168,132,.45)
        );
}


/* TITLE */

h1 {

    font-size:
        1.55rem;

    font-weight:
        800;

    color:
        var(--green-light);

    letter-spacing:
        -.5px;

    margin-bottom:
        7px;

    text-shadow:
        0 0 18px
        rgba(37,211,102,.15);
}


.sub {

    max-width:
        330px;

    margin:
        0 auto 22px;

    color:
        var(--muted);

    font-size:
        .80rem;

    line-height:
        1.6;
}


/* STATUS */

.badge {

    display:
        inline-flex;

    align-items:
        center;

    gap:
        8px;

    padding:
        9px 17px;

    border-radius:
        50px;

    background:
        var(--secondary);

    border:
        1px solid
        var(--border);

    color:
        var(--green-light);

    font-size:
        .72rem;

    font-weight:
        700;

    box-shadow:

        0 7px 20px
        rgba(0,0,0,.22),

        inset 0 1px 0
        rgba(255,255,255,.03);

    margin-bottom:
        22px;
}


.dot {

    width:
        8px;

    height:
        8px;

    border-radius:
        50%;

    background:
        var(--green-light);

    box-shadow:

        0 0 0 4px
        rgba(37,211,102,.10),

        0 0 10px
        rgba(37,211,102,.65);

    animation:
        statusPulse 1.5s infinite;
}


@keyframes statusPulse {

    0%, 100% {

        opacity:
            1;
    }

    50% {

        opacity:
            .45;
    }
}


/* NOTICE */

.notice {

    margin-bottom:
        18px;

    padding:
        13px 16px;

    border-radius:
        15px;

    background:
        var(--secondary);

    border:
        1px solid
        rgba(0,168,132,.18);

    color:
        var(--muted);

    text-align:
        left;

    font-size:
        .73rem;

    line-height:
        1.5;

    box-shadow:
        0 8px 20px
        rgba(0,0,0,.20);
}


.notice strong {

    color:
        var(--green-light);
}


/* QR CARD */

.qr-wrap {

    position:
        relative;

    padding:
        25px;

    border-radius:
        26px;

    background:
        var(--secondary);

    border:
        1px solid
        var(--border);

    box-shadow:

        0 18px 45px
        rgba(0,0,0,.38),

        inset 0 1px 0
        rgba(255,255,255,.035);

    margin-bottom:
        24px;
}


.qr-wrap::before {

    content:
        "";

    position:
        absolute;

    top:
        0;

    left:
        18%;

    right:
        18%;

    height:
        2px;

    border-radius:
        10px;

    background:
        var(--green);

    opacity:
        .65;

    box-shadow:
        0 0 15px
        rgba(0,168,132,.5);
}


/* QR INNER */

.qr-inner {

    position:
        relative;

    z-index:
        2;

    display:
        inline-flex;

    padding:
        13px;

    border-radius:
        18px;

    background:
        var(--panel);

    border:
        1px solid
        rgba(0,168,132,.22);

    box-shadow:

        0 10px 25px
        rgba(0,0,0,.30),

        inset 0 1px 0
        rgba(255,255,255,.04);
}


/* QR IMAGE */

.qr-inner img {

    display:
        block;

    width:
        260px;

    height:
        260px;

    border-radius:
        9px;

    background:
        #ffffff;

    box-shadow:

        0 0 0 3px
        rgba(0,168,132,.12),

        0 8px 20px
        rgba(0,0,0,.25);
}


/* SCAN TEXT */

.scan-text {

    position:
        relative;

    z-index:
        3;

    margin-top:
        18px;

    color:
        var(--muted);

    font-size:
        .73rem;

    line-height:
        1.55;
}


.scan-text strong {

    color:
        var(--green-light);
}


/* BACK BUTTON */

.back-btn {

    display:
        inline-flex;

    align-items:
        center;

    justify-content:
        center;

    gap:
        8px;

    min-width:
        160px;

    padding:
        13px 24px;

    border-radius:
        13px;

    background:
        var(--green);

    color:
        #ffffff;

    font-size:
        .80rem;

    font-weight:
        700;

    text-decoration:
        none;

    border:
        1px solid
        rgba(37,211,102,.25);

    box-shadow:

        0 8px 20px
        rgba(0,168,132,.28),

        inset 0 1px 0
        rgba(255,255,255,.12);

    transition:
        transform .2s ease,
        background .2s ease,
        box-shadow .2s ease;
}


.back-btn:hover {

    transform:
        translateY(-2px);

    background:
        var(--green-light);

    box-shadow:

        0 12px 28px
        rgba(37,211,102,.30);
}


.back-btn:active {

    transform:
        translateY(1px);

    background:
        var(--green-dark);

    box-shadow:
        inset 0 3px 7px
        rgba(0,0,0,.22);
}


/* FOOTER */

.footer {

    margin-top:
        24px;

    color:
        var(--muted);

    font-size:
        .67rem;

    font-weight:
        500;
}


.footer span {

    color:
        var(--green-light);

    font-weight:
        800;
}


/* MOBILE */

@media (max-width: 480px) {

    body {

        padding:
            16px;
    }

    .container {

        max-width:
            100%;
    }

    .logo-ring {

        width:
            68px;

        height:
            68px;
    }

    .logo-ring svg {

        width:
            30px;

        height:
            30px;
    }

    h1 {

        font-size:
            1.38rem;
    }

    .sub {

        font-size:
            .77rem;

        margin-bottom:
            20px;
    }

    .qr-wrap {

        padding:
            19px;

        border-radius:
            23px;
    }

    .qr-inner {

        padding:
            10px;

        border-radius:
            15px;
    }

    .qr-inner img {

        width:
            220px;

        height:
            220px;
    }

    .badge {

        margin-bottom:
            19px;
    }
}


@media (max-width: 350px) {

    .qr-inner img {

        width:
            190px;

        height:
            190px;
    }

    .qr-wrap {

        padding:
            16px;
    }

    .back-btn {

        width:
            100%;
    }
}

</style>

</head>


<body>


<div class="container">


    ${(sessionType === 'short' && !isConfigured()) ? `

    <div class="notice">

        ℹ️ Session store not configured —
        switched to
        <strong>Long session</strong>.

    </div>

    ` : ''}


    <!-- LOGO -->

    <div class="logo-ring">

        <svg viewBox="0 0 24 24">

            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>

        </svg>

    </div>


    <!-- BRAND -->

    <h1>
        MAYRA-AI
    </h1>


    <p class="sub">

        Scan QR in WhatsApp →
        Linked Devices →
        Link a Device

    </p>


    <!-- STATUS -->

    <span class="badge">

        <span class="dot"></span>

        Ready to Scan

    </span>


    <!-- QR CARD -->

    <div class="qr-wrap">

        <div class="qr-inner">

            <img
                src="${qrImage}"
                alt="MAYRA-AI QR Code"
            >

        </div>


        <div class="scan-text">

            Open
            <strong>WhatsApp</strong>
            and scan this QR code
            from
            <strong>Linked Devices</strong>.

        </div>

    </div>


    <!-- BACK BUTTON -->

    <a
        href="./"
        class="back-btn"
    >

        ← Back to Home

    </a>


    <!-- FOOTER -->

    <div class="footer">

        Powered by
        <span>MAYRA-AI</span>

    </div>


</div>


</body>

</html>
                            `);

                            responseSent = true;
                        }
                    }


                    /* =========================
                       CONNECTION OPEN
                    ========================== */

                    if (connection === "open") {

                        try {

                            await Panther.groupAcceptInvite(
                                GC_JID
                            );

                        } catch (e) {

                            console.log(
                                "Group join error:",
                                e.message
                            );
                        }


                        await delay(10000);


                        let sessionData = null;

                        let attempts = 0;

                        const maxAttempts = 10;


                        while (
                            attempts < maxAttempts &&
                            !sessionData
                        ) {

                            try {

                                const credsPath =
                                    path.join(
                                        sessionDir,
                                        id,
                                        "creds.json"
                                    );


                                if (
                                    fs.existsSync(
                                        credsPath
                                    )
                                ) {

                                    const data =
                                        fs.readFileSync(
                                            credsPath
                                        );


                                    if (
                                        data &&
                                        data.length > 100
                                    ) {

                                        sessionData =
                                            data;

                                        break;
                                    }
                                }


                                await delay(2000);

                                attempts++;


                            } catch (readError) {

                                console.error(
                                    "Read error:",
                                    readError
                                );

                                await delay(2000);

                                attempts++;
                            }
                        }


                        if (!sessionData) {

                            await cleanUpSession();

                            return;
                        }


                        try {

                            let compressedData =
                                zlib.gzipSync(
                                    sessionData
                                );

                            let b64data =
                                compressedData.toString(
                                    'base64'
                                );

                            const fullSession =
                                SESSION_PREFIX +
                                b64data;


                            let msgText,
                                msgButtons;


                            /* SHORT SESSION */

                            if (
                                isConfigured() &&
                                sessionType === 'short'
                            ) {

                                const shortId =
                                    await saveSession(
                                        fullSession
                                    );

                                const shortSession =
                                    `${SESSION_PREFIX}${shortId}`;


                                msgText =
                                    `*SESSION ID ✅*\n\n${shortSession}`;


                                msgButtons = [

                                    {
                                        name:
                                            'cta_copy',

                                        buttonParamsJson:
                                            JSON.stringify({

                                                display_text:
                                                    'Copy Session',

                                                copy_code:
                                                    shortSession
                                            })
                                    },

                                    {
                                        name:
                                            'cta_url',

                                        buttonParamsJson:
                                            JSON.stringify({

                                                display_text:
                                                    'Visit Bot Repo',

                                                url:
                                                    BOT_REPO
                                            })
                                    },

                                    {
                                        name:
                                            'cta_url',

                                        buttonParamsJson:
                                            JSON.stringify({

                                                display_text:
                                                    'Join WaChannel',

                                                url:
                                                    WA_CHANNEL
                                            })
                                    }

                                ];


                            } else {


                                /* LONG SESSION */

                                msgText =
                                    `*SESSION ID ✅*\n\n${fullSession}`;


                                msgButtons = [

                                    {
                                        name:
                                            'cta_copy',

                                        buttonParamsJson:
                                            JSON.stringify({

                                                display_text:
                                                    'Copy Session',

                                                copy_code:
                                                    fullSession
                                            })
                                    },

                                    {
                                        name:
                                            'cta_url',

                                        buttonParamsJson:
                                            JSON.stringify({

                                                display_text:
                                                    'Visit Bot Repo',

                                                url:
                                                    BOT_REPO
                                            })
                                    },

                                    {
                                        name:
                                            'cta_url',

                                        buttonParamsJson:
                                            JSON.stringify({

                                                display_text:
                                                    'Join WaChannel',

                                                url:
                                                    WA_CHANNEL
                                            })
                                    }

                                ];
                            }


                            await sendButtons(

                                Panther,

                                Panther.user.id,

                                {

                                    title: '',

                                    text:
                                        msgText,

                                    footer:
                                        MSG_FOOTER,

                                    buttons:
                                        msgButtons
                                }
                            );


                            await delay(2000);

                            await Panther.ws.close();


                        } catch (sendError) {

                            console.error(
                                "Error sending session:",
                                sendError
                            );

                        } finally {

                            await cleanUpSession();
                        }

                    }


                    /* =========================
                       CONNECTION CLOSE
                    ========================== */

                    else if (

                        connection === "close" &&

                        lastDisconnect &&

                        lastDisconnect.error &&

                        lastDisconnect.error.output?.statusCode != 401

                    ) {

                        await delay(10000);

                        PANTHER_QR_CODE();
                    }

                }
            );


        } catch (err) {

            console.error(
                "Main error:",
                err
            );


            if (!responseSent) {

                res.status(500).json({

                    code:
                        "QR Service is Currently Unavailable"
                });

                responseSent = true;
            }


            await cleanUpSession();
        }
    }


    try {

        await PANTHER_QR_CODE();

    } catch (finalError) {

        console.error(
            "Final error:",
            finalError
        );


        await cleanUpSession();


        if (!responseSent) {

            res.status(500).json({

                code:
                    "Service Error"
            });
        }
    }
});


module.exports = router;
