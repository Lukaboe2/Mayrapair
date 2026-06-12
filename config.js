const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '.env'),
  quiet: true,
  override: false,
});

module.exports = {
    PORT: process.env.PORT || 5000,
    SESSION_PREFIX: process.env.SESSION_PREFIX || "Guruh~",
    GC_JID: process.env.GC_JID || "EyXMwZx0V556mTYY0eMQ5K",
    DATABASE_URL: process.env.DATABASE_URL || "",
    BOT_REPO: process.env.BOT_REPO || "https://github.com/GuruhTech/PANTHERR-X-ULTRA-PAIR",
    WA_CHANNEL: process.env.WA_CHANNEL || "https://whatsapp.com/channel/0029VbCl2UX3rZZilMSvxN1e",
    MSG_FOOTER: process.env.MSG_FOOTER || "> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɢᴜʀᴜʜᴛᴇᴄʜ*",
};
