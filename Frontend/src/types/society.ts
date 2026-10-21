export interface Society {
  _id: string;
  name: string;
  zoneId: string;
  address: string;
  city?: string;
  pincode?: string;
  location: {
    lat: number;
    lng: number;
  };
  commissionPercent: number;
}