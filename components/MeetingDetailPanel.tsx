"use client";

import { useState, useEffect } from "react";

interface MeetingDetail {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  room: { name: string; color: string; slug: string };
  contact: { name: string; company: string; email: string; phone?: string };
  salesRep: { name: string; email: string };
  attendeeCount?: number;
  notes?: string;
  hubspotDealId?: string;
  hubspotContactId?: string;
  agentLog?: {
    id: string;
    timestamp: string;
    type: string;
    message: string;
    channel: string;
    status: string;
  }[];
}

interface MeetingDetailPanelProps {
  meetingId: string | null;
  onClose: () => void;
}

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  CONFIRMED: { bg: "bg-sage/15", text: "text-sage" },
  RESCHEDULING: { bg: "bg-sienna/15", text: "text-sienna" },
  PENDING: { bg: "bg-gold/15", text: "text-gold" },
  CANCELLED: { bg: "bg-red-500/15", text: "text-red-400" },
  COMPLETED: { bg: "bg-teal/15", text: "text-teal" },
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

export default function MeetingDetailPanel({ meetingId, onClose }: MeetingDetailPanelProps) {
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!meetingId) {
      setMeeting(null);
      return;
    }

    setLoading(true);
    fetch(`/api/meetings/${meetingId}`)
      .then((res) => res.json())
      .then((data) => setMeeting(data))
      .catch(() => setMeeting(null))
      .finally(() => setLoading(false));
  }, [meetingId]);

  const handleAction = async (action: string) => {
    if (!meetingId) return;
    setActionLoading(action);
    try {
      await fetch(`/api/meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      // Refetch
      const res = await fetch(`/api/meetings/${meetingId}`);
      const data = await res.json();
      setMeeting(data);
    } catch {
      // handle error silently
    } finally {
      setActionLoading(null);
    }
  };

  const isOpen = meetingId !== null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-lg bg-surface border-l border-border z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-elevated/50">
          <h2 className="font-display text-lg font-semibold text-text-primary">Meeting Details</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-base text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-64px)] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
          )}

          {!loading && !meeting && meetingId && (
            <div className="flex items-center justify-center py-20">
              <p className="font-body text-sm text-text-muted">Meeting not found</p>
            </div>
          )}

          {!loading && meeting && (
            <div className="px-6 py-5 space-y-6">
              {/* Title & Status */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-xl font-semibold text-text-primary leading-tight">
                    {meeting.title}
                  </h3>
                  <span
                    className={`shrink-0 inline-block px-3 py-1 rounded-full text-xs font-body font-medium ${
                      (STATUS_BADGE[meeting.status] || { bg: "bg-gray-500/15", text: "text-gray-400" }).bg
                    } ${
                      (STATUS_BADGE[meeting.status] || { bg: "bg-gray-500/15", text: "text-gray-400" }).text
                    }`}
                  >
                    {meeting.status}
                  </span>
                </div>
              </div>

              {/* Room */}
              <div className="flex items-center gap-3 bg-elevated/60 rounded-lg px-4 py-3 border border-border-subtle">
                <div
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: meeting.room.color }}
                />
                <div>
                  <span className="font-display text-sm font-semibold text-text-primary">
                    {meeting.room.name}
                  </span>
                </div>
              </div>

              {/* Time */}
              <div>
                <h4 className="font-body text-xs text-text-muted uppercase tracking-wider mb-2">Schedule</h4>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span className="font-mono text-sm text-text-primary">
                    {formatDate(meeting.startTime)} &middot; {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                  </span>
                </div>
              </div>

              {/* Contact */}
              <div>
                <h4 className="font-body text-xs text-text-muted uppercase tracking-wider mb-2">Contact</h4>
                <div className="space-y-1.5">
                  <p className="font-body text-sm text-text-primary font-medium">{meeting.contact.name}</p>
                  <p className="font-body text-sm text-text-secondary">{meeting.contact.company}</p>
                  <p className="font-mono text-xs text-text-muted">{meeting.contact.email}</p>
                  {meeting.contact.phone && (
                    <p className="font-mono text-xs text-text-muted">{meeting.contact.phone}</p>
                  )}
                </div>
              </div>

              {/* Sales Rep */}
              <div>
                <h4 className="font-body text-xs text-text-muted uppercase tracking-wider mb-2">Sales Rep</h4>
                <p className="font-body text-sm text-text-primary">{meeting.salesRep.name}</p>
                <p className="font-mono text-xs text-text-muted">{meeting.salesRep.email}</p>
              </div>

              {/* Attendees */}
              {meeting.attendeeCount !== undefined && (
                <div>
                  <h4 className="font-body text-xs text-text-muted uppercase tracking-wider mb-2">Attendees</h4>
                  <p className="font-display text-2xl font-bold text-text-primary">{meeting.attendeeCount}</p>
                </div>
              )}

              {/* Notes */}
              {meeting.notes && (
                <div>
                  <h4 className="font-body text-xs text-text-muted uppercase tracking-wider mb-2">Notes</h4>
                  <p className="font-body text-sm text-text-secondary leading-relaxed bg-elevated/40 rounded-lg px-4 py-3 border border-border-subtle">
                    {meeting.notes}
                  </p>
                </div>
              )}

              {/* HubSpot IDs */}
              {(meeting.hubspotDealId || meeting.hubspotContactId) && (
                <div>
                  <h4 className="font-body text-xs text-text-muted uppercase tracking-wider mb-2">HubSpot</h4>
                  <div className="space-y-1">
                    {meeting.hubspotDealId && (
                      <div className="flex items-center gap-2">
                        <span className="font-body text-xs text-text-muted">Deal:</span>
                        <span className="font-mono text-xs text-gold">{meeting.hubspotDealId}</span>
                      </div>
                    )}
                    {meeting.hubspotContactId && (
                      <div className="flex items-center gap-2">
                        <span className="font-body text-xs text-text-muted">Contact:</span>
                        <span className="font-mono text-xs text-gold">{meeting.hubspotContactId}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => handleAction("confirm")}
                  disabled={actionLoading !== null || meeting.status === "CONFIRMED"}
                  className="flex-1 px-4 py-2.5 bg-sage/15 hover:bg-sage/25 text-sage border border-sage/20 rounded-lg text-sm font-body font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {actionLoading === "confirm" ? "..." : "Confirm"}
                </button>
                <button
                  onClick={() => handleAction("reschedule")}
                  disabled={actionLoading !== null}
                  className="flex-1 px-4 py-2.5 bg-sienna/15 hover:bg-sienna/25 text-sienna border border-sienna/20 rounded-lg text-sm font-body font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {actionLoading === "reschedule" ? "..." : "Reschedule"}
                </button>
                <button
                  onClick={() => handleAction("cancel")}
                  disabled={actionLoading !== null || meeting.status === "CANCELLED"}
                  className="flex-1 px-4 py-2.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20 rounded-lg text-sm font-body font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {actionLoading === "cancel" ? "..." : "Cancel"}
                </button>
              </div>

              {/* Agent Log Timeline */}
              {meeting.agentLog && meeting.agentLog.length > 0 && (
                <div>
                  <h4 className="font-body text-xs text-text-muted uppercase tracking-wider mb-3">
                    Agent Activity
                  </h4>
                  <div className="space-y-0">
                    {meeting.agentLog.map((entry, i) => (
                      <div key={entry.id} className="flex gap-3">
                        {/* Timeline line */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              entry.status === "success"
                                ? "bg-sage"
                                : entry.status === "error"
                                ? "bg-red-500"
                                : "bg-gold"
                            }`}
                          />
                          {i < meeting.agentLog!.length - 1 && (
                            <div className="w-[1px] flex-1 bg-border-subtle min-h-[24px]" />
                          )}
                        </div>
                        <div className="pb-4">
                          <p className="font-body text-sm text-text-primary leading-snug">
                            {entry.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-[10px] text-text-muted">
                              {new Date(entry.timestamp).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              })}
                            </span>
                            <span className="font-body text-[10px] text-lavender bg-lavender/10 px-1.5 py-0.5 rounded">
                              {entry.channel}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
