import { FitnessAssessment } from '../models/FitnessAssessment.js';
import { SessionRecord } from '../models/SessionRecord.js';
import { env } from '../config/env.js';

export async function generateWorkoutRecommendation(customerId: string) {
  const assessment = await FitnessAssessment.findOne({ customerId }).sort({ createdAt: -1 });
  const pastRecords = await SessionRecord.find({ customerId }).sort({ createdAt: -1 }).limit(5);

  const profileContext = assessment
    ? `Age: ${assessment.age}, Weight: ${assessment.weightKg}kg, Goals: ${assessment.goals.join(', ')}, Level: ${assessment.level}, Preferences: ${assessment.preferences.join(', ')}, Limitations: ${assessment.limitations}`
    : 'New customer without completed assessment profile.';

  const pastWorkoutContext = pastRecords.length > 0
    ? pastRecords.map((r, i) => `Session ${i + 1}: Notes - "${r.trainerNotes || 'N/A'}", Suggested Next - "${r.suggestedNextWorkout || 'N/A'}"`).join('\n')
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

  const apiKey = env.LLM_API_KEY || process.env['LLM_API_KEY'];
  const modelName = env.LLM_MODEL || process.env['LLM_MODEL'] || 'gemini-2.5-flash';

  if (apiKey && apiKey !== 'your_gemini_or_llm_api_key_here') {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        },
      );

      if (response.ok) {
        const data = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return JSON.parse(text);
        }
      }
    } catch (err) {
      console.error('Gemini API call failed, falling back to rule-based engine:', err);
    }
  }

  const level = assessment?.level || 'beginner';
  const goals = assessment?.goals?.join(' & ') || 'General Fitness';

  return {
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
  };
}