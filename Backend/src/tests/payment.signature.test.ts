import { describe, expect, it } from 'vitest';
import { computeRazorpaySignature, isValidRazorpaySignature } from '../services/payment.service.js';

const SECRET = 'unit_test_secret';

describe('Razorpay signature verification', () => {
  const orderId = 'order_ABC123';
  const paymentId = 'pay_XYZ789';
  const good = computeRazorpaySignature(orderId, paymentId, SECRET);

  it('accepts the correct signature', () => {
    expect(isValidRazorpaySignature(orderId, paymentId, good, SECRET)).toBe(true);
  });
  it('rejects the old test bypass string', () => {
    expect(isValidRazorpaySignature(orderId, paymentId, 'simulated_test_signature', SECRET)).toBe(false);
  });
  it('rejects empty and wrong-length signatures', () => {
    expect(isValidRazorpaySignature(orderId, paymentId, '', SECRET)).toBe(false);
    expect(isValidRazorpaySignature(orderId, paymentId, good.slice(0, -1), SECRET)).toBe(false);
  });
  it('rejects a signature made with another secret', () => {
    const forged = computeRazorpaySignature(orderId, paymentId, 'attacker_secret');
    expect(isValidRazorpaySignature(orderId, paymentId, forged, SECRET)).toBe(false);
  });
  it('rejects a valid signature used with a different payment id or order id', () => {
    expect(isValidRazorpaySignature(orderId, 'pay_OTHER', good, SECRET)).toBe(false);
    expect(isValidRazorpaySignature('order_OTHER', paymentId, good, SECRET)).toBe(false);
  });
});