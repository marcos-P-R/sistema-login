import Express from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { createRateLimiter } from '../../src/middleware/rateLimiter.js';
import { getTestApp } from '../shared/testEnvironment.js';

describe('Security - headers and HTTP configuration (OWASP A05)', () => {
  let app: Awaited<ReturnType<typeof getTestApp>>;

  beforeAll(async () => {
    process.env.DISABLE_RATE_LIMITER = 'true';
    app = await getTestApp();
  });

  it('applies protection headers via helmet and removes x-powered-by', async () => {
    const response = await request(app)
      .post('/login')
      .send({ email: 'invalid-email', password: '123' })
      .expect(400);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['x-dns-prefetch-control']).toBe('off');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('keeps CORS behavior enabled', async () => {
    const response = await request(app)
      .get('/ping')
      .set('Origin', 'http://example.com')
      .expect(401);

    expect(response.headers['access-control-allow-origin']).toBe('*');
  });

  it('limits repeated login attempts and keeps service responsive', async () => {
    const localApp = Express();
    localApp.use(Express.json());

    const limiter = createRateLimiter({
      windowMs: 60_000,
      max: 3,
      skip: () => false,
    });

    localApp.post('/login', limiter, (_req, res) => {
      res.status(401).json({ auth: false, message: 'Invalid credentials' });
    });

    localApp.get('/health', (_req, res) => {
      res.status(200).json({ ok: true });
    });

    await request(localApp).post('/login').send({ email: 'a@a.com', password: 'x' }).expect(401);
    await request(localApp).post('/login').send({ email: 'a@a.com', password: 'x' }).expect(401);
    await request(localApp).post('/login').send({ email: 'a@a.com', password: 'x' }).expect(401);

    const throttled = await request(localApp)
      .post('/login')
      .send({ email: 'a@a.com', password: 'x' })
      .expect(429);

    expect(String(throttled.text)).toContain('You have exceeded the 3 requests');

    const health = await request(localApp)
      .get('/health')
      .expect(200);

    expect(health.body).toEqual({ ok: true });
  });
});
