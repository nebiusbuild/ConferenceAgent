'use client';

import { useState, useEffect, useCallback } from 'react';
import SessionsList from '@/components/SessionsList';

interface Session {
  id: string;
  title: string;
  description?: string;
  type: "TALK" | "PANEL" | "WORKSHOP" | "KEYNOTE" | "FIRESIDE_CHAT";
  speakers: { id: string; name: string; title?: string; company?: string }[];
  startTime: string;
  endTime: string;
  room: { name: string; color: string };
  track?: string;
  capacity: number;
  registrationCount: number;
}

interface SessionFormData {
  title: string;
  speaker: string;
  speakerTitle: string;
  description: string;
  startTime: string;
  endTime: string;
  room: string;
  track: string;
}

const emptyForm: SessionFormData = {
  title: '',
  speaker: '',
  speakerTitle: '',
  description: '',
  startTime: '',
  endTime: '',
  room: '',
  track: '',
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<SessionFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/sessions');
      if (!res.ok) throw new Error('Failed to fetch sessions');
      const data = await res.json();
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to create session');
      setFormData(emptyForm);
      setShowForm(false);
      fetchSessions();
    } catch {
      setError('Failed to create session');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--gold)' }}
          />
          <p style={{ color: 'var(--text-muted)' }}>Loading sessions...</p>
        </div>
      </div>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div
          className="text-center p-8 rounded-xl border"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <p className="text-lg mb-2" style={{ color: 'var(--sienna)' }}>
            Unable to load sessions
          </p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{error}</p>
          <button
            onClick={fetchSessions}
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
            Sessions &amp; Talks
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:brightness-110"
          style={{ backgroundColor: 'var(--gold)', color: 'var(--bg-base)' }}
        >
          <span className="text-lg leading-none">{showForm ? '\u00D7' : '+'}</span>
          {showForm ? 'Cancel' : 'Add Session'}
        </button>
      </div>

      {/* Add Session Form */}
      {showForm && (
        <div
          className="rounded-xl border p-6 animate-slide-in-top"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <h2
            className="text-lg font-light mb-5"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--gold)' }}
          >
            New Session
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors focus:ring-1"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
                placeholder="Session title"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Speaker
              </label>
              <input
                type="text"
                required
                value={formData.speaker}
                onChange={(e) => setFormData({ ...formData, speaker: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
                placeholder="Speaker name"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Speaker Title
              </label>
              <input
                type="text"
                value={formData.speakerTitle}
                onChange={(e) => setFormData({ ...formData, speakerTitle: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
                placeholder="e.g. VP of Engineering"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Start Time
              </label>
              <input
                type="datetime-local"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  colorScheme: 'dark',
                }}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                End Time
              </label>
              <input
                type="datetime-local"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  colorScheme: 'dark',
                }}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Room
              </label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
                placeholder="Room name"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Track
              </label>
              <input
                type="text"
                value={formData.track}
                onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
                placeholder="e.g. Engineering, Product"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors resize-none"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
                placeholder="Session description"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormData(emptyForm); }}
                className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:brightness-110 disabled:opacity-50"
                style={{ backgroundColor: 'var(--gold)', color: 'var(--bg-base)' }}
              >
                {submitting ? 'Creating...' : 'Create Session'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sessions List */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <SessionsList sessions={sessions} onSelectSession={() => {}} />
      </div>
    </div>
  );
}
