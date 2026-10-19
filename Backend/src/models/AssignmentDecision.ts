import { Schema, model, Types } from 'mongoose';

export interface CandidateEvaluation {
  trainerId: string;
  trainerName: string;
  distanceKm: number;
  sessionsToday: number;
  rating: number;
  eligible: boolean;
  reason?: string;
}

export interface IAssignmentDecision {
  bookingId?: Types.ObjectId | string;
  requestedAt: Date;
  slotStart: Date;
  societyId: Types.ObjectId | string;
  candidates: CandidateEvaluation[];
  chosenTrainerId?: string;
  outcome: 'ASSIGNED' | 'NO_TRAINER';
}

const candidateEvaluationSchema = new Schema<CandidateEvaluation>(
  {
    trainerId: { type: String, required: true },
    trainerName: { type: String, required: true },
    distanceKm: { type: Number, required: true },
    sessionsToday: { type: Number, required: true },
    rating: { type: Number, required: true },
    eligible: { type: Boolean, required: true },
    reason: { type: String },
  },
  { _id: false },
);

const assignmentDecisionSchema = new Schema<IAssignmentDecision>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    requestedAt: { type: Date, required: true, default: Date.now },
    slotStart: { type: Date, required: true },
    societyId: { type: Schema.Types.ObjectId, ref: 'Society', required: true },
    candidates: [candidateEvaluationSchema],
    chosenTrainerId: { type: String },
    outcome: { type: String, enum: ['ASSIGNED', 'NO_TRAINER'], required: true },
  },
  { timestamps: true },
);

export const AssignmentDecision = model<IAssignmentDecision>('AssignmentDecision', assignmentDecisionSchema);