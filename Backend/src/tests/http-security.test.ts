import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { signToken } from '../utils/jwt.js';

let server: Server;
let base = '';

const customerToken = () => signToken({ sub: '64b000000000000000000001', role: 'customer' });
const OID = '64b000000000000000000002';

beforeAll(async () => {
  server = createApp().listen(0);
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('routes that must not be reachable without proper access (no database needed)', () => {
  it('the free-package endpoint no longer exists', async () => {
    const res = await fetch(`${base}/packages/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken()}` },
      body: JSON.stringify({ templateId: OID }),
    });
    expect(res.status).toBe(404);
  });

  it('booking, ticker, record and payment routes require login', async () => {
    const urls: Array<[string, string]> = [
      ['GET', `${base}/bookings/${OID}`],
      ['GET', `${base}/bookings/${OID}/session/ticker`],
      ['GET', `${base}/records/booking/${OID}`],
      ['POST', `${base}/payments/verify`],
      ['POST', `${base}/payments/order`],
    ];
    for (const [method, url] of urls) {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? '{}' : undefined });
      expect(res.status, `${method} ${url}`).toBe(401);
    }
  });

  it('payment verify rejects a missing signature before touching the database', async () => {
    const res = await fetch(`${base}/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken()}` },
      body: JSON.stringify({ orderId: 'order_x', paymentId: 'pay_x' }),
    });
    expect(res.status).toBe(400);
  });

  it('payment order needs exactly one of bookingId or packageTemplateId', async () => {
    const res = await fetch(`${base}/payments/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken()}` },
      body: JSON.stringify({ bookingId: OID, packageTemplateId: OID }),
    });
    expect(res.status).toBe(400);
  });

  it('a malformed booking id is a clean 404, not a server error', async () => {
    const res = await fetch(`${base}/bookings/not-an-id`, { headers: { Authorization: `Bearer ${customerToken()}` } });
    expect(res.status).toBe(404);
  });

  it('customers cannot reach admin and trainer routes', async () => {
    const admin = await fetch(`${base}/bookings/admin/all`, { headers: { Authorization: `Bearer ${customerToken()}` } });
    const trainer = await fetch(`${base}/bookings/${OID}/session/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken()}` },
    });
    expect(admin.status).toBe(403);
    expect(trainer.status).toBe(403);
  });
});