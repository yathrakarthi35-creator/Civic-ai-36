export type Department =
  | 'Water Supply'
  | 'Roads & Potholes'
  | 'Sanitation & Waste'
  | 'Streetlights & Power'
  | 'Drainage & Flooding'
  | 'Public Health & Safety';

export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';
export type GrievanceStatus = 'Submitted' | 'Triaged' | 'In Progress' | 'Escalated' | 'Resolved';
export type Sentiment = 'Distressed' | 'Frustrated' | 'Neutral';

export interface AuditEvent {
  timestamp: string;
  actor: string;
  action: string;
}

export interface Grievance {
  id: string;
  title: string;
  description: string;
  ward: string;
  citizenName: string;
  citizenContact: string;
  department: Department;
  priority: Priority;
  urgencyScore: number;
  sentiment: Sentiment;
  slaHours: number;
  slaDueAt: string;
  status: GrievanceStatus;
  assignedOfficer: string;
  aiSummary: string;
  duplicateOf?: string;
  createdAt: string;
  updatedAt: string;
  resolutionNote?: string;
  citizenRating?: number;
  auditTrail: AuditEvent[];
}

export interface TriageResult {
  department: Department;
  priority: Priority;
  urgencyScore: number;
  sentiment: Sentiment;
  slaHours: number;
  assignedOfficer: string;
  aiSummary: string;
  duplicateOf?: string;
  confidence: number;
}

export interface CivicAnalytics {
  total: number;
  openCount: number;
  criticalOpen: number;
  resolvedCount: number;
  escalatedCount: number;
  slaCompliancePct: number;
  avgRating: number;
  byDepartment: Array<{ department: Department; total: number; open: number }>;
  topWards: Array<{ ward: string; count: number }>;
}
