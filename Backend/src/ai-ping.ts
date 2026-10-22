const nKey = process.env.NVIDIA_API_KEY;
const gKey = process.env.LLM_API_KEY;

async function time(label: string, fn: () => Promise<Response>) {
  const t0 = Date.now();
  try {
    const r = await fn();
    console.log(`${label}: HTTP ${r.status} in ${Date.now() - t0}ms`);
    if (!r.ok) console.log((await r.text()).slice(0, 300));
  } catch (e) {
    console.log(`${label}: FAILED after ${Date.now() - t0}ms`, e instanceof Error ? e.message : e);
  }
}

await time('NVIDIA glm-5.3-flash', () =>
  fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${nKey}` },
    body: JSON.stringify({
      model: process.env.NVIDIA_MODEL || 'z-ai/glm-5.3-flash',
      messages: [{ role: 'user', content: 'Reply with the word OK' }],
      max_tokens: 64,
      reasoning_effort: 'low',
    }),
    signal: AbortSignal.timeout(40_000),
  }),
);

await time('Gemini 3.5 flash-lite', () =>
  fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': gKey ?? '' },
    body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply with the word OK' }] }] }),
    signal: AbortSignal.timeout(40_000),
  }),
);