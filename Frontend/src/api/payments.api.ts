import { api } from './client'
import type { RazorpayOrderResponse, VerifyPaymentPayload, VerifyPaymentResponse } from '@/types/payment'

export const paymentsApi = {
  async createOrder(bookingId?: string, packageTemplateId?: string): Promise<RazorpayOrderResponse> {
    const { data } = await api.post<{ order: RazorpayOrderResponse }>('/payments/order', {
      bookingId,
      packageTemplateId,
    })
    return data.order
  },
  /** The server checks the Razorpay signature. For package orders it also returns the new package. */
  async verifyPayment(payload: VerifyPaymentPayload): Promise<VerifyPaymentResponse> {
    const { data } = await api.post<VerifyPaymentResponse>('/payments/verify', payload)
    return data
  },
}