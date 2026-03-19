'use client';

import { useState, useEffect, useCallback } from 'react';
import MeetingsTable from '@/components/MeetingsTable';
import MeetingDetailPanel from '@/components/MeetingDetailPanel';

interface Meeting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: 'CONFIRMED' | 'RESCHEDULING' | 'PENDING' | 'CANCELLED' | 'COMPLETED';
  room: { name: string; color: string; slug: string };
  contact: { name: string; company: string; email: string };
  salesRep: { name: string; id: string };
  attendeeCount?: number;
  hubspotDealId?: string;
  notes?: string;
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderStatus, setReminderStatus] = useState<string | null>(null);

  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/meetings');
      if (!res.ok) throw new Error('Failed to fetch meetings');
      const data = await res.json();
      setMeetings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleSendReminders = async () => {
    try {
      setSendingReminders(true);
      setReminderStatus(null);
      const res = await fetch('/api/agent/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'REMINDER', scope: 'next_hour' }),
      });
      const data = await res.json();
      if (res.ok) {
        setReminderStatus(`Sent ${data.processed} reminder(s) successfully`);
      } else {
        setReminderStatus(data.error || 'Failed to send reminders');
      }
    } catch {
      setReminderStatus('Failed to send reminders');
    } finally {
      setSendingReminders(false);
      setTimeout(() => setReminderStatus(null), 5000);
    }
  };

  const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId) || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--gold)' }}
          />
          <p style={{ color: 'var(--text-muted)' }}>Loading meetings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div
          className="text-center p-8 rounded-xl border"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <p className="text-lg mb-2" style={{ color: 'var(--sienna)' }}>
            Unable to load meetings
          </p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{error}</p>
          <button
            onClick={fetchMeetings}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--gold)', border: '1px solid var(--border)' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-light tracking-wide"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--text-primary)' }}
          >
            All Meetings
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {meetings.length} meeting{meetings.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          {reminderStatus && (
            <span
              className="text-xs px-3 py-1.5 rounded-full animate-fade-in"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                color: reminderStatus.includes('Failed') ? 'var(--sienna)' : 'var(--sage)',
                border: '1px solid var(--border)',
              }}
            >
              {reminderStatus}
            </span>
          )}
          <button
            onClick={handleSendReminders}
            disabled={sendingReminders}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--teal)',
              border: '1px solid var(--border)',
            }}
          >
            {sendingReminders ? (
              <>
                <span
                  className="w-3.5 h-3.5 border-2 rounded-full animate-spin inline-block"
                  style={{ borderColor: 'var(--border)', borderTopColor: 'var(--teal)' }}
                />
                Sending...
              </>
            ) : (
              <>
                <span>&#9993;</span>
                Send Reminders
              </>
            )}
          </button>
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <MeetingsTable
          meetings={meetings}
          onSelectMeeting={(id) => setSelectedMeetingId(id)}
        />
      </div>

      {/* Meeting Detail Panel */}
      <MeetingDetailPanel
        meetingId={selectedMeetingId}
        onClose={() => setSelectedMeetingId(null)}
      />
    </div>
  );
}
