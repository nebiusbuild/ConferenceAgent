"use client";

import { useState, useEffect } from "react";

interface ScheduleItem {
  id: string;
  type: "meeting" | "session" | "event";
  title: string;
  startTime: string;
  endTime: string;
  room?: string;
  location?: string;
  description?: string;
  registrationId?: string;
}

interface PersonScheduleProps {
  contactId: string;
  contactName: string;
  contactCompany: string;
}

const TYPE_STYLES: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  meeting: { bg: "bg-gold/10", text: "text-gold", label: "Meeting", dot: "bg-gold" },
  session: { bg: "bg-teal/10", text: "text-teal", label: "Session", dot: "bg-teal" },
  event: { bg: "bg-lavender/10", text: "text-lavender", label: "Event", dot: "bg-lavender" },
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
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function PersonSchedule({
  contactId,
  contactName,
  contactCompany,
}: PersonScheduleProps) {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchSchedule = async () => {
    try {
      const res = await fetch(`/api/schedule/${contactId}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchSchedule();
  }, [contactId]);

  const handleRemove = async (item: ScheduleItem) => {
    if (!item.registrationId) return;
    setRemovingId(item.id);
    try {
      await fetch(`/api/schedule/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove",
          registrationId: item.registrationId,
          itemId: item.id,
          type: item.type,
        }),
      });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch {
      // silently handle
    } finally {
      setRemovingId(null);
    }
  };

  // Group items by date
  const groupedByDate = items.reduce<Record<string, ScheduleItem[]>>((acc, item) => {
    const dateKey = formatDate(item.startTime);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});

  // Sort each group by time
  Object.values(groupedByDate).forEach((group) =>
    group.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  );

  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) =>
      new Date(groupedByDate[a][0].startTime).getTime() -
      new Date(groupedByDate[b][0].startTime).getTime()
  );

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-elevated/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gold/15 border border-gold/20 flex items-center justify-center">
            <span className="font-display text-lg font-bold text-gold">
              {contactName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </span>
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-text-primary">{contactName}</h2>
            <p className="font-body text-sm text-text-secondary">{contactCompany}</p>
          </div>
          <div className="ml-auto">
            <span className="font-mono text-xs text-text-muted">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-5">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-body text-sm text-text-muted">No scheduled items</p>
          </div>
        )}

        {!loading &&
          sortedDates.map((dateLabel) => (
            <div key={dateLabel} className="mb-6 last:mb-0">
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-4">
                <h3 className="font-display text-sm font-semibold text-text-secondary">{dateLabel}</h3>
                <div className="flex-1 h-px bg-border-subtle" />
              </div>

              {/* Timeline */}
              <div className="space-y-0">
                {groupedByDate[dateLabel].map((item, i) => {
                  const style = TYPE_STYLES[item.type] || TYPE_STYLES.event;
                  const isRemoving = removingId === item.id;
                  const isLast = i === groupedByDate[dateLabel].length - 1;

                  return (
                    <div key={item.id} className="flex gap-4">
                      {/* Timeline connector */}
                      <div className="flex flex-col items-center pt-1">
                        <div className={`w-3 h-3 rounded-full shrink-0 ${style.dot}`} />
                        {!isLast && <div className="w-[1px] flex-1 bg-border-subtle min-h-[16px]" />}
                      </div>

                      {/* Card */}
                      <div
                        className={`flex-1 mb-3 rounded-lg border border-border-subtle p-4 transition-all duration-200 hover:border-border ${
                          isRemoving ? "opacity-50" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Type + Time */}
                            <div className="flex items-center gap-2 mb-1.5">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-body font-medium ${style.bg} ${style.text}`}
                              >
                                {style.label}
                              </span>
                              <span className="font-mono text-xs text-text-muted">
                                {formatTime(item.startTime)} - {formatTime(item.endTime)}
                              </span>
                            </div>

                            {/* Title */}
                            <h4 className="font-display text-base font-semibold text-text-primary leading-snug">
                              {item.title}
                            </h4>

                            {/* Location */}
                            {(item.room || item.location) && (
                              <p className="font-body text-xs text-text-muted mt-1">
                                {item.room || item.location}
                              </p>
                            )}
                          </div>

                          {/* Remove button */}
                          {item.registrationId && (
                            <button
                              onClick={() => handleRemove(item)}
                              disabled={isRemoving}
                              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
                              title="Remove from schedule"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
