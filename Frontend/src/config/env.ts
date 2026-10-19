export const env = {
  apiUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5000/api',
  razorpayKeyId: (import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined) ?? 'rzp_test_dummy_key',
};