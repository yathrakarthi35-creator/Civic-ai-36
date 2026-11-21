import React, { useMemo, useState } from 'react';
import { MessageSquare, CheckCircle, AlertOctagon } from 'lucide-react';
import type { Grievance, GrievanceStatus } from '../types';

interface Props {
  grievances: Grievance[];
  onUpdateStatus: (id: string, status: GrievanceStatus, note?: string) => void;
  onOpenCopilot: (grievance: Grievance) => void;
}

const PRIORITY_BADGE: Record<string, string> = {
  Critical: 'bg-red-800 text-white border-red-600',
  High: 'bg-orange-800 text-white border-orange-600',
  Medium: 'bg-amber-800 text-white border-amber-600',
  Low: 'bg-emerald-800 text-white border-emerald-600',
};

export const GrievanceBoard: React.FC<Props> = ({
  grievances,
  onUpdateStatus,
  onOpenCopilot,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return grievances.filter((g) => {
      if (statusFilter !== 'All' && g.status !== statusFilter) return false;
      if (!q) return true;
      return (
        g.id.toLowerCase().includes(q) ||
        g.title.toLowerCase().includes(q) ||
        g.department.toLowerCase().includes(q) ||
        g.ward.toLowerCase().includes(q)
      );
    });
  }, [grievances, statusFilter, searchQuery]);

  return (
    <section aria-labelledby="queue-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div>
          <h2 id="queue-heading" className="text-xl font-bold text-white">
            Municipal Resolution Queue
          </h2>
          <p className="text-sm text-slate-300">
            Showing {filtered.length} of {grievances.length} active &amp; resolved citizen tickets
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div>
            <label htmlFor="queue-search" className="sr-only">
              Search grievances
            </label>
            <input
              id="queue-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticket, ward, department..."
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-400"
            />
          </div>
          <div>
            <label htmlFor="status-filter" className="sr-only">
              Filter by status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              <option value="All">All Statuses</option>
              <option value="Triaged">Triaged</option>
              <option value="In Progress">In Progress</option>
              <option value="Escalated">Escalated</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {filtered.map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-slate-800 bg-slate-900 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-sky-300">{item.id}</span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${PRIORITY_BADGE[item.priority]}`}
                  >
                    {item.priority} ({item.slaHours}h SLA)
                  </span>
                  <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-200">
                    {item.department}
                  </span>
                  <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-200">
                    {item.status}
                  </span>
                </div>
                <h3 className="mt-2 text-base font-bold text-white">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-300">{item.description}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {item.ward} · Assigned: {item.assignedOfficer} · Sentiment: {item.sentiment}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onOpenCopilot(item)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-950/60 px-3 py-1.5 text-xs font-semibold text-sky-200 hover:bg-sky-900/60"
                >
                  <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                  AI Draft Reply
                </button>
                {item.status !== 'Resolved' && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateStatus(item.id, 'Escalated', 'Escalated for rapid field intervention')
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-950/60 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-900/60"
                    >
                      <AlertOctagon className="h-3.5 w-3.5" aria-hidden="true" />
                      Escalate
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateStatus(item.id, 'Resolved', 'Verified resolved by municipal field team')
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
                    >
                      <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      Mark Resolved
                    </button>
                  </>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
