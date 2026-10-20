import type { CustomerPackage } from './package'

export interface RazorpayOrderResponse {
  paymentId: string
  orderId: string
  amountPaise: number
  keyId: string
}

export interface VerifyPaymentPayload {
  orderId: string
  paymentId: string
  signature: string
}

export interface VerifyPaymentResponse {
  payment: {
    _id: string
    status: string
    amountPaise: number
    razorpayOrderId: string
    razorpayPaymentId?: string
  }
  /** Set when the payment was for a package; null for a booking payment. */
  package: CustomerPackage | null
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpaySuccessResponse) => void
  modal?: {
    ondismiss?: () => void
  }
  prefill?: {
    name?: string
    email?: string
  }
  theme?: {
    color?: string
  }
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void }
  }
}