import { Schema, model, Types } from 'mongoose';

export interface IPayment {
  bookingId?: Types.ObjectId | string;
  packageTemplateId?: Types.ObjectId | string;
  customerId: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amountPaise: number;
  status: 'CREATED' | 'PAID' | 'FAILED' | 'REFUNDED';
  signatureVerified: boolean;
}

const paymentSchema = new Schema<IPayment>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    packageTemplateId: { type: Schema.Types.ObjectId, ref: 'PackageTemplate' },
    customerId: { type: String, required: true, index: true },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String },
    amountPaise: { type: Number, required: true },
    status: { type: String, enum: ['CREATED', 'PAID', 'FAILED', 'REFUNDED'], default: 'CREATED' },
    signatureVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Payment = model<IPayment>('Payment', paymentSchema);