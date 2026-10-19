import { Schema, model, Types } from 'mongoose';

export interface ICustomerPackage {
  customerId: string;
  templateId: Types.ObjectId | string;
  packageName: string;
  totalSessions: number;
  usedSessions: number;
  purchasedAt: Date;
  expiresAt: Date;
  paymentId?: Types.ObjectId | string;
}

const customerPackageSchema = new Schema<ICustomerPackage>(
  {
    customerId: { type: String, required: true, index: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'PackageTemplate', required: true },
    packageName: { type: String, required: true },
    totalSessions: { type: Number, required: true, min: 1 },
    usedSessions: { type: Number, required: true, default: 0 },
    purchasedAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
  },
  { timestamps: true },
);

export const CustomerPackage = model<ICustomerPackage>('CustomerPackage', customerPackageSchema);