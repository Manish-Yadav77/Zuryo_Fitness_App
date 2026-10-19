export interface WeeklySlot {
  weekday: number;
  start: string;
  end: string;
}

export interface TimeOff {
  _id?: string;
  from: string;
  to: string;
  reason?: string;
}

export interface TrainerProfile {
  _id: string;
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