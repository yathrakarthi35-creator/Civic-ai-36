import React, { useMemo, useState } from 'react';
import { Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Grievance } from '../types';
import { classifyGrievance } from '../lib/triageClient';

interface Props {
  existingGrievances: Grievance[];
  onSubmitGrievance: (payload: {
    title: string;
    description: string;
    ward: string;
    citizenName: string;
    citizenContact: string;
  }) => void;
}

const WARDS = [
  'Ward 03 - Market Square',
  'Ward 08 - Gandhi Nagar',
  'Ward 11 - Civic Center',
  'Ward 12 - Central',
  'Ward 14 - Indiranagar',
];

export const GrievanceForm: React.FC<Props> = ({ existingGrievances, onSubmitGrievance }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ward, setWard] = useState(WARDS[3]);
  const [citizenName, setCitizenName] = useState('');
  const [citizenContact, setCitizenContact] = useState('');
  const [submittedNotice, setSubmittedNotice] = useState('');

  const liveTriage = useMemo(() => {
    if (title.trim().length < 4 && description.trim().length < 6) return null;
    return classifyGrievance({ title, description, ward }, existingGrievances);
  }, [title, description, ward, existingGrievances]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 5 || description.trim().length < 10) return;
    onSubmitGrievance({
      title: title.trim(),
      description: description.trim(),
      ward,
      citizenName: citizenName.trim() || 'Citizen',
      citizenContact: citizenContact.trim(),
    });
    setTitle('');
    setDescription('');
    setSubmittedNotice('Grievance submitted, auto-triaged, and assigned an SLA ticket.');
  };

  return (
    <section aria-labelledby="intake-heading" className="grid gap-6 lg:grid-cols-3">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2"
      >
        <h2 id="intake-heading" className="text-xl font-bold text-white">
          Submit a Citizen Grievance
        </h2>
        <p className="text-sm text-slate-300">
          CivicResolve AI automatically routes your complaint to the right municipal department,
          calculates SLA urgency, and checks for duplicate ward reports.
        </p>

        {submittedNotice && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-950/50 p-3 text-sm text-emerald-200"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{submittedNotice}</span>
          </div>
        )}

        <div>
          <label htmlFor="grievance-title" className="block text-sm font-medium text-slate-200">
            Complaint Title
          </label>
          <input
            id="grievance-title"
            type="text"
            required
            minLength={5}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Burst drinking water pipeline near Main Street"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-400"
          />
        </div>

        <div>
          <label htmlFor="grievance-desc" className="block text-sm font-medium text-slate-200">
            Detailed Description
          </label>
          <textarea
            id="grievance-desc"
            required
            minLength={10}
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe location landmarks, duration, and any safety impact..."
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-400"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="grievance-ward" className="block text-sm font-medium text-slate-200">
              Municipal Ward
            </label>
            <select
              id="grievance-ward"
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              {WARDS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="citizen-name" className="block text-sm font-medium text-slate-200">
              Your Name
            </label>
            <input
              id="citizen-name"
              type="text"
              value={citizenName}
              onChange={(e) => setCitizenName(e.target.value)}
              placeholder="Full name"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-400"
            />
          </div>
          <div>
            <label htmlFor="citizen-contact" className="block text-sm font-medium text-slate-200">
              Email or Mobile
            </label>
            <input
              id="citizen-contact"
              type="text"
              value={citizenContact}
              onChange={(e) => setCitizenContact(e.target.value)}
              placeholder="citizen@example.in"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-400"
            />
          </div>
        </div>

        <button
          type="submit"
          className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500"
        >
          Submit &amp; Auto-Triage Grievance
        </button>
      </form>

      <aside
        aria-label="Live AI Triage Preview"
        className="rounded-xl border border-slate-800 bg-slate-900 p-6"
      >
        <div className="flex items-center gap-2 text-sky-300">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
          <h3 className="text-base font-bold text-white">Real-Time AI Triage Preview</h3>
        </div>
        {!liveTriage ? (
          <p className="mt-3 text-sm text-slate-400">
            Start typing your grievance to preview automated department routing, SLA deadline,
            urgency score, and duplicate detection.
          </p>
        ) : (
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-400">Department</dt>
              <dd className="font-semibold text-white">{liveTriage.department}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Priority &amp; SLA</dt>
              <dd className="font-semibold text-amber-300">
                {liveTriage.priority} ({liveTriage.slaHours}h)
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Urgency Score</dt>
              <dd className="font-semibold text-white">{liveTriage.urgencyScore}/100</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Sentiment</dt>
              <dd className="font-semibold text-slate-200">{liveTriage.sentiment}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Assigned Officer</dt>
              <dd className="text-right font-medium text-sky-200">{liveTriage.assignedOfficer}</dd>
            </div>
            {liveTriage.duplicateOf && (
              <div
                role="status"
                className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-950/40 p-3 text-amber-200"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Potential duplicate of open ticket {liveTriage.duplicateOf}.</span>
              </div>
            )}
          </dl>
        )}
      </aside>
    </section>
  );
};
