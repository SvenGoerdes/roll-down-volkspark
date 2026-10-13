// Local static server: bun tools/serve.js → http://127.0.0.1:8765
// Not python's http.server: it drops parallel module requests.
const root = new URL('..', import.meta.url).pathname;

Bun.serve({
  port: 8765,
  hostname: '127.0.0.1',
  async fetch(req) {
    let p = new URL(req.url).pathname;
    if (p.endsWith('/')) p += 'index.html';
    const file = Bun.file(root + decodeURIComponent(p).replace(/^\/+/, ''));
    if (!(await file.exists())) return new Response('not found', { status: 404 });
    return new Response(file, { headers: { 'Cache-Control': 'no-store' } });
  },
});
console.log('http://127.0.0.1:8765/');
