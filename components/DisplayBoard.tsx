"use client";

import { useState, useEffect, useCallback } from "react";

interface RoomMeeting {
  id: string;
  title: string;
  company: string;
  startTime: string;
  endTime: string;
}

interface RoomData {
  id: string;
  name: string;
  slug: string;
  color: string;
  capacity: number;
  floor: string;
  currentMeeting: RoomMeeting | null;
  nextMeeting: RoomMeeting | null;
}

interface DisplayBoardProps {
  initialRooms: RoomData[];
  floor?: string;
}

function formatClock(d: Date): string {
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatMeetingTime(ts: string): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getTimeRemaining(endTime: string, now: Date): string {
  const diff = new Date(endTime).getTime() - now.getTime();
  if (diff <= 0) return "Ending...";
  const totalMin = Math.floor(diff / 60000);
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours > 0) return `${hours}h ${mins}m remaining`;
  return `${mins}m remaining`;
}

export default function DisplayBoard({ initialRooms, floor }: DisplayBoardProps) {
  const [rooms, setRooms] = useState<RoomData[]>(initialRooms);
  const [now, setNow] = useState(new Date());

  // Clock tick every second
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh data every 30 seconds
  const refreshData = useCallback(async () => {
    try {
      const url = floor ? `/api/rooms?floor=${encodeURIComponent(floor)}` : "/api/rooms";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
      }
    } catch {
      // silently retry next cycle
    }
  }, [floor]);

  useEffect(() => {
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const displayRooms = floor ? rooms.filter((r) => r.floor === floor) : rooms;

  return (
    <div className="min-h-screen bg-base text-text-primary flex flex-col">
      {/* Clock Header */}
      <div className="flex flex-col items-center justify-center py-8 border-b border-border">
        <div className="font-mono text-6xl font-light text-text-primary tracking-widest">
          {formatClock(now)}
        </div>
        <div className="font-display text-lg text-text-secondary mt-2 tracking-wide">
          {formatDate(now)}
        </div>
        {floor && (
          <div className="font-body text-sm text-gold mt-1 uppercase tracking-widest">
            {floor}
          </div>
        )}
      </div>

      {/* Room Grid */}
      <div className="flex-1 p-8">
        <div className="grid grid-cols-3 grid-rows-2 gap-6 h-full">
          {displayRooms.slice(0, 6).map((room) => {
            const isAvailable = !room.currentMeeting;

            return (
              <div
                key={room.id}
                className={`relative rounded-2xl border overflow-hidden transition-all duration-500 ${
                  isAvailable
                    ? "border-sage/30 bg-sage/5"
                    : "border-border bg-surface"
                }`}
              >
                {/* Room color accent bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: room.color }}
                />

                <div className="p-6 flex flex-col h-full">
                  {/* Room name & floor */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-display text-xl font-semibold text-text-primary">
                        {room.name}
                      </h3>
                      <p className="font-body text-xs text-text-muted mt-0.5">
                        {room.floor} &middot; {room.capacity} seats
                      </p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-body font-medium ${
                        isAvailable
                          ? "bg-sage/20 text-sage"
                          : "bg-sienna/20 text-sienna"
                      }`}
                    >
                      {isAvailable ? "AVAILABLE" : "IN USE"}
                    </div>
                  </div>

                  {/* Current Meeting */}
                  {room.currentMeeting ? (
                    <div className="flex-1">
                      <div className="mb-4">
                        <p className="font-body text-xs text-text-muted uppercase tracking-wider mb-1.5">
                          Now
                        </p>
                        <h4 className="font-display text-lg font-semibold text-text-primary leading-tight">
                          {room.currentMeeting.title}
                        </h4>
                        <p className="font-body text-sm text-text-secondary mt-1">
                          {room.currentMeeting.company}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="font-mono text-xs text-text-muted">
                            {formatMeetingTime(room.currentMeeting.startTime)} -{" "}
                            {formatMeetingTime(room.currentMeeting.endTime)}
                          </span>
                        </div>
                        <div className="mt-2 px-2.5 py-1 bg-sienna/15 rounded-md inline-block">
                          <span className="font-mono text-xs text-sienna font-medium">
                            {getTimeRemaining(room.currentMeeting.endTime, now)}
                          </span>
                        </div>
                      </div>

                      {/* Next Meeting */}
                      {room.nextMeeting && (
                        <div className="mt-auto pt-3 border-t border-border-subtle">
                          <p className="font-body text-xs text-text-muted uppercase tracking-wider mb-1">
                            Up Next
                          </p>
                          <p className="font-body text-sm text-text-secondary">
                            {room.nextMeeting.title}
                          </p>
                          <p className="font-mono text-xs text-text-muted mt-0.5">
                            {formatMeetingTime(room.nextMeeting.startTime)}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-sage/10 border border-sage/20 flex items-center justify-center mb-3">
                        <svg
                          className="w-8 h-8 text-sage"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      </div>
                      <span className="font-display text-lg text-sage font-semibold">Available</span>
                      {room.nextMeeting && (
                        <div className="mt-3 text-center">
                          <p className="font-body text-xs text-text-muted">
                            Next: {room.nextMeeting.title}
                          </p>
                          <p className="font-mono text-xs text-text-muted mt-0.5">
                            at {formatMeetingTime(room.nextMeeting.startTime)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
