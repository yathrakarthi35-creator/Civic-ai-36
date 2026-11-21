import React, { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { ShieldCheck, FilePlus2, ListChecks, BarChart3, Search } from 'lucide-react';
import type { Grievance, GrievanceStatus } from './types';
import {
  classifyGrievance,
  computeCivicAnalytics,
  createSeedGrievances,
} from './lib/triageClient';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GrievanceBoard } from './components/GrievanceBoard';

const GrievanceForm = lazy(() =>
  import('./components/GrievanceForm').then((m) => ({ default: m.GrievanceForm }))
);
const AnalyticsPanel = lazy(() =>
  import('./components/AnalyticsPanel').then((m) => ({ default: m.AnalyticsPanel }))
);
const TicketTracker = lazy(() =>
  import('./components/TicketTracker').then((m) => ({ default: m.TicketTracker }))
);
const AiCopilotModal = lazy(() =>
  import('./components/AiCopilotModal').then((m) => ({ default: m.AiCopilotModal }))
);

type TabId = 'intake' | 'queue' | 'analytics' | 'tracker';

const NAV_TABS: Array<{ id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'intake', label: 'Report Grievance', icon: FilePlus2 },
  { id: 'queue', label: 'Resolution Queue', icon: ListChecks },
  { id: 'analytics', label: 'SLA Analytics', icon: BarChart3 },
  { id: 'tracker', label: 'Track Ticket', icon: Search },
];

const LoadingFallback = () => (
  <div role="status" aria-live="polite" className="py-12 text-center text-sm text-slate-300">
    Loading CivicResolve module...
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('queue');
  const [grievances, setGrievances] = useState<Grievance[]>(() => createSeedGrievances());
  const [copilotTicket, setCopilotTicket] = useState<Grievance | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const analytics = useMemo(() => computeCivicAnalytics(grievances), [grievances]);

  const handleSubmitGrievance = useCallback(
    (payload: {
      title: string;
      description: string;
      ward: string;
      citizenName: string;
      citizenContact: string;
    }) => {
      const triage = classifyGrievance(payload, grievances);
      const nowIso = new Date().toISOString();
      const id = `CR-2026-${1005 + grievances.length}`;
      const newTicket: Grievance = {
        id,
        ...payload,
        department: triage.department,
        priority: triage.priority,
        urgencyScore: triage.urgencyScore,
        sentiment: triage.sentiment,
        slaHours: triage.slaHours,
        slaDueAt: new Date(Date.now() + triage.slaHours * 3_600_000).toISOString(),
        status: 'Triaged',
        assignedOfficer: triage.assignedOfficer,
        aiSummary: triage.aiSummary,
        duplicateOf: triage.duplicateOf,
        createdAt: nowIso,
        updatedAt: nowIso,
        auditTrail: [
          { timestamp: nowIso, actor: 'Citizen Portal', action: `Submitted by ${payload.citizenName}` },
          { timestamp: nowIso, actor: 'CivicResolve AI', action: triage.aiSummary },
        ],
      };
      setGrievances((prev) => [newTicket, ...prev]);
      setStatusMessage(`Created ticket ${id} routed to ${triage.department}.`);
    },
    [grievances]
  );

  const handleUpdateStatus = useCallback((id: string, status: GrievanceStatus, note?: string) => {
    const nowIso = new Date().toISOString();
    setGrievances((prev) =>
      prev.map((item) =>
        item.id !== id
          ? item
          : {
              ...item,
              status,
              updatedAt: nowIso,
              resolutionNote: note ?? item.resolutionNote,
              auditTrail: [
                ...item.auditTrail,
                { timestamp: nowIso, actor: item.assignedOfficer, action: note || `Updated to ${status}` },
              ],
            }
      )
    );
    setStatusMessage(`Ticket ${id} updated to ${status}.`);
  }, []);

  const handleRateResolution = useCallback((id: string, rating: number) => {
    setGrievances((prev) =>
      prev.map((item) => (item.id === id ? { ...item, citizenRating: rating } : item))
    );
    setStatusMessage(`Saved ${rating}-star rating for ${id}.`);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-sky-700 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>

      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage || `Active tab: ${activeTab}`}
      </div>

      <header role="banner" className="border-b border-slate-800 bg-slate-900/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-sky-400" aria-hidden="true" />
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-white">CivicResolve AI</h1>
              <p className="text-xs text-slate-300">
                Citizen Grievance Management, Auto-Triage &amp; SLA Resolution
              </p>
            </div>
          </div>

          <nav aria-label="Primary navigation" className="flex flex-wrap gap-2">
            {NAV_TABS.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setActiveTab(id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 focus:outline-none">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            {activeTab === 'intake' && (
              <GrievanceForm
                existingGrievances={grievances}
                onSubmitGrievance={handleSubmitGrievance}
              />
            )}
            {activeTab === 'queue' && (
              <GrievanceBoard
                grievances={grievances}
                onUpdateStatus={handleUpdateStatus}
                onOpenCopilot={setCopilotTicket}
              />
            )}
            {activeTab === 'analytics' && <AnalyticsPanel analytics={analytics} />}
            {activeTab === 'tracker' && (
              <TicketTracker grievances={grievances} onRateResolution={handleRateResolution} />
            )}
          </Suspense>
        </ErrorBoundary>
      </main>

      <footer role="contentinfo" className="border-t border-slate-800 bg-slate-900/60 py-4 text-center text-xs text-slate-400">
        CivicResolve AI — Autonomous Citizen Grievance Triage, SLA Watchdog &amp; Resolution Platform
      </footer>

      <Suspense fallback={null}>
        <AiCopilotModal grievance={copilotTicket} onClose={() => setCopilotTicket(null)} />
      </Suspense>
    </div>
  );
}
