export interface SessionTicker {
  status: string;
  serverTime: string;
  startedAt?: string;
  endsAt?: string;
  elapsedSeconds: number;
  remainingSeconds: number;
  is55MinWarning: boolean;
  isCompleted: boolean;
}