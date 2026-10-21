import { FitnessAssessment } from '../models/FitnessAssessment.js';
import { SessionRecord } from '../models/SessionRecord.js';
import { env } from '../config/env.js';

function cleanJsonResponse(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

export async function generateWorkoutRecommendation(customerId: string) {
  const startedAt = Date.now();
  const assessment = await FitnessAssessment.findOne({ customerId }).sort({ createdAt: -1 });
  const pastRecords = await SessionRecord.find({ customerId }).sort({ createdAt: -1 }).limit(5);

  const profileContext = assessment
    ? `Age: ${assessment.age}, Weight: ${assessment.weightKg}kg, Goals: ${assessment.goals.join(', ')}, Level: ${assessment.level}, Preferences: ${assessment.preferences.join(', ')}, Limitations: ${assessment.limitations}`
    : 'New customer without completed assessment profile.';

  const pastWorkoutContext = pastRecords.length > 0
    ? pastRecords.map((r, i) => `Session ${i + 1}: ${r.durationMinutes} min; exercises ${r.exercises.map((e) => `${e.name} ${e.sets}x${e.reps ?? '-'}`).join(', ')}; rating ${r.customerRating ?? 'none'}; notes "${r.trainerNotes || 'N/A'}"; next "${r.suggestedNextWorkout || 'N/A'}"`).join('\n')
    : 'No previous workout records yet.';

  const prompt = `You are a certified fitness coach for Zuryo Fit. Generate a single personalized 60-minute workout recommendation for this customer based on their profile and workout history.

Customer Profile:
${profileContext}

Recent Session Logs:
${pastWorkoutContext}

Return a clean, concise JSON object with the following keys:
- workoutTitle (string)
- focusArea (string)
- warmUp (array of strings)
- mainCircuit (array of objects with 'exercise', 'sets', 'reps')
- coolDown (array of strings)
- coachNote (string)`;

  async function provider(url: string, headers: Record<string, string>, body: unknown) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Provider returned status ${response.status}`);
    return response.json() as Promise<{
      choices?: { message?: { content?: string } }[];
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    }>;
  }

  const enrich = <T extends object>(value: T, source: 'NVIDIA' | 'GEMINI' | 'RULES', model: string) => ({
    ...value,
    source,
    model,
    latencyMs: Date.now() - startedAt,
  });

  // 1. Primary AI Provider: NVIDIA NIM Microservices
  const nvidiaKey = env.NVIDIA_API_KEY;
  const isNvidiaConfigured = nvidiaKey && !nvidiaKey.includes('your-nvidia-api-key');

  if (isNvidiaConfigured) {
    try {
      const baseUrl = (env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(/\/+$/, '');
      const model = env.NVIDIA_MODEL || 'meta/llama-3.2-90b-vision-instruct';

      const data = await provider(
        `${baseUrl}/chat/completions`,
        { Authorization: `Bearer ${nvidiaKey}` },
        {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }
      );

      const text = data.choices?.[0]?.message?.content;
      if (text) {
        return enrich(JSON.parse(cleanJsonResponse(text)), 'NVIDIA', model);
      }
    } catch (err) {
      console.error('NVIDIA recommendation provider failed:', err);
    }
  }

  // 2. Fallback AI Provider: Google Gemini API
  const geminiKey = env.LLM_API_KEY;
  const isGeminiConfigured =
    geminiKey &&
    !geminiKey.includes('your-gemini-api-key') &&
    geminiKey !== 'your_gemini_or_llm_api_key_here';

  if (isGeminiConfigured) {
    try {
      const model = env.LLM_MODEL || 'gemini-2.5-flash';
      const data = await provider(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        { 'x-goog-api-key': geminiKey },
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }
      );

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return enrich(JSON.parse(cleanJsonResponse(text)), 'GEMINI', model);
      }
    } catch (err) {
      console.error('Gemini API call failed, falling back to rule-based engine:', err);
    }
  }

  // 3. Fallback Baseline: Rule-Based Engine
  const level = assessment?.level || 'beginner';
  const goals = assessment?.goals?.join(' & ') || 'General Fitness';

  return enrich(
    {
      workoutTitle: `${level.toUpperCase()} ${goals} Circuit`,
      focusArea: assessment?.preferences?.[0] || 'Full Body Conditioning',
      warmUp: [
        '5 mins Jumping Jacks & Arm Circles',
        '3 mins Dynamic Hip Openers & Bodyweight Squats',
      ],
      mainCircuit: [
        { exercise: 'Goblet Squats / Dumbbell Squats', sets: 4, reps: level === 'advanced' ? 12 : 10 },
        { exercise: 'Push-ups / Dumbbell Chest Press', sets: 3, reps: 10 },
        { exercise: 'Dumbbell Bent-over Rows', sets: 3, reps: 12 },
        { exercise: 'Plank Hold', sets: 3, reps: level === 'advanced' ? 60 : 30 },
      ],
      coolDown: [
        '4 mins Hamstring & Quad Stretches',
        '3 mins Deep Diaphragmatic Breathing',
      ],
      coachNote: `Tailored for ${level} level. Focus on controlled eccentric tempo during compound movements.`,
    },
    'RULES',
    'deterministic-baseline'
  );
}