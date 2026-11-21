import { describe, it, expect } from 'vitest';
import {
  classifyGrievance,
  computeCivicAnalytics,
  detectDuplicateGrievance,
  draftResolutionResponse,
  sanitizeText,
} from '../../server/ai-triage-engine';
import { createSeedGrievances } from '../../server/data/seedGrievances';

describe('CivicResolve AI Triage & Analytics Engine', () => {
  it('routes water emergencies to Water Supply with Critical 6h SLA', () => {
    const result = classifyGrievance({
      title: 'Emergency water pipeline leak',
      description: 'Contaminated water flooding the main road near hospital.',
      ward: 'Ward 14 - Indiranagar',
    });
    expect(result.department).toBe('Water Supply');
    expect(result.priority).toBe('Critical');
    expect(result.slaHours).toBe(6);
    expect(result.sentiment).toBe('Distressed');
  });

  it('detects duplicate complaints in the same ward', () => {
    const seeds = createSeedGrievances();
    const dupId = detectDuplicateGrievance(
      'Drinking water pipeline leak flooding Ward 14',
      'Main water pipeline burst causing contaminated water supply flooding.',
      'Ward 14 - Indiranagar',
      seeds
    );
    expect(dupId).toBe('CR-2026-1001');
  });

  it('generates bilingual English and Hindi citizen resolution drafts', () => {
    const en = draftResolutionResponse({
      ticketId: 'CR-2026-1001',
      citizenName: 'Ananya',
      department: 'Water Supply',
      status: 'In Progress',
      language: 'en',
    });
    const hi = draftResolutionResponse({
      ticketId: 'CR-2026-1001',
      citizenName: 'Ananya',
      department: 'Water Supply',
      status: 'In Progress',
      language: 'hi',
    });
    expect(en.message).toContain('CR-2026-1001');
    expect(hi.message).toContain('नमस्ते');
  });

  it('computes accurate SLA compliance and department analytics', () => {
    const analytics = computeCivicAnalytics(createSeedGrievances());
    expect(analytics.total).toBe(4);
    expect(analytics.resolvedCount).toBe(1);
    expect(analytics.slaCompliancePct).toBe(100);
    expect(analytics.byDepartment).toHaveLength(6);
  });

  it('strips HTML angle brackets in sanitizeText', () => {
    expect(sanitizeText('<script>alert(1)</script>Ward 5')).not.toContain('<');
  });
});
