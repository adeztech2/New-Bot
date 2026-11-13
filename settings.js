const session = process.env.SESSION || '';
const sessionPrefix = process.env.SESSION_PREFIX || 'ADEZ-XMD';
const dev = process.env.OWNER_NUMBER || '254111783552';
const waUsername = process.env.WHATSAPP_USERNAME || 'arnoldadez';
const devUsernames = (process.env.DEV_USERNAMES
    ? process.env.DEV_USERNAMES.split(',').map(u => u.trim().replace(/^@/, '').toLowerCase())
    : ['arnoldadez']
);
const autostatusStatusReplyText = process.env.STATUS_REPLY_TEXT || '✅ Status Viewed By ADEZ XMD';
const botAuthor = process.env.OWNER_NAME || "Arnold Adez";
const botGurl = process.env.BOT_GURL || "https://github.com/arnoldadez/ADEZ-XMD";
const botBotname = process.env.BOTNAME || "ADEZ XMD";
const botPackname = process.env.BOT_PACKNAME || "ADEZ";
const botSessionName = process.env.BOT_SESSION_NAME || "adez-xmd";

module.exports = {
  database, dev, session, sessionPrefix, // add sessionPrefix here
  /* ...rest unchanged... */
};
