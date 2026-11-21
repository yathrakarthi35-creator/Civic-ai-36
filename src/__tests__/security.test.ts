// @vitest-environment node
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server';

describe('CivicResolve Security Hardening', () => {
  it('enforces strict CSP, HSTS, COOP, CORP, X-Frame-Options, and nosniff headers', async () => {
    const app = createApp();
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://untrusted.example');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['strict-transport-security']).toContain('max-age=');
    expect(res.headers['cross-origin-opener-policy']).toBe('same-origin');
    expect(res.headers['cross-origin-resource-policy']).toBe('same-origin');
    expect(res.headers['content-security-policy']).toContain("script-src 'self'");
    expect(res.headers['content-security-policy']).toContain("object-src 'none'");
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('returns sanitized HTTP 400 on malformed JSON without stack trace leakage', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/grievances')
      .set('Content-Type', 'application/json')
      .send('{"broken":');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(JSON.stringify(res.body)).not.toContain('SyntaxError');
  });

  it('enforces per-IP API rate limiting with HTTP 429', async () => {
    const app = createApp({ rateLimitMax: 2 });
    expect((await request(app).get('/api/health')).status).toBe(200);
    expect((await request(app).get('/api/health')).status).toBe(200);
    expect((await request(app).get('/api/health')).status).toBe(429);
  });
});
