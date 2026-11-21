import React from 'react';
import type { CivicAnalytics } from '../types';

export const AnalyticsPanel: React.FC<{ analytics: CivicAnalytics }> = ({ analytics }) => (
  <section aria-labelledby="analytics-heading" className="space-y-6">
    <h2 id="analytics-heading" className="text-xl font-bold text-white">
      Civic SLA &amp; Resolution Analytics
    </h2>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { label: 'Total Grievances', value: String(analytics.total) },
        { label: 'Open Critical SLA', value: String(analytics.criticalOpen) },
        { label: 'SLA Compliance', value: `${analytics.slaCompliancePct}%` },
        { label: 'Citizen Satisfaction', value: `${analytics.avgRating} / 5` },
      ].map((kpi) => (
        <div key={kpi.label} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{kpi.label}</p>
          <p className="mt-2 text-3xl font-extrabold text-white">{kpi.value}</p>
        </div>
      ))}
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h3 className="text-base font-bold text-white">Department Workload</h3>
        <ul className="mt-4 space-y-3">
          {analytics.byDepartment.map((row) => {
            const pct = Math.min(100, row.total * 25);
            return (
              <li key={row.department} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-200">{row.department}</span>
                  <span className="text-slate-300">
                    {row.open} open / {row.total} total
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label={`${row.department} workload`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pct}
                  className="h-2 w-full rounded-full bg-slate-800"
                >
                  <div className="h-2 rounded-full bg-sky-500" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h3 className="text-base font-bold text-white">Top Reporting Wards</h3>
        <ol className="mt-4 space-y-2.5 text-sm">
          {analytics.topWards.map((w) => (
            <li
              key={w.ward}
              className="flex items-center justify-between rounded-lg bg-slate-950 px-3 py-2"
            >
              <span className="text-slate-200">{w.ward}</span>
              <span className="font-mono font-bold text-sky-300">{w.count} tickets</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  </section>
);
