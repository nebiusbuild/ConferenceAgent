'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

interface Meeting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: 'CONFIRMED' | 'RESCHEDULING' | 'PENDING' | 'CANCELLED' | 'COMPLETED';
  room: { name: string; color: string; slug: string };
  contact: { name: string; company: string };
  salesRep: { name: string; id: string };
}

interface Room {
  id: string;
  name: string;
  slug: string;
  color: string;
  capacity: number;
}

const statusColors: Record<string, string> = {
  CONFIRMED: 'var(--sage)',
  COMPLETED: 'var(--teal)',
  PENDING: 'var(--gold)',
  RESCHEDULING: 'var(--lavender)',
  CANCELLED: 'var(--sienna)',
};

export default function AnalyticsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [meetingsRes, roomsRes] = await Promise.all([
        fetch('/api/meetings'),
        fetch('/api/rooms'),
      ]);
      if (!meetingsRes.ok || !roomsRes.ok) throw new Error('Failed to fetch data');
      const [meetingsData, roomsData] = await Promise.all([
        meetingsRes.json(),
        roomsRes.json(),
      ]);
      setMeetings(Array.isArray(meetingsData) ? meetingsData : meetingsData.meetings || []);
      setRooms(Array.isArray(roomsData) ? roomsData : roomsData.rooms || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Room utilization
  const roomUtilization = useMemo(() => {
    const utilMap: Record<string, number> = {};
    rooms.forEach((r) => { utilMap[r.name] = 0; });
    meetings.forEach((m) => {
      if (m.room?.name && (m.status === 'CONFIRMED' || m.status === 'COMPLETED')) {
        const duration = (new Date(m.endTime).getTime() - new Date(m.startTime).getTime()) / (1000 * 60 * 60);
        utilMap[m.room.name] = (utilMap[m.room.name] || 0) + duration;
      }
    });
    const maxHours = Math.max(...Object.values(utilMap), 1);
    return Object.entries(utilMap).map(([name, hours]) => ({
      name,
      hours: Math.round(hours * 10) / 10,
      percent: (hours / maxHours) * 100,
      color: rooms.find((r) => r.name === name)?.color || 'var(--teal)',
    }));
  }, [meetings, rooms]);

  // Status breakdown
  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    meetings.forEach((m) => {
      counts[m.status] = (counts[m.status] || 0) + 1;
    });
    const total = meetings.length || 1;
    let cumulative = 0;
    const segments = Object.entries(counts).map(([status, count]) => {
      const percent = (count / total) * 100;
      const start = cumulative;
      cumulative += percent;
      return { status, count, percent, start, color: statusColors[status] || 'var(--text-muted)' };
    });
    return { segments, total: meetings.length };
  }, [meetings]);

  // Top sales reps
  const topReps = useMemo(() => {
    const repMap: Record<string, { name: string; count: number; confirmed: number }> = {};
    meetings.forEach((m) => {
      if (m.salesRep?.name) {
        const key = m.salesRep.id || m.salesRep.name;
        if (!repMap[key]) {
          repMap[key] = { name: m.salesRep.name, count: 0, confirmed: 0 };
        }
        repMap[key].count++;
        if (m.status === 'CONFIRMED' || m.status === 'COMPLETED') {
          repMap[key].confirmed++;
        }
      }
    });
    return Object.values(repMap).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [meetings]);

  // Time-of-day heatmap
  const hourlyHeatmap = useMemo(() => {
    const hours = Array.from({ length: 12 }, (_, i) => ({ hour: i + 7, count: 0 }));
    meetings.forEach((m) => {
      const hour = new Date(m.startTime).getHours();
      const slot = hours.find((h) => h.hour === hour);
      if (slot) slot.count++;
    });
    const maxCount = Math.max(...hours.map((h) => h.count), 1);
    return hours.map((h) => ({ ...h, intensity: h.count / maxCount }));
  }, [meetings]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const confirmedMeetings = meetings.filter(
      (m) => m.status === 'CONFIRMED' || m.status === 'COMPLETED'
    );

    let totalDuration = 0;
    confirmedMeetings.forEach((m) => {
      totalDuration += (new Date(m.endTime).getTime() - new Date(m.startTime).getTime()) / (1000 * 60);
    });
    const avgDuration = confirmedMeetings.length > 0
      ? Math.round(totalDuration / confirmedMeetings.length)
      : 0;

    const roomCounts: Record<string, number> = {};
    confirmedMeetings.forEach((m) => {
      if (m.room?.name) {
        roomCounts[m.room.name] = (roomCounts[m.room.name] || 0) + 1;
      }
    });
    const busiestRoom = Object.entries(roomCounts).sort((a, b) => b[1] - a[1])[0];

    const repCounts: Record<string, { name: string; count: number }> = {};
    meetings.forEach((m) => {
      if (m.salesRep?.name) {
        const key = m.salesRep.id || m.salesRep.name;
        if (!repCounts[key]) repCounts[key] = { name: m.salesRep.name, count: 0 };
        repCounts[key].count++;
      }
    });
    const topRep = Object.values(repCounts).sort((a, b) => b.count - a.count)[0];

    return {
      avgDuration,
      busiestRoom: busiestRoom ? { name: busiestRoom[0], count: busiestRoom[1] } : null,
      topRep: topRep || null,
      totalMeetings: meetings.length,
      confirmationRate: meetings.length > 0
        ? Math.round((confirmedMeetings.length / meetings.length) * 100)
        : 0,
    };
  }, [meetings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--gold)' }}
          />
          <p style={{ color: 'var(--text-muted)' }}>Loading analytics...</p>
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
          <p className="text-lg mb-2" style={{ color: 'var(--sienna)' }}>Unable to load analytics</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{error}</p>
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

  const conicGradient = statusBreakdown.segments
    .map((s) => `${s.color} ${s.start}% ${s.start + s.percent}%`)
    .join(', ');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-light tracking-wide"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--text-primary)' }}
        >
          Analytics
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Conference scheduling insights and metrics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Meetings', value: summaryStats.totalMeetings.toString(), color: 'var(--gold)' },
          { label: 'Avg Duration', value: `${summaryStats.avgDuration}m`, color: 'var(--teal)' },
          { label: 'Confirmation Rate', value: `${summaryStats.confirmationRate}%`, color: 'var(--sage)' },
          {
            label: 'Busiest Room',
            value: summaryStats.busiestRoom?.name || '--',
            sub: summaryStats.busiestRoom ? `${summaryStats.busiestRoom.count} meetings` : undefined,
            color: 'var(--lavender)',
          },
          {
            label: 'Top Rep',
            value: summaryStats.topRep?.name || '--',
            sub: summaryStats.topRep ? `${summaryStats.topRep.count} meetings` : undefined,
            color: 'var(--blush)',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="p-4 rounded-xl border"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              {card.label}
            </p>
            <p
              className="text-xl font-light"
              style={{ color: card.color, fontFamily: "'Cormorant Garamond', serif" }}
            >
              {card.value}
            </p>
            {(card as { sub?: string }).sub && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {(card as { sub?: string }).sub}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Utilization */}
        <div
          className="rounded-xl border p-5"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <h2 className="text-sm font-medium mb-5" style={{ color: 'var(--text-secondary)' }}>
            Room Utilization (hours)
          </h2>
          <div className="space-y-3">
            {roomUtilization.map((room) => (
              <div key={room.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {room.name}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}
                  >
                    {room.hours}h
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--bg-elevated)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${room.percent}%`,
                      backgroundColor: room.color,
                      opacity: 0.8,
                    }}
                  />
                </div>
              </div>
            ))}
            {roomUtilization.length === 0 && (
              <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
                No room data available
              </p>
            )}
          </div>
        </div>

        {/* Meeting Status Donut */}
        <div
          className="rounded-xl border p-5"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <h2 className="text-sm font-medium mb-5" style={{ color: 'var(--text-secondary)' }}>
            Meeting Status Breakdown
          </h2>
          <div className="flex items-center gap-8">
            <div className="relative w-36 h-36 shrink-0">
              <div
                className="w-full h-full rounded-full"
                style={{
                  background: statusBreakdown.segments.length > 0
                    ? `conic-gradient(${conicGradient})`
                    : 'var(--bg-elevated)',
                }}
              />
              <div
                className="absolute inset-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--bg-surface)' }}
              >
                <div className="text-center">
                  <p
                    className="text-2xl font-light"
                    style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--text-primary)' }}
                  >
                    {statusBreakdown.total}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Total
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2.5 flex-1">
              {statusBreakdown.segments.map((s) => (
                <div key={s.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {s.status.charAt(0) + s.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <span
                    className="text-xs"
                    style={{ color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}
                  >
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Sales Reps */}
        <div
          className="rounded-xl border p-5"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <h2 className="text-sm font-medium mb-5" style={{ color: 'var(--text-secondary)' }}>
            Top Sales Reps
          </h2>
          <div className="space-y-3">
            {topReps.map((rep, i) => {
              const maxCount = topReps[0]?.count || 1;
              return (
                <div key={rep.name} className="flex items-center gap-3">
                  <span
                    className="w-5 text-xs text-right shrink-0"
                    style={{ color: 'var(--text-ghost)', fontFamily: "'DM Mono', monospace" }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        {rep.name}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}
                      >
                        {rep.count} ({rep.confirmed} confirmed)
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'var(--bg-elevated)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(rep.count / maxCount) * 100}%`,
                          backgroundColor: 'var(--gold)',
                          opacity: 0.7,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {topReps.length === 0 && (
              <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
                No rep data available
              </p>
            )}
          </div>
        </div>

        {/* Time-of-Day Heatmap */}
        <div
          className="rounded-xl border p-5"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <h2 className="text-sm font-medium mb-5" style={{ color: 'var(--text-secondary)' }}>
            Meeting Frequency by Hour
          </h2>
          <div className="grid grid-cols-6 gap-2">
            {hourlyHeatmap.map((slot) => (
              <div key={slot.hour} className="text-center">
                <div
                  className="w-full aspect-square rounded-lg flex items-center justify-center mb-1.5 transition-all"
                  style={{
                    backgroundColor: slot.intensity > 0
                      ? `rgba(201, 168, 76, ${0.1 + slot.intensity * 0.6})`
                      : 'var(--bg-elevated)',
                    border: slot.intensity > 0.5
                      ? '1px solid rgba(201, 168, 76, 0.3)'
                      : '1px solid transparent',
                  }}
                >
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: slot.intensity > 0.3 ? 'var(--gold)' : 'var(--text-ghost)',
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {slot.count}
                  </span>
                </div>
                <span
                  className="text-[10px]"
                  style={{ color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}
                >
                  {slot.hour > 12 ? `${slot.hour - 12}p` : slot.hour === 12 ? '12p' : `${slot.hour}a`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
