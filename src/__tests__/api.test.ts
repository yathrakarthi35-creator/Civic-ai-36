// @vitest-environment node
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server';

describe('CivicResolve REST API Lifecycle', () => {
  const app = createApp();

  it('returns healthy status on GET /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('creates, auto-triages, updates, and rates a citizen grievance', async () => {
    const created = await request(app).post('/api/grievances').send({
      title: 'Blocked stormwater drain overflowing on 5th Cross',
      description: 'Severe drain blockage causing waterlogging after rain near school.',
      ward: 'Ward 12 - Central',
      citizenName: 'Deepak Nair',
    });
    expect(created.status).toBe(201);
    expect(created.body.grievance.department).toBe('Drainage & Flooding');

    const id = created.body.grievance.id;
    const updated = await request(app)
      .patch(`/api/grievances/${id}/status`)
      .send({ status: 'Resolved', resolutionNote: 'Drain desilted and cleared' });
    expect(updated.status).toBe(200);
    expect(updated.body.grievance.status).toBe('Resolved');

    const rated = await request(app).post(`/api/grievances/${id}/feedback`).send({ rating: 5 });
    expect(rated.status).toBe(200);
    expect(rated.body.grievance.citizenRating).toBe(5);
  });

  it('rejects invalid grievance inputs with HTTP 400 and unknown tickets with HTTP 404', async () => {
    const bad = await request(app).post('/api/grievances').send({ title: 'Hi', description: 'Short' });
    expect(bad.status).toBe(400);

    const missing = await request(app)
      .patch('/api/grievances/CR-9999/status')
      .send({ status: 'Resolved' });
    expect(missing.status).toBe(404);
  });

  it('serves live analytics and AI draft responses', async () => {
    const analytics = await request(app).get('/api/analytics');
    expect(analytics.status).toBe(200);
    expect(analytics.body.analytics.total).toBeGreaterThanOrEqual(4);

    const draft = await request(app)
      .post('/api/ai/draft-response')
      .send({ ticketId: 'CR-2026-1001', citizenName: 'Ananya', language: 'hi' });
    expect(draft.status).toBe(200);
    expect(draft.body.draft.language).toBe('hi');
  });
});
