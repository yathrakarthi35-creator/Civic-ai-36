import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { Grievance } from '../types';
import { draftResolutionResponse } from '../lib/triageClient';

interface Props {
  grievance: Grievance | null;
  onClose: () => void;
}

export const AiCopilotModal: React.FC<Props> = ({ grievance, onClose }) => {
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!grievance) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [grievance, onClose]);

  if (!grievance) return null;

  const draft = draftResolutionResponse({
    ticketId: grievance.id,
    citizenName: grievance.citizenName,
    department: grievance.department,
    status: grievance.status,
    language,
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="copilot-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 id="copilot-modal-title" className="text-lg font-bold text-white">
            AI Citizen Response Copilot — {grievance.id}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 flex gap-2" role="group" aria-label="Response language">
          <button
            type="button"
            aria-pressed={language === 'en'}
            onClick={() => setLanguage('en')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
              language === 'en' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-200'
            }`}
          >
            English
          </button>
          <button
            type="button"
            aria-pressed={language === 'hi'}
            onClick={() => setLanguage('hi')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
              language === 'hi' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-200'
            }`}
          >
            हिन्दी (Hindi)
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm text-slate-200">
          {draft.message}
        </div>
      </div>
    </div>
  );
};
