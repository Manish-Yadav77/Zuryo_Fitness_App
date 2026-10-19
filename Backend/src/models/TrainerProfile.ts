import { Schema, model } from 'mongoose';

export interface WeeklySlot {
  weekday: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
}

export interface TimeOff {
  _id?: string;
  from: Date;
  to: Date;
  reason?: string;
}

export interface ITrainerProfile {
  userId: string;
  zoneIds: string[];
  baseLocation: {
    lat: number;
    lng: number;
  };
  rating: number;
  bio?: string;
  isActive: boolean;
  weeklyAvailability: WeeklySlot[];
  timeOff: TimeOff[];
}

const weeklySlotSchema = new Schema<WeeklySlot>(
  {
    weekday: { type: Number, required: true, min: 0, max: 6 },
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  { _id: false },
);

const timeOffSchema = new Schema<TimeOff>({
  from: { type: Date, required: true },
  to: { type: Date, required: true },
  reason: { type: String, trim: true },
});

const trainerProfileSchema = new Schema<ITrainerProfile>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    zoneIds: [{ type: String, required: true }],
    baseLocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    rating: { type: Number, required: true, default: 5.0 },
    bio: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    weeklyAvailability: [weeklySlotSchema],
    timeOff: [timeOffSchema],
  },
  { timestamps: true },
);

export const TrainerProfile = model<ITrainerProfile>('TrainerProfile', trainerProfileSchema);