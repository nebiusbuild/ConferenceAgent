"use client";

import { useState, useMemo } from "react";

interface ConferenceEvent {
  id: string;
  title: string;
  type: string;
  location?: string;
  room?: { name: string; color: string };
  startTime: string;
  endTime: string;
  capacity?: number;
  registrationCount?: number;
  dressCode?: string;
  description?: string;
}

interface EventsListProps {
  events: ConferenceEvent[];
  onSelectEvent: (id: string) => void;
}

const TYPE_BADGE: Record<string, { bg: string; text: string; icon: string }> = {
  HAPPY_HOUR: { bg: "bg-gold/15", text: "text-gold", icon: "🍸" },
  DINNER: { bg: "bg-sienna/15", text: "text-sienna", icon: "🍽" },
  NETWORKING: { bg: "bg-teal/15", text: "text-teal", icon: "🤝" },
  PARTY: { bg: "bg-lavender/15", text: "text-lavender", icon: "🎉" },
  BREAKFAST: { bg: "bg-blush/15", text: "text-blush", icon: "☕" },
  RECEPTION: { bg: "bg-sage/15", text: "text-sage", icon: "🥂" },
  TOUR: { bg: "bg-teal/15", text: "text-teal", icon: "🚶" },
  WORKSHOP_SOCIAL: { bg: "bg-gold/15", text: "text-gold", icon: "🎨" },
};

const TYPE_LABELS: Record<string, string> = {
  HAPPY_HOUR: "Happy Hour",
  DINNER: "Dinner",
  NETWORKING: "Networking",
  PARTY: "Party",
  BREAKFAST: "Breakfast",
  RECEPTION: "Reception",
  TOUR: "Tour",
  WORKSHOP_SOCIAL: "Social Workshop",
};

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function EventsList({ events, onSelectEvent }: EventsListProps) {
  const [typeFilter, setTypeFilter] = useState("ALL");

  const eventTypes = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => set.add(e.type));
    return Array.from(set).sort();
  }, [events]);

  const filtered = useMemo(() => {
    if (typeFilter === "ALL") return events;
    return events.filter((e) => e.type === typeFilter);
  }, [events, typeFilter]);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Filter Bar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-elevated/50 overflow-x-auto">
        <span className="font-body text-sm text-text-secondary shrink-0">Filter:</span>
        <button
          onClick={() => setTypeFilter("ALL")}
          className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all duration-200 cursor-pointer shrink-0 ${
            typeFilter === "ALL"
              ? "bg-text-primary/10 text-text-primary"
              : "text-text-muted hover:text-text-secondary hover:bg-elevated"
          }`}
        >
          All Events
        </button>
        {eventTypes.map((type) => {
          const badge = TYPE_BADGE[type] || { bg: "bg-elevated", text: "text-text-muted", icon: "📅" };
          const isActive = typeFilter === type;
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all duration-200 cursor-pointer shrink-0 ${
                isActive
                  ? `${badge.bg} ${badge.text}`
                  : "text-text-muted hover:text-text-secondary hover:bg-elevated"
              }`}
            >
              {TYPE_LABELS[type] || type}
            </button>
          );
        })}
        <span className="ml-auto font-mono text-xs text-text-muted shrink-0">
          {filtered.length} event{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Events List */}
      <div className="p-5 space-y-4">
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="font-body text-sm text-text-muted">No events found</p>
          </div>
        )}

        {filtered.map((event) => {
          const badge = TYPE_BADGE[event.type] || { bg: "bg-elevated", text: "text-text-muted", icon: "📅" };
          const locationName = event.room?.name || event.location || "TBD";

          return (
            <button
              key={event.id}
              onClick={() => onSelectEvent(event.id)}
              className="w-full text-left bg-elevated/40 border border-border-subtle rounded-xl p-5 hover:border-gold/20 hover:bg-elevated/70 transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl ${badge.bg} flex items-center justify-center text-xl shrink-0`}
                >
                  {badge.icon}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-body font-medium ${badge.bg} ${badge.text}`}
                    >
                      {TYPE_LABELS[event.type] || event.type}
                    </span>
                    {event.dressCode && (
                      <span className="font-body text-[11px] text-text-muted italic">
                        {event.dressCode}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-lg font-semibold text-text-primary group-hover:text-gold transition-colors leading-snug mb-1.5">
                    {event.title}
                  </h3>

                  {/* Details Row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-text-muted">
                    {/* Location */}
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0Z" />
                      </svg>
                      <span className="font-body text-xs">{locationName}</span>
                    </div>

                    {/* Date & Time */}
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      <span className="font-mono text-xs">
                        {formatDate(event.startTime)} &middot; {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </span>
                    </div>

                    {/* Capacity */}
                    {event.capacity !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                        </svg>
                        <span className="font-mono text-xs">
                          {event.registrationCount !== undefined ? `${event.registrationCount}/` : ""}
                          {event.capacity}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
