export interface AppNotification {
  _id: string;
  userId: string;
  type: string;
  bookingId?: string;
  message: string;
  readAt?: string;
  createdAt: string;
}