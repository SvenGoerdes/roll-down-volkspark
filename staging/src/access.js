import { createRemoteJWKSet, jwtVerify } from 'jose';

const keySets = new Map();
function remoteKeys(domain) {
  if (!keySets.has(domain)) {
    keySets.clear(); // This Worker has one Access application; retain its rotating key cache.
    keySets.set(domain, createRemoteJWKSet(new URL(`${domain}/cdn-cgi/access/certs`), { timeoutDuration: 5000 }));
  }
  return keySets.get(domain);
}

export const privateHeaders = {
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'X-Content-Type-Options': 'nosniff',
};

const deny = (message, status) => new Response(message, {
  status,
  headers: { ...privateHeaders, 'Content-Type': 'text/plain; charset=utf-8' },
});

// Validate on the origin as well as in Cloudflare Access. If Access is removed or
// a hostname is missed, no asset/API becomes public and spoofed headers do not work.
export function createAccessVerifier(keysFor = remoteKeys) {
  return async (request, env) => {
    const domain = (env.STAGING_ACCESS_DOMAIN || '').trim().replace(/\/$/, '');
    const audience = (env.STAGING_ACCESS_AUD || '').trim();
    const email = (env.STAGING_ALLOWED_EMAIL || '').trim().toLowerCase();
    if (!/^https:\/\/[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.cloudflareaccess\.com$/.test(domain)
      || !audience || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return deny('Die private Testversion ist noch nicht freigeschaltet.', 503);
    }
    const token = request.headers.get('Cf-Access-Jwt-Assertion');
    if (!token || token.length > 16384) return deny('Diese Testversion benötigt eine Anmeldung.', 403);
    try {
      const { payload } = await jwtVerify(token, keysFor(domain), {
        issuer: domain,
        audience,
        algorithms: ['RS256'],
        requiredClaims: ['exp', 'iat', 'sub', 'email'],
      });
      if (typeof payload.email !== 'string' || payload.email.toLowerCase() !== email) {
        return deny('Für dieses Konto ist die Testversion nicht freigegeben.', 403);
      }
      return null;
    } catch {
      return deny('Die Anmeldung ist ungültig oder abgelaufen.', 403);
    }
  };
}
