'use client';

import { useState, useEffect, useCallback } from 'react';
import RoomTimeline from '@/components/RoomTimeline';
import StatsBar from '@/components/StatsBar';
import QuickBookModal from '@/components/QuickBookModal';
import MeetingDetailPanel from '@/components/MeetingDetailPanel';

interface Room {
  id: string;
  name: string;
  slug: string;
  color: string;
  capacity: number;
  floor?: string;
}

interface Meeting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: 'CONFIRMED' | 'RESCHEDULING' | 'PENDING' | 'CANCELLED' | 'COMPLETED';
  room: { name: string; color: string; slug: string };
  contact: { name: string; company: string; email: string };
  salesRep: { name: string; id: string };
  notes?: string;
}

interface SalesRep {
  id: string;
  name: string;
  email: string;
}

export default function DashboardHome() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [showQuickBook, setShowQuickBook] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [meetingsRes, roomsRes] = await Promise.all([
        fetch(`/api/meetings?date=${today}`),
        fetch('/api/rooms?availability=true'),
      ]);

      if (!meetingsRes.ok || !roomsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [meetingsData, roomsData] = await Promise.all([
        meetingsRes.json(),
        roomsRes.json(),
      ]);

      setMeetings(meetingsData);
      setRooms(roomsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetch('/api/rooms')
      .then((res) => res.json())
      .then(() => {
        // Sales reps would come from a dedicated endpoint in production
        // For now, extract unique reps from meetings
        const reps = meetings.reduce<SalesRep[]>((acc, m) => {
          if (m.salesRep && !acc.find((r) => r.id === m.salesRep.id)) {
            acc.push({ id: m.salesRep.id, name: m.salesRep.name, email: '' });
          }
          return acc;
        }, []);
        setSalesReps(reps);
      })
      .catch(() => {});
  }, [meetings]);

  const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId) || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--gold)' }}
          />
          <p style={{ color: 'var(--text-muted)' }}>Loading timeline...</p>
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
            Unable to load data
          </p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            {error}
          </p>
          <button
            onClick={fetchData}
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
            Room Timeline
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <button
          onClick={() => setShowQuickBook(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:brightness-110"
          style={{ backgroundColor: 'var(--gold)', color: 'var(--bg-base)' }}
        >
          <span className="text-lg leading-none">+</span>
          Quick Book
        </button>
      </div>

      {/* Stats */}
      <StatsBar stats={{
        total: meetings.length,
        confirmed: meetings.filter((m) => m.status === 'CONFIRMED').length,
        rescheduling: meetings.filter((m) => m.status === 'RESCHEDULING').length,
        pending: meetings.filter((m) => m.status === 'PENDING').length,
        roomsActive: new Set(meetings.filter((m) => m.status !== 'CANCELLED').map((m) => m.room?.slug)).size,
        repsActive: new Set(meetings.map((m) => m.salesRep?.name)).size,
      }} />

      {/* Timeline */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <RoomTimeline
          meetings={meetings}
          rooms={rooms}
          onSelectMeeting={(id) => setSelectedMeetingId(id)}
        />
      </div>

      {/* Meeting Detail Panel */}
      <MeetingDetailPanel
        meetingId={selectedMeetingId}
        onClose={() => setSelectedMeetingId(null)}
      />

      {/* Quick Book Modal */}
      <QuickBookModal
        rooms={rooms}
        salesReps={salesReps}
        isOpen={showQuickBook}
        onClose={() => setShowQuickBook(false)}
        onCreated={fetchData}
      />
    </div>
  );
}
