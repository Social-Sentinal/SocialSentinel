'use client';

import React, { useState } from 'react';
import { X, Flag, Check } from 'lucide-react';
import { submitReportAction } from '@/modules/moderation/actions';

interface ReportModalProps {
  postId: string;
  onClose: () => void;
}

const REPORT_REASONS = [
  'Spam or misleading automated content',
  'Harassment or personal abuse',
  'Hate speech or discriminatory language',
  'Misinformation or ungrounded claims',
  'Intellectual property violation',
  'Other policy concern',
];

export function ReportModal({ postId, onClose }: ReportModalProps) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    const res = await submitReportAction('post', postId, reason, details);
    if (res?.success) {
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 text-rose-500">
            <Flag className="w-4 h-4" />
            <h2 className="font-heading font-bold text-base text-[var(--text-primary)]">
              Report Content
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[var(--text-secondary)]">
          Reports are reviewed by human moderators in accordance with SocialSentinel Community Standards.
        </p>

        {/* Reason Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-[var(--text-primary)]">Reason:</label>
          <div className="flex flex-col gap-1.5">
            {REPORT_REASONS.map((r) => (
              <label
                key={r}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                  reason === r
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 font-semibold'
                    : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-indigo-500/30'
                }`}
              >
                <input
                  type="radio"
                  name="reportReason"
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="accent-indigo-600"
                />
                <span>{r}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Additional Details */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-[var(--text-primary)]">
            Additional Details (Optional):
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Help moderators understand the context..."
            rows={2}
            className="text-xs p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || submitted}
          className="w-full py-2.5 rounded-xl text-xs font-heading font-semibold bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98"
        >
          {submitted ? (
            <>
              <Check className="w-4 h-4" />
              <span>Report Submitted</span>
            </>
          ) : (
            <>
              <Flag className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting...' : 'Submit Report'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
