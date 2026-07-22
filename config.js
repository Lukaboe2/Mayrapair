const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '.env'),
  quiet: true,
  override: false,
});

module.exports = {
    PORT: process.env.PORT || 50900,
    SESSION_PREFIX: process.env.SESSION_PREFIX || "GURU~",
    GC_JID: process.env.GC_JID || "120363423900965397@g.us",
    DATABASE_URL: process.env.DATABASE_URL || "",
    BOT_REPO: process.env.BOT_REPO || "https://github.com/GuruhTech/ULTRA-GURU",
    WA_CHANNEL: process.env.WA_CHANNEL || "https://whatsapp.com/channel/0029VbCWYqLL2ATzi4QP901q",
    HOST_LINK: process.env.HOST_LINK || "https://freehost.gurutech.top",
    MSG_FOOTER: process.env.MSG_FOOTER || "> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴜʟᴛʀᴀ ɢᴜʀᴜ ᴍᴅ*",
    GC_INVITE: process.env.GC_INVITE || "https://whatsapp.com/channel/0029VbCWYqLL2ATzi4QP901q",
    CHANNEL_JID: process.env.CHANNEL_JID || "120363408668355773@newsletter",
};
