import { Schema, model, Types } from 'mongoose';

export type PaymentPurpose = 'BOOKING' | 'PACKAGE';

export interface IPayment {
  bookingId?: Types.ObjectId | string;
  packageTemplateId?: Types.ObjectId | string;
  purpose: PaymentPurpose;
  customerId: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amountPaise: number;
  status: 'CREATED' | 'PAID' | 'FAILED' | 'REFUNDED';
  signatureVerified: boolean;
  refundId?: string;
  refundedAt?: Date;
  refundError?: string;
}

const paymentSchema = new Schema<IPayment>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    packageTemplateId: { type: Schema.Types.ObjectId, ref: 'PackageTemplate' },
    purpose: { type: String, enum: ['BOOKING', 'PACKAGE'], default: 'BOOKING' },
    customerId: { type: String, required: true, index: true },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String },
    amountPaise: { type: Number, required: true },
    status: { type: String, enum: ['CREATED', 'PAID', 'FAILED', 'REFUNDED'], default: 'CREATED' },
    signatureVerified: { type: Boolean, default: false },
    refundId: { type: String },
    refundedAt: { type: Date },
    refundError: { type: String },
  },
  { timestamps: true },
);

export const Payment = model<IPayment>('Payment', paymentSchema);