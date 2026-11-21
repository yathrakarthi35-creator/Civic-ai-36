import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import { ErrorBoundary } from '../components/ErrorBoundary';

describe('CivicResolve WCAG 2.1 AA Accessibility & Interactive Flows', () => {
  it('renders all 4 semantic landmarks, skip link, and keyboard-accessible modal', async () => {
    render(<App />);
    expect(screen.getByRole('link', { name: /skip to main content/i })).toHaveAttribute(
      'href',
      '#main-content'
    );
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /primary navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();

    const draftButtons = screen.getAllByRole('button', { name: /ai draft reply/i });
    fireEvent.click(draftButtons[0]);
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('supports end-to-end citizen grievance submission and ticket tracking', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /report grievance/i }));
    const titleInput = await screen.findByLabelText(/complaint title/i);
    fireEvent.change(titleInput, {
      target: { value: 'Broken streetlight pole sparking near park' },
    });
    fireEvent.change(screen.getByLabelText(/detailed description/i), {
      target: { value: 'Exposed electric wire sparking near the children park gate.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit & auto-triage grievance/i }));
    expect(screen.getByText(/grievance submitted, auto-triaged/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /track ticket/i }));
    expect(await screen.findByLabelText(/enter grievance ticket id/i)).toBeInTheDocument();
  });

  it('displays an accessible alert fallback via ErrorBoundary', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const Crash = () => {
      throw new Error('Simulated render crash');
    };
    render(
      <ErrorBoundary>
        <Crash />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Simulated render crash');
    spy.mockRestore();
  });
});
