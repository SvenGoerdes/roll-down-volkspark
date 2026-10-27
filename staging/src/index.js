import backend from '../../worker/src/index.js';
import { createAccessVerifier, privateHeaders } from './access.js';

const json = (data, status) => new Response(JSON.stringify(data), {
  status,
  headers: { ...privateHeaders, 'Content-Type': 'application/json' },
});

export function createStagingWorker(authorize = createAccessVerifier()) {
  return {
    async fetch(request, env) {
      const denied = await authorize(request, env);
      if (denied) return denied;

      const url = new URL(request.url);
      let response;
      if (url.pathname === '/api/ideas') {
        return json({ error: 'Staging: Ideen werden hier nicht veröffentlicht.' }, 409);
      }
      if (['/api/leaderboard', '/api/scores'].includes(url.pathname)) {
        url.pathname = url.pathname.slice('/api'.length);
        const forwarded = new Request(url, request);
        // Browsers omit Origin on same-origin GETs. Only fill that read case;
        // preserve foreign/missing write origins for the backend's rejection.
        if (!forwarded.headers.has('Origin') && ['GET', 'HEAD'].includes(request.method)) forwarded.headers.set('Origin', url.origin);
        response = await backend.fetch(forwarded, {
          LEADERBOARD: env.LEADERBOARD,
          DEV_ORIGINS: new URL(request.url).origin,
        });
      } else if (url.pathname.startsWith('/api/')) {
        return json({ error: 'Nicht gefunden' }, 404);
      } else {
        if (!['GET', 'HEAD'].includes(request.method)) return new Response('Nicht erlaubt', { status: 405, headers: privateHeaders });
        response = await env.ASSETS.fetch(request);
      }

      const headers = new Headers(response.headers);
      for (const [key, value] of Object.entries(privateHeaders)) headers.set(key, value);
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    },
  };
}

export default createStagingWorker();
