import { Router } from 'express';
import type { Grievance, GrievanceStatus } from '../../src/types';
import {
  classifyGrievance,
  computeCivicAnalytics,
  draftResolutionResponse,
  sanitizeText,
} from '../ai-triage-engine';
import { createSeedGrievances } from '../data/seedGrievances';

const VALID_STATUSES: GrievanceStatus[] = [
  'Submitted',
  'Triaged',
  'In Progress',
  'Escalated',
  'Resolved',
];

export function createGrievanceRouter(): Router {
  const router = Router();
  const grievances: Grievance[] = createSeedGrievances();
  let nextSeq = 1005;

  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'CivicResolve AI — Citizen Grievance Management & Resolution',
      timestamp: new Date().toISOString(),
    });
  });

  router.get('/grievances', (req, res) => {
    const statusFilter = typeof req.query.status === 'string' ? req.query.status : '';
    const deptFilter = typeof req.query.department === 'string' ? req.query.department : '';
    const filtered = grievances.filter((g) => {
      if (statusFilter && statusFilter !== 'All' && g.status !== statusFilter) return false;
      if (deptFilter && deptFilter !== 'All' && g.department !== deptFilter) return false;
      return true;
    });
    res.json({ success: true, grievances: filtered });
  });

  router.post('/grievances', (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const title = sanitizeText(body.title, '', 140);
    const description = sanitizeText(body.description, '', 800);
    const ward = sanitizeText(body.ward, 'Ward 12 - Central', 80);
    const citizenName = sanitizeText(body.citizenName, 'Anonymous Citizen', 80);
    const citizenContact = sanitizeText(body.citizenContact, '', 120);

    if (title.length < 5 || description.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a descriptive title (min 5 chars) and details (min 10 chars).',
      });
    }

    const triage = classifyGrievance({ title, description, ward }, grievances);
    const nowIso = new Date().toISOString();
    const slaDueAt = new Date(Date.now() + triage.slaHours * 3_600_000).toISOString();
    const id = `CR-2026-${nextSeq++}`;

    const created: Grievance = {
      id,
      title,
      description,
      ward,
      citizenName,
      citizenContact,
      department: triage.department,
      priority: triage.priority,
      urgencyScore: triage.urgencyScore,
      sentiment: triage.sentiment,
      slaHours: triage.slaHours,
      slaDueAt,
      status: 'Triaged',
      assignedOfficer: triage.assignedOfficer,
      aiSummary: triage.aiSummary,
      duplicateOf: triage.duplicateOf,
      createdAt: nowIso,
      updatedAt: nowIso,
      auditTrail: [
        { timestamp: nowIso, actor: 'Citizen Portal', action: `Grievance submitted by ${citizenName}` },
        { timestamp: nowIso, actor: 'CivicResolve AI', action: triage.aiSummary },
      ],
    };

    grievances.unshift(created);
    return res.status(201).json({ success: true, grievance: created, triage });
  });

  router.patch('/grievances/:id/status', (req, res) => {
    const item = grievances.find((g) => g.id === req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Grievance ticket not found.' });
    }
    const body = (req.body ?? {}) as Record<string, unknown>;
    const nextStatus = String(body.status ?? '') as GrievanceStatus;
    if (!VALID_STATUSES.includes(nextStatus)) {
      return res.status(400).json({ success: false, error: 'Invalid grievance status.' });
    }
    const note = sanitizeText(body.resolutionNote, '', 400);
    const nowIso = new Date().toISOString();

    item.status = nextStatus;
    item.updatedAt = nowIso;
    if (note) item.resolutionNote = note;
    item.auditTrail.push({
      timestamp: nowIso,
      actor: item.assignedOfficer,
      action: note ? `Status updated to ${nextStatus}: ${note}` : `Status updated to ${nextStatus}`,
    });

    return res.json({ success: true, grievance: item });
  });

  router.post('/grievances/:id/feedback', (req, res) => {
    const item = grievances.find((g) => g.id === req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Grievance ticket not found.' });
    }
    const rating = Number((req.body as Record<string, unknown>)?.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be an integer between 1 and 5.' });
    }
    item.citizenRating = rating;
    item.updatedAt = new Date().toISOString();
    return res.json({ success: true, grievance: item });
  });

  router.post('/ai/triage', (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const triage = classifyGrievance(
      {
        title: String(body.title ?? ''),
        description: String(body.description ?? ''),
        ward: String(body.ward ?? ''),
      },
      grievances
    );
    res.json({ success: true, triage });
  });

  router.post('/ai/draft-response', (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const draft = draftResolutionResponse({
      ticketId: String(body.ticketId ?? 'CR-2026-1001'),
      citizenName: String(body.citizenName ?? 'Citizen'),
      department: (body.department as Grievance['department']) || 'Water Supply',
      status: String(body.status ?? 'In Progress'),
      language: body.language === 'hi' ? 'hi' : 'en',
    });
    res.json({ success: true, draft });
  });

  router.get('/analytics', (_req, res) => {
    res.json({ success: true, analytics: computeCivicAnalytics(grievances) });
  });

  return router;
}
