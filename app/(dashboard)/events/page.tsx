'use client';

import { useState, useEffect, useCallback } from 'react';
import EventsList from '@/components/EventsList';

interface Event {
  id: string;
  title: string;
  description?: string;
  type: string;
  startTime: string;
  endTime: string;
  location?: string;
  organizer?: string;
  capacity?: number;
  attendeeCount?: number;
}

interface EventFormData {
  title: string;
  type: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  organizer: string;
  capacity: string;
}

const emptyForm: EventFormData = {
  title: '',
  type: 'networking',
  description: '',
  startTime: '',
  endTime: '',
  location: '',
  organizer: '',
  capacity: '',
};

const eventTypes = [
  { value: 'networking', label: 'Networking' },
  { value: 'keynote', label: 'Keynote' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'social', label: 'Social' },
  { value: 'meal', label: 'Meal' },
  { value: 'break', label: 'Break' },
  { value: 'other', label: 'Other' },
];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<EventFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/events');
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to create event');
      setFormData(emptyForm);
      setShowForm(false);
      fetchEvents();
    } catch {
      setError('Failed to create event');
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
          <p style={{ color: 'var(--text-muted)' }}>Loading events...</p>
        </div>
      </div>
    );
  }

  if (error && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div
          className="text-center p-8 rounded-xl border"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <p className="text-lg mb-2" style={{ color: 'var(--sienna)' }}>
            Unable to load events
          </p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{error}</p>
          <button
            onClick={fetchEvents}
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
            Events
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {events.length} event{events.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:brightness-110"
          style={{ backgroundColor: 'var(--gold)', color: 'var(--bg-base)' }}
        >
          <span className="text-lg leading-none">{showForm ? '\u00D7' : '+'}</span>
          {showForm ? 'Cancel' : 'Add Event'}
        </button>
      </div>

      {/* Add Event Form */}
      {showForm && (
        <div
          className="rounded-xl border p-6 animate-slide-in-top"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <h2
            className="text-lg font-light mb-5"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--gold)' }}
          >
            New Event
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
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
                placeholder="Event title"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  colorScheme: 'dark',
                }}
              >
                {eventTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Organizer
              </label>
              <input
                type="text"
                value={formData.organizer}
                onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
                placeholder="Organizer name"
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
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
                placeholder="Venue or room"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Capacity
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
                placeholder="Max attendees"
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
                placeholder="Event description"
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
                {submitting ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Events List */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <EventsList events={events} onSelectEvent={() => {}} />
      </div>
    </div>
  );
}
