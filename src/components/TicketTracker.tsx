import React, { useState } from 'react';
import type { Grievance } from '../types';

interface Props {
  grievances: Grievance[];
  onRateResolution: (id: string, rating: number) => void;
}

export const TicketTracker: React.FC<Props> = ({ grievances, onRateResolution }) => {
  const [ticketId, setTicketId] = useState(grievances[0]?.id ?? 'CR-2026-1001');
  const match = grievances.find((g) => g.id.toLowerCase() === ticketId.trim().toLowerCase());

  return (
    <section aria-labelledby="tracker-heading" className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 id="tracker-heading" className="text-xl font-bold text-white">
          Citizen Grievance Status Tracker
        </h2>
        <div className="mt-4 max-w-md">
          <label htmlFor="ticket-lookup" className="block text-sm font-medium text-slate-200">
            Enter Grievance Ticket ID
          </label>
          <input
            id="ticket-lookup"
            type="text"
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            placeholder="CR-2026-1001"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white"
          />
        </div>

        {!match ? (
          <p role="status" className="mt-4 text-sm text-amber-300">
            No grievance found for &ldquo;{ticketId}&rdquo;. Try CR-2026-1001.
          </p>
        ) : (
          <div className="mt-6 space-y-4 rounded-xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-white">
                {match.id}: {match.title}
              </h3>
              <span className="rounded-full bg-sky-900 px-3 py-1 text-xs font-semibold text-sky-100">
                {match.status}
              </span>
            </div>
            <p className="text-sm text-slate-300">{match.aiSummary}</p>
            <ol className="space-y-2 border-l-2 border-sky-600 pl-4 text-sm">
              {match.auditTrail.map((evt, idx) => (
                <li key={`${evt.timestamp}-${idx}`}>
                  <span className="font-semibold text-white">{evt.actor}:</span>{' '}
                  <span className="text-slate-300">{evt.action}</span>
                </li>
              ))}
            </ol>

            {match.status === 'Resolved' && (
              <div className="pt-2">
                <p className="text-sm font-medium text-slate-200">Rate this resolution:</p>
                <div className="mt-2 flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      aria-label={`Rate ${star} out of 5`}
                      onClick={() => onRateResolution(match.id, star)}
                      className={`rounded-md px-3 py-1 text-xs font-bold ${
                        match.citizenRating === star
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      {star} ★
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
