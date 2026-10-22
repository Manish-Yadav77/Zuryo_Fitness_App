import { FitnessAssessment } from '../models/FitnessAssessment.js';
import { SessionRecord } from '../models/SessionRecord.js';
import { env } from '../config/env.js';

interface WorkoutPlan {
  workoutTitle: string;
  focusArea: string;
  warmUp: string[];
  mainCircuit: { exercise: string; sets: number; reps: number }[];
  coolDown: string[];
  coachNote: string;
}

type Source = 'NVIDIA' | 'GEMINI' | 'RULES';

// Must stay BELOW the frontend timeout for this call (55s).
const TOTAL_BUDGET_MS = 35_000;

class ProviderError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function extractAndParseJson(text: unknown): WorkoutPlan | null {
  if (typeof text !== 'string' || !text) return null;

  let cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/```(?:json)?/gi, '')
    .trim();

  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first !== -1 && last > first) cleaned = cleaned.slice(first, last + 1);

  try {
    const parsed = JSON.parse(cleaned);
    if (
      parsed &&
      typeof parsed.workoutTitle === 'string' &&
      Array.isArray(parsed.warmUp) &&
      Array.isArray(parsed.mainCircuit) &&
      parsed.mainCircuit.length > 0
    ) {
      return {
        workoutTitle: parsed.workoutTitle,
        focusArea: parsed.focusArea || 'General Fitness',
        warmUp: parsed.warmUp.map(String),
        mainCircuit: parsed.mainCircuit.map((item: any) => ({
          exercise: String(item.exercise || 'Exercise'),
          sets: Number(item.sets) || 3,
          reps: Number(item.reps) || 10,
        })),
        coolDown: Array.isArray(parsed.coolDown) ? parsed.coolDown.map(String) : ['5 mins light stretching'],
        coachNote: parsed.coachNote || 'Maintain proper form throughout all sets.',
      };
    }
  } catch {
    // fall through
  }
  return null;
}

async function callApi(url: string, headers: Record<string, string>, body: unknown, signal: AbortSignal) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new ProviderError(response.status, `HTTP ${response.status}: ${errText.slice(0, 300)}`);
  }
  return (await response.json()) as any;
}

/** Tries the full body first; if the provider rejects an optional param (HTTP 400), retries with the plain body. */
async function callWithPlainRetry(
  url: string,
  headers: Record<string, string>,
  fullBody: unknown,
  plainBody: unknown,
  signal: AbortSignal,
) {
  try {
    return await callApi(url, headers, fullBody, signal);
  } catch (err) {
    if (err instanceof ProviderError && err.status === 400 && !signal.aborted) {
      return await callApi(url, headers, plainBody, signal);
    }
    throw err;
  }
}

const inFlight = new Map<string, Promise<unknown>>();

/** Double-clicks / refresh spam share one run instead of burning free-tier quota. NEVER throws. */
export function generateWorkoutRecommendation(customerId: string) {
  const existing = inFlight.get(customerId);
  if (existing) return existing as ReturnType<typeof run>;
  const p = run(customerId).finally(() => inFlight.delete(customerId));
  inFlight.set(customerId, p);
  return p;
}

interface Attempt {
  source: 'NVIDIA' | 'GEMINI';
  model: string;
  capMs: number;
  call: (signal: AbortSignal) => Promise<string | undefined>;
}

function rulePlan(level: string, goals: string, focus: string): WorkoutPlan {
  return {
    workoutTitle: `${level.toUpperCase()} ${goals} Circuit`,
    focusArea: focus,
    warmUp: ['5 mins Jumping Jacks & Arm Circles', '3 mins Dynamic Hip Openers & Bodyweight Squats'],
    mainCircuit: [
      { exercise: 'Goblet Squats / Dumbbell Squats', sets: 4, reps: level === 'advanced' ? 12 : 10 },
      { exercise: 'Push-ups / Dumbbell Chest Press', sets: 3, reps: 10 },
      { exercise: 'Dumbbell Bent-over Rows', sets: 3, reps: 12 },
      { exercise: 'Plank Hold', sets: 3, reps: level === 'advanced' ? 60 : 30 },
    ],
    coolDown: ['4 mins Hamstring & Quad Stretches', '3 mins Deep Diaphragmatic Breathing'],
    coachNote: `Tailored for ${level} level. Focus on controlled tempo during compound movements.`,
  };
}

async function run(customerId: string) {
  const startedAt = Date.now();
  const enrich = (value: WorkoutPlan, source: Source, model: string) => ({
    ...value,
    source,
    model,
    latencyMs: Date.now() - startedAt,
  });

  let assessment: Awaited<ReturnType<typeof FitnessAssessment.findOne>> | null = null;
  let pastRecords: any[] = [];
  try {
    assessment = await FitnessAssessment.findOne({ customerId }).sort({ createdAt: -1 });
    pastRecords = await SessionRecord.find({ customerId }).sort({ createdAt: -1 }).limit(5);
  } catch (err) {
    console.warn('[AI] DB read failed, continuing with defaults:', err instanceof Error ? err.message : err);
  }

  const level = assessment?.level || 'beginner';
  const goals = assessment?.goals?.join(' & ') || 'General Fitness';
  const focus = assessment?.preferences?.[0] || 'Full Body Conditioning';
  const fallback = () => enrich(rulePlan(level, goals, focus), 'RULES', 'deterministic-baseline');

  try {
    const profileContext = assessment
      ? `Age: ${assessment.age}, Weight: ${assessment.weightKg}kg, Goals: ${assessment.goals.join(', ')}, Level: ${assessment.level}, Preferences: ${(assessment.preferences ?? []).join(', ')}, Limitations: ${assessment.limitations || 'None'}`
      : 'New customer without completed assessment profile.';

    const pastWorkoutContext =
      pastRecords.length > 0
        ? pastRecords
            .map(
              (r, i) =>
                `Session ${i + 1}: ${r.durationMinutes} min; exercises ${(r.exercises ?? [])
                  .map((e: any) => `${e.name} ${e.sets}x${e.reps ?? '-'}`)
                  .join(', ')}; rating ${r.customerRating ?? 'none'}`,
            )
            .join('\n')
        : 'No previous workout records yet.';

    const prompt = `You are a certified fitness coach. Generate ONE personalized 60-minute workout for this customer.

Customer Profile:
${profileContext}

Recent Sessions:
${pastWorkoutContext}

Rules: 2-3 warm-up items, 4-5 main exercises, 2 cool-down items, coachNote under 25 words. Short strings only.
Return ONLY raw JSON (no markdown, no explanation) with exactly this schema:
{"workoutTitle":"string","focusArea":"string","warmUp":["string"],"mainCircuit":[{"exercise":"string","sets":3,"reps":10}],"coolDown":["string"],"coachNote":"string"}`;

    // ---- NVIDIA lane (GLM first, small fast model last) ---------------------------
    const nvidiaLane: Attempt[] = [];
    const nvidiaKey = env.NVIDIA_API_KEY?.trim();
    if (nvidiaKey && !nvidiaKey.includes('your-nvidia-api-key')) {
      const baseUrl = (env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(/\/+$/, '');
      const models = [
        env.NVIDIA_MODEL || 'z-ai/glm-5.2',
        'z-ai/glm-5.2',
        'z-ai/glm-5.1',
        'nvidia/nemotron-3-nano-30b-a3b',
      ].filter((m, i, arr) => arr.indexOf(m) === i);

      for (const model of models) {
        nvidiaLane.push({
          source: 'NVIDIA',
          model,
          capMs: 12_000,
          call: async (signal) => {
            const base = {
              model,
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.2,
              max_tokens: 1024,
              stream: false,
            };
            const data = await callWithPlainRetry(
              `${baseUrl}/chat/completions`,
              { Authorization: `Bearer ${nvidiaKey}`, Accept: 'application/json' },
              { ...base, chat_template_kwargs: { enable_thinking: false } }, // turn off slow reasoning
              base,
              signal,
            );
            return data.choices?.[0]?.message?.content;
          },
        });
      }
    }

    // ---- Gemini lane (best fast model, then lite) ---------------------------------
    const geminiLane: Attempt[] = [];
    const geminiKey = env.LLM_API_KEY?.trim();
    if (geminiKey && !geminiKey.includes('your-gemini-api-key') && geminiKey !== 'your_gemini_or_llm_api_key_here') {
      const candidates: { model: string; capMs: number; thinking: boolean }[] = [
        { model: env.LLM_MODEL || 'gemini-3.8-flash', capMs: 15_000, thinking: true },
        { model: 'gemini-3.5-flash-lite', capMs: 12_000, thinking: false },
        { model: 'gemini-3.6-flash', capMs: 12_000, thinking: false },
      ].filter((m, i, arr) => arr.findIndex((x) => x.model === m.model) === i);

      for (const g of candidates) {
        geminiLane.push({
          source: 'GEMINI',
          model: g.model,
          capMs: g.capMs,
          call: async (signal) => {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${g.model}:generateContent`;
            const headers = { 'x-goog-api-key': geminiKey };
            const gen = { responseMimeType: 'application/json', temperature: 0.2, maxOutputTokens: 1536 };
            const contents = [{ role: 'user', parts: [{ text: prompt }] }];
            const data = await callWithPlainRetry(
              url,
              headers,
              {
                contents,
                generationConfig: { ...gen, ...(g.thinking ? { thinkingConfig: { thinkingLevel: 'low' } } : {}) },
              },
              { contents, generationConfig: gen },
              signal,
            );
            const parts: { text?: string; thought?: boolean }[] = data.candidates?.[0]?.content?.parts ?? [];
            return parts.filter((p) => !p.thought).map((p) => p.text ?? '').join('');
          },
        });
      }
    }

    // ---- Race both lanes at once inside one deadline ------------------------------
    const controller = new AbortController();
    const deadlineTimer = setTimeout(() => controller.abort(), TOTAL_BUDGET_MS);

    async function runLane(lane: Attempt[]) {
      for (const a of lane) {
        if (controller.signal.aborted) break;
        const t0 = Date.now();
        try {
          const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(a.capMs)]);
          const text = await a.call(signal);
          const plan = extractAndParseJson(text);
          if (plan) {
            console.log(`[AI] ${a.source} ${a.model} OK in ${Date.now() - t0}ms`);
            return { plan, source: a.source, model: a.model };
          }
          console.warn(`[AI] ${a.source} ${a.model} unparseable output after ${Date.now() - t0}ms`);
        } catch (err) {
          if (controller.signal.aborted) break;
          const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
          console.warn(`[AI] ${a.source} ${a.model} failed after ${Date.now() - t0}ms (${msg.slice(0, 200)})`);
        }
      }
      throw new Error('lane exhausted');
    }

    const lanes: Promise<{ plan: WorkoutPlan; source: 'NVIDIA' | 'GEMINI'; model: string }>[] = [];
    if (geminiLane.length) lanes.push(runLane(geminiLane));
    if (nvidiaLane.length) lanes.push(runLane(nvidiaLane));

    try {
      if (lanes.length > 0) {
        const winner = await Promise.any(lanes);
        return enrich(winner.plan, winner.source, winner.model);
      }
    } catch {
      console.warn('[AI] All AI providers failed or timed out, using rule-based plan');
    } finally {
      clearTimeout(deadlineTimer);
      controller.abort();
    }
  } catch (err) {
    console.error('[AI] Unexpected error, using rule-based plan:', err);
  }

  return fallback();
}