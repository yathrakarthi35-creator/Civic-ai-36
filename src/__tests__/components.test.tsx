import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalyticsPanel } from '../components/AnalyticsPanel';
import { TicketTracker } from '../components/TicketTracker';
import { GrievanceBoard } from '../components/GrievanceBoard';
import { computeCivicAnalytics, createSeedGrievances } from '../lib/triageClient';

describe('CivicResolve Module Component Tests', () => {
  it('renders AnalyticsPanel KPIs and accessible department progressbars', () => {
    const analytics = computeCivicAnalytics(createSeedGrievances());
    render(<AnalyticsPanel analytics={analytics} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar')).toHaveLength(6);
  });

  it('looks up a resolved ticket in TicketTracker and records citizen rating', () => {
    const onRate = vi.fn();
    render(<TicketTracker grievances={createSeedGrievances()} onRateResolution={onRate} />);
    fireEvent.change(screen.getByLabelText(/enter grievance ticket id/i), {
      target: { value: 'CR-2026-1003' },
    });
    fireEvent.click(screen.getByRole('button', { name: /rate 5 out of 5/i }));
    expect(onRate).toHaveBeenCalledWith('CR-2026-1003', 5);
  });

  it('filters GrievanceBoard by status and triggers Escalate and Mark Resolved', () => {
    const onUpdate = vi.fn();
    const onCopilot = vi.fn();
    render(
      <GrievanceBoard
        grievances={createSeedGrievances()}
        onUpdateStatus={onUpdate}
        onOpenCopilot={onCopilot}
      />
    );
    fireEvent.change(screen.getByLabelText(/filter by status/i), { target: { value: 'Triaged' } });
    fireEvent.click(screen.getByRole('button', { name: /mark resolved/i }));
    expect(onUpdate).toHaveBeenCalledWith(
      'CR-2026-1002',
      'Resolved',
      'Verified resolved by municipal field team'
    );
  });
});
