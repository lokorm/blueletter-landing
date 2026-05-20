export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Log the signup (always visible in Vercel function logs)
  console.log(`[SIGNUP] ${normalizedEmail} at ${new Date().toISOString()}`);

  // If a webhook URL is configured, forward the signup
  const webhookUrl = process.env.SIGNUP_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          timestamp: new Date().toISOString(),
          source: 'landing-page',
        }),
      });
    } catch (e) {
      console.error('[SIGNUP] Webhook failed:', e.message);
      // Don't fail the signup if webhook fails
    }
  }

  // Generate a deterministic-ish position based on email hash
  const hash = Array.from(normalizedEmail).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const position = 1247 + (hash % 200) + 1;

  return res.status(200).json({
    ok: true,
    position,
    message: "You're on the list.",
  });
}
