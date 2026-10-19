import { Schema, model, Types } from 'mongoose';

export type NotificationType =
  | 'BOOKING_ASSIGNED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_RESCHEDULED'
  | 'SESSION_REMINDER';

export interface INotification {
  userId: string;
  type: NotificationType;
  bookingId?: Types.ObjectId | string;
  message: string;
  readAt?: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['BOOKING_ASSIGNED', 'BOOKING_CANCELLED', 'BOOKING_RESCHEDULED', 'SESSION_REMINDER'],
      required: true,
    },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    message: { type: String, required: true, trim: true },
    readAt: { type: Date },
  },
  { timestamps: true },
);

export const Notification = model<INotification>('Notification', notificationSchema);