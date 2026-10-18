const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
export const MAX_TOKEN = 2048; // Cloudflare's documented maximum

// Asks Cloudflare whether a Turnstile token is valid. Returns { ok } or { error, status }.
// Network trouble gives 503, not a pass: with a secret set, no check means no entry.
export async function verifyTurnstile(token, secret, ip) {
  if (typeof token !== 'string' || !token || token.length > MAX_TOKEN) {
    return { error: 'Bitte bestätige zuerst, dass du kein Bot bist', status: 400 };
  }
  let data;
  try {
    const form = new URLSearchParams({ secret, response: token });
    if (ip && ip !== 'unknown') form.set('remoteip', ip);
    const res = await fetch(VERIFY_URL, { method: 'POST', body: form, signal: AbortSignal.timeout(5000) });
    data = await res.json();
  } catch (err) {
    console.error('Turnstile', err);
    return { error: 'Prüfung nicht erreichbar – probier es gleich nochmal', status: 503 };
  }
  if (data.success) return { ok: true };
  const old = (data['error-codes'] || []).includes('timeout-or-duplicate');
  return { error: old ? 'Die Prüfung ist abgelaufen – bitte nochmal versuchen' : 'Prüfung fehlgeschlagen – bitte nochmal versuchen', status: 403 };
}
