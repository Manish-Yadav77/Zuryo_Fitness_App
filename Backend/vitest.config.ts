import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['dist/**', 'node_modules/**'],
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/zuryo_unit_tests',
      JWT_SECRET: 'unit-test-secret-unit-test-secret-1234',
      CLIENT_ORIGIN: 'http://localhost:5173',
      RAZORPAY_KEY_ID: 'rzp_test_unit',
      RAZORPAY_KEY_SECRET: 'unit_test_secret',
    },
  },
});