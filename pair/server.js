// ADEZ XMD - Pair site (generates a WhatsApp session ID)
const express = require('express');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const pino = require('pino');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  Browsers,
  delay,
  makeCacheableSignalKeyStore,
  DisconnectReason
} = require('@whiskeysockets/baileys');

const PREFIX = process.env.SESSION_PREFIX || 'ADEZ-XMD';
const PORT = process.env.PAIR_PORT || process.env.PORT || 3001;
const TMP = path.join(__dirname, 'tmp');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

const rm = (p) => { try { fs.rmSync(p, { recursive: true, force: true }); } catch {} };
const makeId = () => Math.random().toString(36).slice(2, 10);

app.get('/code', async (req, res) => {
  const number = String(req.query.number || '').replace(/[^0-9]/g, '');
  if (number.length < 8 || number.length > 15) {
    return res.status(400).json({ error: 'Enter a valid number with country code, no + or spaces.' });
  }

  const dir = path.join(TMP, makeId());
  fs.mkdirSync(dir, { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState(dir);
  let answered = false;
  let sent = false;
  const reply = (status, body) => { if (!answered) { answered = true; res.status(status).json(body); } };

  const start = () => {
    const sock = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }))
      },
      printQRInTerminal: false,
      logger: pino({ level: 'fatal' }),
      browser: Browsers.macOS('Chrome')   // shows as "Chrome" in Linked Devices
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
      if (connection === 'open' && !sent) {
        sent = true;
        try {
          await delay(3000);
          const creds = fs.readFileSync(path.join(dir, 'creds.json'), 'utf8');
          const session = `${PREFIX};;;` + zlib.gzipSync(creds).toString('base64');
          const me = sock.user.id.split(':')[0].split('@')[0] + '@s.whatsapp.net';

          const m = await sock.sendMessage(me, { text: session });
          await sock.sendMessage(me, {
            text: `✅ *ADEZ XMD* session generated.\n\nKeep the session ID above PRIVATE - anyone with it can control your WhatsApp.\nPaste it as the SESSION variable when deploying.\n\nOwner: Arnold Adez (+254111783552)`
          }, { quoted: m });
        } catch (e) {
          console.error('send error', e.message);
        } finally {
          await delay(1500);
          try { await sock.ws.close(); } catch {}
          rm(dir);
        }
      } else if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode;
        if (!sent && code !== DisconnectReason.loggedOut && code !== 401) {
          if (code === 515 || code === 428) return start(); // restart after pairing
        }
        if (!sent) rm(dir);
      }
    });
    return sock;
  };

  try {
    const sock = start();
    if (!state.creds.registered) {
      await delay(2000);
      const raw = await sock.requestPairingCode(number);
      const code = raw?.match(/.{1,4}/g)?.join('-') || raw;
      reply(200, { code });
    } else {
      reply(400, { error: 'Already registered.' });
    }
  } catch (e) {
    console.error(e);
    rm(dir);
    reply(500, { error: 'Could not get a pairing code. Try again in a minute.' });
  }

  setTimeout(() => rm(dir), 3 * 60 * 1000); // clean up abandoned attempts
});

app.listen(PORT, () => console.log(`ADEZ XMD pair site running on port ${PORT}`));
