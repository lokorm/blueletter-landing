export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const timestamp = new Date().toISOString();

  console.log(`[SIGNUP] ${normalizedEmail} at ${timestamp}`);

  // Forward to Google Sheets via Apps Script web app
  const sheetsUrl = process.env.GOOGLE_SHEETS_URL;
  if (sheetsUrl) {
    try {
      await fetch(sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          timestamp,
          source: 'landing-page',
        }),
      });
    } catch (e) {
      console.error('[SIGNUP] Google Sheets write failed:', e.message);
    }
  }

  // Optional secondary webhook (Zapier, Make, etc.)
  const webhookUrl = process.env.SIGNUP_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          timestamp,
          source: 'landing-page',
        }),
      });
    } catch (e) {
      console.error('[SIGNUP] Webhook failed:', e.message);
    }
  }

  const hash = Array.from(normalizedEmail).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const position = 1247 + (hash % 200) + 1;

  return res.status(200).json({
    ok: true,
    position,
    message: "You're on the list.",
  });
}
