"use client";

import { useState, useMemo } from "react";

interface Speaker {
  id: string;
  name: string;
  title?: string;
  company?: string;
}

interface Session {
  id: string;
  title: string;
  type: "TALK" | "PANEL" | "WORKSHOP" | "KEYNOTE" | "FIRESIDE_CHAT";
  speakers: Speaker[];
  room: { name: string; color: string };
  startTime: string;
  endTime: string;
  track?: string;
  registrationCount: number;
  capacity: number;
  description?: string;
}

interface SessionsListProps {
  sessions: Session[];
  onSelectSession: (id: string) => void;
}

const TYPE_BADGE: Record<string, { bg: string; text: string }> = {
  TALK: { bg: "bg-teal/15", text: "text-teal" },
  PANEL: { bg: "bg-lavender/15", text: "text-lavender" },
  WORKSHOP: { bg: "bg-gold/15", text: "text-gold" },
  KEYNOTE: { bg: "bg-sienna/15", text: "text-sienna" },
  FIRESIDE_CHAT: { bg: "bg-blush/15", text: "text-blush" },
};

const TYPE_LABELS: Record<string, string> = {
  TALK: "Talk",
  PANEL: "Panel",
  WORKSHOP: "Workshop",
  KEYNOTE: "Keynote",
  FIRESIDE_CHAT: "Fireside Chat",
};

const ALL_TYPES = ["ALL", "TALK", "PANEL", "WORKSHOP", "KEYNOTE", "FIRESIDE_CHAT"];

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function SessionsList({ sessions, onSelectSession }: SessionsListProps) {
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [trackFilter, setTrackFilter] = useState("ALL");

  const tracks = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => {
      if (s.track) set.add(s.track);
    });
    return Array.from(set).sort();
  }, [sessions]);

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (typeFilter !== "ALL" && s.type !== typeFilter) return false;
      if (trackFilter !== "ALL" && s.track !== trackFilter) return false;
      return true;
    });
  }, [sessions, typeFilter, trackFilter]);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Filter Bar */}
      <div className="flex items-center gap-4 px-5 py-3 border-b border-border bg-elevated/50">
        <span className="font-body text-sm text-text-secondary">Type:</span>
        <div className="flex gap-1.5">
          {ALL_TYPES.map((type) => {
            const isActive = typeFilter === type;
            const badge = type !== "ALL" ? TYPE_BADGE[type] : null;
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all duration-200 cursor-pointer border ${
                  isActive
                    ? badge
                      ? `${badge.bg} ${badge.text} border-current/20`
                      : "bg-text-primary/10 text-text-primary border-text-primary/20"
                    : "text-text-muted border-transparent hover:text-text-secondary hover:bg-elevated"
                }`}
              >
                {type === "ALL" ? "All" : TYPE_LABELS[type]}
              </button>
            );
          })}
        </div>

        {tracks.length > 0 && (
          <>
            <div className="w-px h-5 bg-border ml-2" />
            <span className="font-body text-sm text-text-secondary ml-2">Track:</span>
            <select
              value={trackFilter}
              onChange={(e) => setTrackFilter(e.target.value)}
              className="bg-base border border-border rounded-lg px-3 py-1.5 text-sm font-body text-text-primary focus:outline-none focus:border-gold/50 transition-colors"
            >
              <option value="ALL">All Tracks</option>
              {tracks.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </>
        )}

        <span className="ml-auto font-mono text-xs text-text-muted">
          {filtered.length} session{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Sessions Grid */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <p className="font-body text-sm text-text-muted">No sessions found</p>
          </div>
        )}

        {filtered.map((session) => {
          const badge = TYPE_BADGE[session.type] || { bg: "bg-elevated", text: "text-text-muted" };
          const fillPercent = session.capacity > 0
            ? Math.min((session.registrationCount / session.capacity) * 100, 100)
            : 0;
          const isNearFull = fillPercent >= 80;

          return (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className="text-left bg-elevated/50 border border-border-subtle rounded-xl p-4 hover:border-gold/20 hover:bg-elevated/80 transition-all duration-200 cursor-pointer group"
            >
              {/* Type badge + Track */}
              <div className="flex items-center gap-2 mb-2.5">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-body font-medium ${badge.bg} ${badge.text}`}
                >
                  {TYPE_LABELS[session.type]}
                </span>
                {session.track && (
                  <span className="font-body text-[11px] text-text-muted">{session.track}</span>
                )}
              </div>

              {/* Title */}
              <h3 className="font-display text-base font-semibold text-text-primary group-hover:text-gold transition-colors leading-snug mb-2">
                {session.title}
              </h3>

              {/* Speakers */}
              <div className="mb-3">
                {session.speakers.map((speaker, i) => (
                  <p key={speaker.id} className="font-body text-sm text-text-secondary leading-snug">
                    {speaker.name}
                    {speaker.title && (
                      <span className="text-text-muted">
                        {" "}
                        &middot; {speaker.title}
                      </span>
                    )}
                  </p>
                ))}
              </div>

              {/* Room & Time */}
              <div className="flex items-center gap-3 mb-3 text-text-muted">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: session.room.color }}
                  />
                  <span className="font-body text-xs">{session.room.name}</span>
                </div>
                <span className="font-mono text-xs">
                  {formatTime(session.startTime)} - {formatTime(session.endTime)}
                </span>
              </div>

              {/* Capacity Bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-body text-[10px] text-text-muted uppercase tracking-wider">
                    Registration
                  </span>
                  <span className={`font-mono text-xs ${isNearFull ? "text-sienna" : "text-text-secondary"}`}>
                    {session.registrationCount}/{session.capacity}
                  </span>
                </div>
                <div className="h-1.5 bg-base rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isNearFull ? "bg-sienna" : "bg-teal/60"
                    }`}
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
