// line 12
const { session, sessionPrefix } = require('../settings');

// inside loadSession()
const [header, b64data] = session.split(';;;');
if (header !== sessionPrefix || !b64data) {
    throw new Error(`❌ Invalid session format. Expected '${sessionPrefix};;;.....'`);
}
