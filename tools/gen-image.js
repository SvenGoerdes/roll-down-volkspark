// Generate one image through OpenRouter.
// OPENROUTER_API_KEY=… bun tools/gen-image.js <out.png> "<prompt>" [--ref img.jpg]… [--model id]
// Default model: Nano Banana 2.1. For top quality use openai/gpt-image-2.5-sunburst (ADR 0013).
const DEFAULT_MODEL = 'google/gemini-nano-banana-2.1';

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
const key = process.env.OPENROUTER_API_KEY;
if (!out || !prompt || !key) {
  console.error('usage: OPENROUTER_API_KEY=… bun tools/gen-image.js <out.png> "<prompt>" [--ref img]… [--model id]');
  process.exit(1);
}

const dataUrl = async (path) => {
  const file = Bun.file(path);
  const b64 = Buffer.from(await file.arrayBuffer()).toString('base64');
  return `data:${file.type};base64,${b64}`;
};

const content = [{ type: 'text', text: prompt }];
for (const r of refs) content.push({ type: 'image_url', image_url: { url: await dataUrl(r) } });

const request = async () => {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, modalities: ['image', 'text'], messages: [{ role: 'user', content }] }),
  });
  return res.json();
};

// The shared upstream pool often answers 429 for a moment; wait and retry.
let body = await request();
for (let wait = 10; body.error?.code === 429 && wait <= 80; wait *= 2) {
  console.error(`rate-limited, retrying in ${wait}s`);
  await Bun.sleep(wait * 1000);
  body = await request();
}
if (body.error) {
  console.error('error:', JSON.stringify(body.error));
  process.exit(1);
}
const url = body.choices?.[0]?.message?.images?.[0]?.image_url?.url;
if (!url) {
  console.error('no image returned:', body.choices?.[0]?.message?.content);
  process.exit(1);
}
await Bun.write(out, Buffer.from(url.split(',', 2)[1], 'base64'));
console.log(`${out}  (${model}, $${body.usage?.cost ?? '?'})`);
