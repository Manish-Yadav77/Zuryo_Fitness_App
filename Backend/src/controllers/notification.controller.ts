import type { RequestHandler } from 'express';
import { getUserNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '../services/notification.service.js';
import { AppError } from '../utils/AppError.js';

export const getMyNotifications: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const notifications = await getUserNotifications(req.auth.id);
  res.json({ notifications });
};

export const patchMarkRead: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const id = req.params['id'];
  if (!id || typeof id !== 'string') throw new AppError(400, 'MISSING_ID', 'Notification ID required');

  const notification = await markNotificationAsRead(id, req.auth.id);
  res.json({ notification });
};

export const postMarkAllRead: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Log in required');
  const result = await markAllNotificationsAsRead(req.auth.id);
  res.json({ updated: result.modifiedCount });
};
