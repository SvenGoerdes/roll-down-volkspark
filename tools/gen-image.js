// Generate one image.
// bun tools/gen-image.js <out.png> "<prompt>" [--ref img.jpg]… [--model id]
// Default: Nano Banana 2.1 straight from Google (GEMINI_API_KEY). Any other model id goes
// through OpenRouter (OPENROUTER_API_KEY), e.g. openai/gpt-image-2.5-sunburst (ADR 0013).
const DEFAULT_MODEL = 'gemini/gemini-nano-banana-2.1';

const args = process.argv.slice(2);
const refs = [];
let model = DEFAULT_MODEL;
const rest = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--ref') refs.push(args[++i]);
  else if (args[i] === '--model') model = args[++i];
  else rest.push(args[i]);
}
const [out, prompt] = rest;
if (!out || !prompt) {
  console.error('usage: bun tools/gen-image.js <out.png> "<prompt>" [--ref img]… [--model id]');
  process.exit(1);
}

const readRef = async (path) => {
  const file = Bun.file(path);
  return { mime: file.type, b64: Buffer.from(await file.arrayBuffer()).toString('base64') };
};

// Each backend returns { error } or { b64, cost }.
async function viaGoogle(id, images) {
  const parts = [{ text: prompt }, ...images.map((r) => ({ inlineData: { mimeType: r.mime, data: r.b64 } }))];
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${id}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }] }),
  });
  const body = await res.json();
  if (body.error) return { error: body.error };
  const img = body.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  return img ? { b64: img.inlineData.data, cost: 'Google billing' } : { error: { message: 'no image returned' } };
}

async function viaOpenRouter(id, images) {
  const content = [{ type: 'text', text: prompt }, ...images.map((r) => ({ type: 'image_url', image_url: { url: `data:${r.mime};base64,${r.b64}` } }))];
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: id, modalities: ['image', 'text'], messages: [{ role: 'user', content }] }),
  });
  const body = await res.json();
  if (body.error) return { error: body.error };
  const url = body.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  return url ? { b64: url.split(',', 2)[1], cost: `$${body.usage?.cost ?? '?'}` } : { error: { message: 'no image returned' } };
}

const google = model.startsWith('gemini/');
const keyName = google ? 'GEMINI_API_KEY' : 'OPENROUTER_API_KEY';
if (!process.env[keyName]) {
  console.error(`${keyName} is not set`);
  process.exit(1);
}
const images = await Promise.all(refs.map(readRef));
const request = () => (google ? viaGoogle(model.slice(7), images) : viaOpenRouter(model, images));

// Shared quotas often answer 429 for a moment; wait and retry.
let result = await request();
for (let wait = 10; result.error?.code === 429 && wait <= 80; wait *= 2) {
  console.error(`rate-limited, retrying in ${wait}s`);
  await Bun.sleep(wait * 1000);
  result = await request();
}
if (result.error) {
  console.error('error:', JSON.stringify(result.error));
  process.exit(1);
}
await Bun.write(out, Buffer.from(result.b64, 'base64'));
console.log(`${out}  (${model}, ${result.cost})`);
