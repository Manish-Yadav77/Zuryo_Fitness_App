import { useState } from "react";
import { recordApi } from "@/api/record.api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { parseApiError } from "@/api/client";

export function SessionRecordForm({
  bookingId,
  onSaved,
}: {
  bookingId: string;
  onSaved?: () => void;
}) {
  const [exercise, setExercise] = useState({
    name: "",
    sets: "3",
    reps: "10",
    weightKg: "",
  });
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [notes, setNotes] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await recordApi.saveLog({
        bookingId,
        durationMinutes: Number(durationMinutes) || 60,
        exercises: [
          {
            name: exercise.name,
            sets: Number(exercise.sets),
            reps: Number(exercise.reps),
            weightKg: exercise.weightKg ? Number(exercise.weightKg) : undefined,
          },
        ],
        trainerNotes: notes,
        suggestedNextWorkout: next,
      });
      setMessage("Workout record saved.");
      onSaved?.();
    } catch (err) {
      setMessage(parseApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-900">Log Workout Session</p>
      </div>

      {message && (
        <Alert tone={message === "Workout record saved." ? "success" : "error"}>
          {message}
        </Alert>
      )}

      <div className="grid gap-2 sm:grid-cols-5">
        <div className="sm:col-span-2">
          <Input
            label="Exercise Name"
            required
            value={exercise.name}
            onChange={(e) => setExercise({ ...exercise, name: e.target.value })}
          />
        </div>
        <Input
          label="Sets"
          type="number"
          required
          value={exercise.sets}
          onChange={(e) => setExercise({ ...exercise, sets: e.target.value })}
        />
        <Input
          label="Reps"
          type="number"
          required
          value={exercise.reps}
          onChange={(e) => setExercise({ ...exercise, reps: e.target.value })}
        />
        <Input
          label="Duration (Mins)"
          type="number"
          required
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(e.target.value)}
        />
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Trainer notes (e.g. focused on posture and core strength)"
        className="min-h-18 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
      />
      <input
        value={next}
        onChange={(e) => setNext(e.target.value)}
        placeholder="Suggested next workout"
        className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
      />
      <Button type="submit" loading={busy}>
        Save Session Record
      </Button>
    </form>
  );
}