"use client";

import { useState, useMemo } from "react";

interface AgentLogEntry {
  id: string;
  timestamp: string;
  type: "email" | "sms" | "hubspot" | "reschedule" | "system" | "reminder" | "followup";
  message: string;
  channel: "Gmail" | "Twilio" | "HubSpot" | "System";
  status: "success" | "pending" | "error";
  meetingId?: string;
}

interface AgentLogProps {
  logs: AgentLogEntry[];
  onTriggerAction: (type: string) => void;
}

const TABS = ["All", "Email", "SMS", "HubSpot", "Reschedules"] as const;
type Tab = (typeof TABS)[number];

const TAB_FILTER: Record<Tab, string[]> = {
  All: [],
  Email: ["email", "reminder", "followup"],
  SMS: ["sms"],
  HubSpot: ["hubspot"],
  Reschedules: ["reschedule"],
};

const CHANNEL_BADGE: Record<string, { bg: string; text: string }> = {
  Gmail: { bg: "bg-sienna/15", text: "text-sienna" },
  Twilio: { bg: "bg-teal/15", text: "text-teal" },
  HubSpot: { bg: "bg-gold/15", text: "text-gold" },
  System: { bg: "bg-lavender/15", text: "text-lavender" },
};

const STATUS_DOT: Record<string, string> = {
  success: "bg-sage",
  pending: "bg-gold",
  error: "bg-red-500",
};

const TYPE_ICONS: Record<string, JSX.Element> = {
  email: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  ),
  sms: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
    </svg>
  ),
  hubspot: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
  ),
  reschedule: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
    </svg>
  ),
  system: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  ),
  reminder: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  ),
  followup: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
  ),
};

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

export default function AgentLog({ logs, onTriggerAction }: AgentLogProps) {
  const [activeTab, setActiveTab] = useState<Tab>("All");

  const filteredLogs = useMemo(() => {
    const types = TAB_FILTER[activeTab];
    if (types.length === 0) return logs;
    return logs.filter((l) => types.includes(l.type));
  }, [logs, activeTab]);

  const counters = useMemo(() => {
    const reminders = logs.filter((l) => l.type === "reminder" && l.status === "success").length;
    const reschedules = logs.filter((l) => l.type === "reschedule").length;
    const followups = logs.filter((l) => l.type === "followup" && l.status === "success").length;
    const hubspotSyncs = logs.filter((l) => l.type === "hubspot" && l.status === "success").length;
    return { reminders, reschedules, followups, hubspotSyncs };
  }, [logs]);

  const counterCards = [
    { label: "Reminders Sent", value: counters.reminders, color: "text-teal" },
    { label: "Reschedules Handled", value: counters.reschedules, color: "text-sienna" },
    { label: "Follow-ups Sent", value: counters.followups, color: "text-sage" },
    { label: "HubSpot Syncs", value: counters.hubspotSyncs, color: "text-gold" },
  ];

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Jordan Persona Card */}
      <div className="px-5 py-4 border-b border-border bg-elevated/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-lavender/20 border border-lavender/30 flex items-center justify-center">
            <span className="font-display text-lg font-bold text-lavender">J</span>
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-text-primary">Jordan</h3>
            <p className="font-body text-xs text-text-secondary">Conference Concierge Agent</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-sage animate-pulse" />
            <span className="font-body text-xs text-sage">Active</span>
          </div>
        </div>
      </div>

      {/* Counter Cards */}
      <div className="grid grid-cols-4 gap-3 px-5 py-4 border-b border-border">
        {counterCards.map((c) => (
          <div
            key={c.label}
            className="bg-elevated/60 border border-border-subtle rounded-lg px-3 py-2.5 text-center"
          >
            <div className={`font-display text-2xl font-bold ${c.color}`}>{c.value}</div>
            <div className="font-body text-[10px] text-text-muted uppercase tracking-wider mt-0.5">
              {c.label}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
        <button
          onClick={() => onTriggerAction("send_reminders")}
          className="flex items-center gap-2 px-4 py-2 bg-teal/10 hover:bg-teal/20 text-teal border border-teal/20 rounded-lg text-xs font-body font-medium transition-all duration-200 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
          Send reminders for next hour
        </button>
        <button
          onClick={() => onTriggerAction("sync_hubspot")}
          className="flex items-center gap-2 px-4 py-2 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/20 rounded-lg text-xs font-body font-medium transition-all duration-200 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
          </svg>
          Sync all to HubSpot
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-border px-5">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 font-body text-sm transition-all duration-200 border-b-2 -mb-[1px] cursor-pointer ${
              activeTab === tab
                ? "text-gold border-gold"
                : "text-text-muted border-transparent hover:text-text-secondary"
            }`}
          >
            {tab}
          </button>
        ))}
        <span className="ml-auto font-mono text-xs text-text-muted">{filteredLogs.length} entries</span>
      </div>

      {/* Log Feed */}
      <div className="max-h-[480px] overflow-y-auto divide-y divide-border-subtle/50">
        {filteredLogs.length === 0 && (
          <div className="px-5 py-12 text-center">
            <p className="font-body text-sm text-text-muted">No log entries</p>
          </div>
        )}
        {filteredLogs.map((log) => {
          const channelBadge = CHANNEL_BADGE[log.channel] || CHANNEL_BADGE.System;
          const icon = TYPE_ICONS[log.type] || TYPE_ICONS.system;
          const statusDot = STATUS_DOT[log.status] || "bg-gray-500";

          return (
            <div
              key={log.id}
              className="flex items-start gap-3 px-5 py-3 hover:bg-elevated/40 transition-colors duration-150"
            >
              <div className="text-text-muted mt-0.5 shrink-0">{icon}</div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm text-text-primary leading-snug">{log.message}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="font-mono text-[10px] text-text-muted">
                    {formatTimestamp(log.timestamp)}
                  </span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-body font-medium ${channelBadge.bg} ${channelBadge.text}`}
                  >
                    {log.channel}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                    <span className="font-body text-[10px] text-text-muted capitalize">
                      {log.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
