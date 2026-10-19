export interface PackageTemplate {
  _id: string;
  name: string;
  sessions: number;
  pricePaise: number;
  validityDays: number;
  description: string;
}

export interface CustomerPackage {
  _id: string;
  customerId: string;
  templateId: string;
  packageName: string;
  totalSessions: number;
  usedSessions: number;
  purchasedAt: string;
  expiresAt: string;
}