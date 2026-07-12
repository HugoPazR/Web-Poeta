// Vercel serverless function. Verifies a Google reCAPTCHA v2 token server-side before
// RegisterPage is allowed to proceed with signUp() — the client-side "token present" check
// alone is only a UX gate, not a real security boundary, since it can't stop a request that
// bypasses the site's UI entirely.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false });
    return;
  }

  const { token } = req.body || {};
  if (!token) {
    res.status(400).json({ success: false });
    return;
  }

  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    console.error('verify-recaptcha: RECAPTCHA_SECRET_KEY is not configured');
    res.status(500).json({ success: false });
    return;
  }

  try {
    const params = new URLSearchParams({ secret, response: token });
    const googleRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    const data = await googleRes.json();
    res.status(200).json({ success: Boolean(data.success) });
  } catch (e) {
    console.error('verify-recaptcha: siteverify request failed', e);
    res.status(502).json({ success: false });
  }
}
