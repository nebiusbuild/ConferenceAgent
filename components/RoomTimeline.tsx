"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

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
  status: "CONFIRMED" | "RESCHEDULING" | "PENDING" | "CANCELLED" | "COMPLETED";
  room: { name: string; color: string; slug: string };
  contact: { name: string; company: string };
  salesRep: { name: string };
}

interface RoomTimelineProps {
  meetings: Meeting[];
  rooms: Room[];
  onSelectMeeting: (id: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "bg-sage",
  RESCHEDULING: "bg-sienna",
  PENDING: "bg-gold",
  CANCELLED: "bg-red-500",
  COMPLETED: "bg-teal",
};

const STATUS_TEXT_COLORS: Record<string, string> = {
  CONFIRMED: "text-sage",
  RESCHEDULING: "text-sienna",
  PENDING: "text-gold",
  CANCELLED: "text-red-500",
  COMPLETED: "text-teal",
};

const TIME_SLOTS: string[] = [];
for (let h = 8; h <= 17; h++) {
  TIME_SLOTS.push(`${h.toString().padStart(2, "0")}:00`);
  TIME_SLOTS.push(`${h.toString().padStart(2, "0")}:30`);
}

function timeToMinutes(timeStr: string): number {
  const date = new Date(timeStr);
  return date.getHours() * 60 + date.getMinutes();
}

function formatTime(timeStr: string): string {
  const date = new Date(timeStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const ROW_HEIGHT = 48;
const START_MINUTES = 8 * 60;
const END_MINUTES = 18 * 60;

export default function RoomTimeline({
  meetings,
  rooms,
  onSelectMeeting,
}: RoomTimelineProps) {
  const [now, setNow] = useState(new Date());
  const [roomFilter, setRoomFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredRooms = useMemo(() => {
    if (roomFilter === "all") return rooms;
    return rooms.filter((r) => r.slug === roomFilter);
  }, [rooms, roomFilter]);

  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      if (roomFilter !== "all" && m.room.slug !== roomFilter) return false;
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      return true;
    });
  }, [meetings, roomFilter, statusFilter]);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowOffset =
    nowMinutes >= START_MINUTES && nowMinutes <= END_MINUTES
      ? ((nowMinutes - START_MINUTES) / 30) * ROW_HEIGHT
      : null;

  const getMeetingStyle = useCallback(
    (meeting: Meeting) => {
      const startMin = timeToMinutes(meeting.startTime);
      const endMin = timeToMinutes(meeting.endTime);
      const clampedStart = Math.max(startMin, START_MINUTES);
      const clampedEnd = Math.min(endMin, END_MINUTES);
      const top = ((clampedStart - START_MINUTES) / 30) * ROW_HEIGHT;
      const height = ((clampedEnd - clampedStart) / 30) * ROW_HEIGHT;
      return { top, height: Math.max(height, ROW_HEIGHT / 2) };
    },
    []
  );

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Filter Bar */}
      <div className="flex items-center gap-4 px-5 py-3 border-b border-border bg-elevated/50">
        <span className="font-body text-sm text-secondary">Filters:</span>
        <select
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
          className="bg-base border border-border rounded-lg px-3 py-1.5 text-sm font-body text-primary focus:outline-none focus:border-gold/50 transition-colors"
        >
          <option value="all">All Rooms</option>
          {rooms.map((room) => (
            <option key={room.slug} value={room.slug}>
              {room.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-base border border-border rounded-lg px-3 py-1.5 text-sm font-body text-primary focus:outline-none focus:border-gold/50 transition-colors"
        >
          <option value="all">All Statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PENDING">Pending</option>
          <option value="RESCHEDULING">Rescheduling</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <div className="ml-auto font-mono text-xs text-muted">
          {filteredMeetings.length} meetings
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="overflow-x-auto">
        <div
          className="relative"
          style={{
            minWidth: filteredRooms.length * 200 + 80,
          }}
        >
          {/* Room Headers */}
          <div
            className="flex sticky top-0 z-20 bg-elevated border-b border-border"
            style={{ paddingLeft: 80 }}
          >
            {filteredRooms.map((room) => (
              <div
                key={room.slug}
                className="flex-1 min-w-[180px] px-4 py-3 border-r border-border-subtle last:border-r-0"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: room.color }}
                  />
                  <span className="font-display text-sm font-semibold text-primary truncate">
                    {room.name}
                  </span>
                </div>
                <span className="font-body text-xs text-muted mt-0.5 block">
                  {room.capacity} seats
                </span>
              </div>
            ))}
          </div>

          {/* Grid Body */}
          <div className="relative">
            {/* Time Labels & Grid Lines */}
            {TIME_SLOTS.map((slot, i) => (
              <div
                key={slot}
                className="flex items-start"
                style={{ height: ROW_HEIGHT }}
              >
                <div className="w-[80px] shrink-0 pr-3 pt-0.5 text-right">
                  {slot.endsWith(":00") && (
                    <span className="font-mono text-xs text-muted">{slot}</span>
                  )}
                </div>
                <div
                  className={`flex-1 border-t ${
                    slot.endsWith(":00")
                      ? "border-border"
                      : "border-border-subtle/50"
                  }`}
                />
              </div>
            ))}

            {/* Column Dividers */}
            <div
              className="absolute inset-0 flex pointer-events-none"
              style={{ left: 80 }}
            >
              {filteredRooms.map((room) => (
                <div
                  key={room.slug}
                  className="flex-1 min-w-[180px] border-r border-border-subtle/30 last:border-r-0"
                />
              ))}
            </div>

            {/* Now Line */}
            {nowOffset !== null && (
              <div
                className="absolute left-[80px] right-0 z-10 flex items-center pointer-events-none"
                style={{ top: nowOffset }}
              >
                <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                <div className="flex-1 h-[2px] bg-red-500/80" />
              </div>
            )}

            {/* Meeting Blocks */}
            {filteredRooms.map((room, roomIndex) => {
              const roomMeetings = filteredMeetings.filter(
                (m) => m.room.slug === room.slug
              );
              return roomMeetings.map((meeting) => {
                const { top, height } = getMeetingStyle(meeting);
                const left = 80 + roomIndex * (100 / filteredRooms.length);
                return (
                  <button
                    key={meeting.id}
                    onClick={() => onSelectMeeting(meeting.id)}
                    className="absolute z-[5] rounded-lg px-2.5 py-1.5 text-left overflow-hidden transition-all duration-200 hover:brightness-125 hover:scale-[1.02] hover:z-10 group cursor-pointer border border-white/5"
                    style={{
                      top,
                      height,
                      left: `calc(80px + ${
                        (roomIndex / filteredRooms.length) * 100
                      }% + 4px)`,
                      width: `calc(${100 / filteredRooms.length}% - 8px)`,
                      backgroundColor: room.color + "25",
                      borderLeftColor: room.color,
                      borderLeftWidth: 3,
                    }}
                  >
                    <div className="font-body text-xs font-medium text-primary truncate">
                      {meeting.title}
                    </div>
                    {height > ROW_HEIGHT && (
                      <>
                        <div className="font-body text-[11px] text-secondary truncate mt-0.5">
                          {meeting.contact.name}
                        </div>
                        <div className="font-mono text-[10px] text-muted mt-0.5">
                          {formatTime(meeting.startTime)} -{" "}
                          {formatTime(meeting.endTime)}
                        </div>
                      </>
                    )}
                    <div
                      className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
                        STATUS_COLORS[meeting.status] || "bg-gray-500"
                      }`}
                    />
                  </button>
                );
              });
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
