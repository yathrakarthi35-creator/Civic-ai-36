import type {
  CivicAnalytics,
  Department,
  Grievance,
  Priority,
  Sentiment,
  TriageResult,
} from '../src/types';

const DEPARTMENT_RULES: Array<{ department: Department; officer: string; keywords: string[] }> = [
  {
    department: 'Water Supply',
    officer: 'Er. Ramesh Kumar (Water Works)',
    keywords: ['water', 'pipeline', 'leak', 'tap', 'supply', 'contamination', 'borewell', 'tanker'],
  },
  {
    department: 'Roads & Potholes',
    officer: 'Er. Priya Sharma (Public Works)',
    keywords: ['pothole', 'road', 'highway', 'footpath', 'asphalt', 'bridge', 'crater', 'traffic'],
  },
  {
    department: 'Sanitation & Waste',
    officer: 'Dr. Kavita Nair (Sanitation)',
    keywords: ['garbage', 'waste', 'trash', 'dump', 'bin', 'sewage', 'clean', 'smell', 'compost'],
  },
  {
    department: 'Streetlights & Power',
    officer: 'Er. Arjun Verma (Electrical)',
    keywords: ['streetlight', 'light', 'dark', 'lamp', 'pole', 'wire', 'electric', 'power', 'spark'],
  },
  {
    department: 'Drainage & Flooding',
    officer: 'Er. Suresh Patel (Stormwater)',
    keywords: ['drain', 'flood', 'waterlogging', 'manhole', 'clog', 'overflow', 'stormwater', 'gutter'],
  },
  {
    department: 'Public Health & Safety',
    officer: 'Dr. Meena Iyer (Civic Health)',
    keywords: ['hospital', 'mosquito', 'dengue', 'stray', 'clinic', 'smoke', 'hazard', 'toxic', 'health'],
  },
];

const CRITICAL_KEYWORDS = ['emergency', 'accident', 'electrocut', 'collapse', 'flood', 'sewage', 'contaminated', 'hospital', 'fire', 'spark', 'danger'];
const HIGH_KEYWORDS = ['broken', 'blocked', 'overflow', 'days', 'severe', 'urgent', 'school', 'no water', 'dark'];
const DISTRESSED_KEYWORDS = ['urgent', 'emergency', 'help', 'dangerous', 'children', 'sick', 'elderly', 'accident'];
const FRUSTRATED_KEYWORDS = ['again', 'ignored', 'weeks', 'months', 'still', 'horrible', 'worst', 'pathetic'];

export function sanitizeText(value: unknown, fallback = '', maxLen = 500): string {
  if (typeof value !== 'string') return fallback;
  return value.replace(/[<>]/g, '').trim().slice(0, maxLen) || fallback;
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3)
  );
}

export function detectDuplicateGrievance(
  title: string,
  description: string,
  ward: string,
  existing: Grievance[]
): string | undefined {
  const incomingTokens = tokenize(`${title} ${description}`);
  if (incomingTokens.size === 0) return undefined;

  const normalizedWard = ward.trim().toLowerCase();
  for (const item of existing) {
    if (item.status === 'Resolved') continue;
    if (item.ward.trim().toLowerCase() !== normalizedWard) continue;

    const existingTokens = tokenize(`${item.title} ${item.description}`);
    let overlap = 0;
    for (const token of incomingTokens) {
      if (existingTokens.has(token)) overlap += 1;
    }
    const union = new Set([...incomingTokens, ...existingTokens]).size || 1;
    if (overlap / union >= 0.45) {
      return item.id;
    }
  }
  return undefined;
}

export function classifyGrievance(
  input: { title: string; description: string; ward?: string },
  existing: Grievance[] = []
): TriageResult {
  const title = sanitizeText(input.title, 'General Civic Issue', 140);
  const description = sanitizeText(input.description, '', 800);
  const ward = sanitizeText(input.ward, 'Ward 12 - Central', 80);
  const combined = `${title} ${description}`.toLowerCase();

  let bestDept = DEPARTMENT_RULES[0];
  let bestHits = 0;
  for (const rule of DEPARTMENT_RULES) {
    const hits = rule.keywords.reduce((acc, kw) => (combined.includes(kw) ? acc + 1 : acc), 0);
    if (hits > bestHits) {
      bestHits = hits;
      bestDept = rule;
    }
  }

  const criticalHits = CRITICAL_KEYWORDS.filter((kw) => combined.includes(kw)).length;
  const highHits = HIGH_KEYWORDS.filter((kw) => combined.includes(kw)).length;

  let priority: Priority = 'Low';
  let slaHours = 72;
  let urgencyScore = 38;

  if (criticalHits > 0) {
    priority = 'Critical';
    slaHours = 6;
    urgencyScore = Math.min(99, 86 + criticalHits * 4);
  } else if (highHits >= 2 || bestHits >= 3) {
    priority = 'High';
    slaHours = 24;
    urgencyScore = Math.min(85, 68 + highHits * 5);
  } else if (highHits === 1 || bestHits >= 1) {
    priority = 'Medium';
    slaHours = 48;
    urgencyScore = 54;
  }

  let sentiment: Sentiment = 'Neutral';
  if (DISTRESSED_KEYWORDS.some((kw) => combined.includes(kw))) {
    sentiment = 'Distressed';
  } else if (FRUSTRATED_KEYWORDS.some((kw) => combined.includes(kw))) {
    sentiment = 'Frustrated';
  }

  const duplicateOf = detectDuplicateGrievance(title, description, ward, existing);
  const confidence = Number(Math.min(0.98, 0.78 + bestHits * 0.05).toFixed(2));
  const aiSummary = duplicateOf
    ? `Auto-routed to ${bestDept.department} (${priority}, ${slaHours}h SLA). Linked as potential duplicate of ${duplicateOf}.`
    : `Auto-routed to ${bestDept.department} with ${priority} priority (${slaHours}h SLA) based on ${sentiment.toLowerCase()} citizen report in ${ward}.`;

  return {
    department: bestDept.department,
    priority,
    urgencyScore,
    sentiment,
    slaHours,
    assignedOfficer: bestDept.officer,
    aiSummary,
    duplicateOf,
    confidence,
  };
}

export function draftResolutionResponse(input: {
  ticketId: string;
  citizenName: string;
  department: Department;
  status: string;
  language?: 'en' | 'hi';
}): { language: 'en' | 'hi'; message: string } {
  const lang = input.language === 'hi' ? 'hi' : 'en';
  const name = sanitizeText(input.citizenName, 'Citizen', 80);
  const ticketId = sanitizeText(input.ticketId, 'CR-2026-0000', 30);

  if (lang === 'hi') {
    return {
      language: 'hi',
      message: `नमस्ते ${name}, आपकी शिकायत संख्या ${ticketId} (${input.department}) की वर्तमान स्थिति "${input.status}" है। संबंधित फील्ड टीम निर्धारित SLA के भीतर समाधान सुनिश्चित कर रही है।`,
    };
  }

  return {
    language: 'en',
    message: `Dear ${name}, your grievance ${ticketId} assigned to ${input.department} is currently "${input.status}". Our field engineering team is actively tracking resolution within the mandated SLA window.`,
  };
}

export function computeCivicAnalytics(grievances: Grievance[]): CivicAnalytics {
  const total = grievances.length;
  const resolved = grievances.filter((g) => g.status === 'Resolved');
  const open = grievances.filter((g) => g.status !== 'Resolved');
  const criticalOpen = open.filter((g) => g.priority === 'Critical').length;
  const escalatedCount = grievances.filter((g) => g.status === 'Escalated').length;

  const nowMs = Date.now();
  const withinSla = grievances.filter(
    (g) => g.status === 'Resolved' || new Date(g.slaDueAt).getTime() >= nowMs
  ).length;
  const slaCompliancePct = total === 0 ? 100 : Number(((withinSla / total) * 100).toFixed(1));

  const rated = resolved.filter((g) => typeof g.citizenRating === 'number');
  const avgRating =
    rated.length === 0
      ? 4.6
      : Number(
          (rated.reduce((sum, g) => sum + (g.citizenRating ?? 0), 0) / rated.length).toFixed(1)
        );

  const byDepartment = DEPARTMENT_RULES.map(({ department }) => {
    const deptItems = grievances.filter((g) => g.department === department);
    return {
      department,
      total: deptItems.length,
      open: deptItems.filter((g) => g.status !== 'Resolved').length,
    };
  });

  const wardCounts = new Map<string, number>();
  for (const g of grievances) {
    wardCounts.set(g.ward, (wardCounts.get(g.ward) ?? 0) + 1);
  }
  const topWards = Array.from(wardCounts.entries())
    .map(([ward, count]) => ({ ward, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    total,
    openCount: open.length,
    criticalOpen,
    resolvedCount: resolved.length,
    escalatedCount,
    slaCompliancePct,
    avgRating,
    byDepartment,
    topWards,
  };
}
