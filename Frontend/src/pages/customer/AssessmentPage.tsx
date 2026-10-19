import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { assessmentApi } from '@/api/assessment.api';
import { societyApi } from '@/api/society.api';
import type { FitnessLevel } from '@/types/assessment';
import type { Society } from '@/types/society';
import { parseApiError } from '@/api/client';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

const GOAL_OPTIONS = ['Fat Loss', 'Muscle Gain', 'Strength', 'Endurance', 'Flexibility & Mobility', 'General Fitness'];
const PREFERENCE_OPTIONS = ['HIIT', 'Strength Training', 'Yoga', 'Cardio', 'Bodyweight / Calisthenics', 'Boxing / Kickboxing'];

export default function AssessmentPage() {
  const [societies, setSocieties] = useState<Society[]>([]);
  const [societyId, setSocietyId] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState<number | ''>(25);
  const [weightKg, setWeightKg] = useState<number | ''>(68);
  const [goals, setGoals] = useState<string[]>(['General Fitness']);
  const [level, setLevel] = useState<FitnessLevel>('beginner');
  const [preferences, setPreferences] = useState<string[]>(['Strength Training']);
  const [limitations, setLimitations] = useState('');

  const [version, setVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [socList, myData] = await Promise.all([
          societyApi.getSocieties(),
          assessmentApi.getMine(),
        ]);
        setSocieties(socList);
        if (socList.length > 0 && !myData.profile) {
          setSocietyId(socList[0]._id);
        }

        if (myData.profile) {
          const sId = typeof myData.profile.societyId === 'object' ? myData.profile.societyId._id : myData.profile.societyId;
          setSocietyId(sId);
          setFlatNumber(myData.profile.flatNumber ?? '');
          setPhone(myData.profile.phone ?? '');
        }

        if (myData.assessment) {
          setAge(myData.assessment.age);
          setWeightKg(myData.assessment.weightKg);
          setGoals(myData.assessment.goals);
          setLevel(myData.assessment.level);
          setPreferences(myData.assessment.preferences);
          setLimitations(myData.assessment.limitations ?? '');
          setVersion(myData.assessment.version);
        }
      } catch (err) {
        setError(parseApiError(err).message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function toggleItem(list: string[], setList: (val: string[]) => void, item: string) {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!societyId) {
      setError('Please select your residential society');
      return;
    }
    if (goals.length === 0) {
      setError('Please select at least one fitness goal');
      return;
    }

    setSubmitting(true);
    try {
      const res = await assessmentApi.submit({
        societyId,
        flatNumber,
        phone,
        age: Number(age),
        weightKg: Number(weightKg),
        goals,
        level,
        preferences,
        limitations,
      });
      setVersion(res.assessment.version);
      setSuccessMsg(`Fitness assessment saved successfully (Version ${res.assessment.version}).`);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="py-10 text-center text-slate-500">Loading fitness profile...</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fitness Assessment</h1>
          <p className="text-sm text-slate-500">Help trainers customize your workouts by sharing your goals and health profile.</p>
        </div>
        {version && <Badge tone="emerald">Version {version}</Badge>}
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {successMsg && <Alert tone="success">{successMsg}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">1. Residence & Contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Society</label>
              <select
                value={societyId}
                onChange={(e) => setSocietyId(e.target.value)}
                className="block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500"
              >
                <option value="">Select your society</option>
                {societies.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.address})
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Flat / House Number"
              placeholder="e.g. B-402"
              value={flatNumber}
              onChange={(e) => setFlatNumber(e.target.value)}
            />
          </div>
          <Input
            label="Phone Number"
            placeholder="e.g. +91 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Card>

        <Card className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">2. Body Metrics & Experience</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Age"
              type="number"
              min={10}
              max={100}
              value={age}
              onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
            />
            <Input
              label="Weight (kg)"
              type="number"
              min={20}
              max={300}
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Experience Level</label>
            <div className="grid grid-cols-3 gap-3">
              {(['beginner', 'intermediate', 'advanced'] as FitnessLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={`rounded-xl border py-2.5 text-center text-sm font-medium capitalize transition ${
                    level === lvl
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">3. Goals & Preferences</h2>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Fitness Goals</label>
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map((g) => {
                const active = goals.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleItem(goals, setGoals, g)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-medium transition ${
                      active
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Workout Preferences</label>
            <div className="flex flex-wrap gap-2">
              {PREFERENCE_OPTIONS.map((p) => {
                const active = preferences.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggleItem(preferences, setPreferences, p)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-medium transition ${
                      active
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Medical Limitations or Injuries (Optional)</label>
            <textarea
              rows={3}
              placeholder="e.g. Mild lower back pain, recovering from knee surgery"
              value={limitations}
              onChange={(e) => setLimitations(e.target.value)}
              className="block w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
            />
          </div>
        </Card>

        <Button type="submit" fullWidth loading={submitting}>
          Save Assessment
        </Button>
      </form>
    </div>
  );
}