import { Notification } from '../models/Notification.js';
import type { NotificationType } from '../models/Notification.js';

export async function sendNotification(
  userId: string,
  type: NotificationType,
  message: string,
  bookingId?: string,
) {
  return await Notification.create({
    userId,
    type,
    message,
    bookingId,
  });
}

export async function getUserNotifications(userId: string) {
  return await Notification.find({ userId }).sort({ createdAt: -1 }).limit(30);
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { readAt: new Date() } },
    { returnDocument: 'after' },
  );
}