import { Schema, model, Types } from 'mongoose';

export interface ExerciseItem {
  name: string;
  sets: number;
  reps?: number;
  weightKg?: number;
}

export interface ISessionRecord {
  bookingId: Types.ObjectId | string;
  customerId: string;
  trainerId: string;
  durationMinutes: number;
  exercises: ExerciseItem[];
  trainerNotes?: string;
  suggestedNextWorkout?: string;
  customerRating?: number;
  customerFeedback?: string;
}

const exerciseSchema = new Schema<ExerciseItem>(
  {
    name: { type: String, required: true },
    sets: { type: Number, required: true },
    reps: { type: Number },
    weightKg: { type: Number },
  },
  { _id: false },
);

const sessionRecordSchema = new Schema<ISessionRecord>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    customerId: { type: String, required: true, index: true },
    trainerId: { type: String, required: true, index: true },
    durationMinutes: { type: Number, required: true, default: 60 },
    exercises: [exerciseSchema],
    trainerNotes: { type: String },
    suggestedNextWorkout: { type: String },
    customerRating: { type: Number, min: 1, max: 5 },
    customerFeedback: { type: String },
  },
  { timestamps: true },
);

export const SessionRecord = model<ISessionRecord>('SessionRecord', sessionRecordSchema);