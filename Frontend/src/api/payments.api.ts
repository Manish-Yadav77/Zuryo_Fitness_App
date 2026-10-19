import { api } from './client';
import type { RazorpayOrderResponse, VerifyPaymentPayload } from '@/types/payment';

export const paymentsApi = {
  async createOrder(bookingId?: string, packageTemplateId?: string): Promise<RazorpayOrderResponse> {
    const { data } = await api.post<{ order: RazorpayOrderResponse }>('/payments/order', {
      bookingId,
      packageTemplateId,
    });
    return data.order;
  },
  async verifyPayment(payload: VerifyPaymentPayload): Promise<void> {
    await api.post('/payments/verify', payload);
  },
};