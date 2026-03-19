"use client";

import { useState, useMemo } from "react";

interface Meeting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: "CONFIRMED" | "RESCHEDULING" | "PENDING" | "CANCELLED" | "COMPLETED";
  room: { name: string; color: string; slug: string };
  contact: { name: string; company: string };
  salesRep: { name: string };
  attendeeCount?: number;
  hubspotDealId?: string;
}

interface MeetingsTableProps {
  meetings: Meeting[];
  onSelectMeeting: (id: string) => void;
}

type SortKey =
  | "startTime"
  | "title"
  | "contact"
  | "company"
  | "room"
  | "status"
  | "salesRep"
  | "attendeeCount";
type SortDir = "asc" | "desc";

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  CONFIRMED: { bg: "bg-sage/15", text: "text-sage" },
  RESCHEDULING: { bg: "bg-sienna/15", text: "text-sienna" },
  PENDING: { bg: "bg-gold/15", text: "text-gold" },
  CANCELLED: { bg: "bg-red-500/15", text: "text-red-400" },
  COMPLETED: { bg: "bg-teal/15", text: "text-teal" },
};

function formatTime(timeStr: string): string {
  const date = new Date(timeStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(timeStr: string): string {
  const date = new Date(timeStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function MeetingsTable({
  meetings,
  onSelectMeeting,
}: MeetingsTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("startTime");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return meetings;
    return meetings.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.contact.name.toLowerCase().includes(q) ||
        m.contact.company.toLowerCase().includes(q)
    );
  }, [meetings, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "startTime":
          cmp =
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
          break;
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "contact":
          cmp = a.contact.name.localeCompare(b.contact.name);
          break;
        case "company":
          cmp = a.contact.company.localeCompare(b.contact.company);
          break;
        case "room":
          cmp = a.room.name.localeCompare(b.room.name);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "salesRep":
          cmp = a.salesRep.name.localeCompare(b.salesRep.name);
          break;
        case "attendeeCount":
          cmp = (a.attendeeCount || 0) - (b.attendeeCount || 0);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const exportCSV = () => {
    const headers = [
      "Time",
      "Title",
      "Contact",
      "Company",
      "Room",
      "Status",
      "Sales Rep",
      "Attendees",
      "HubSpot ID",
    ];
    const rows = sorted.map((m) => [
      `${formatDate(m.startTime)} ${formatTime(m.startTime)}-${formatTime(m.endTime)}`,
      m.title,
      m.contact.name,
      m.contact.company,
      m.room.name,
      m.status,
      m.salesRep.name,
      m.attendeeCount?.toString() || "",
      m.hubspotDealId || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meetings-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ column }: { column: SortKey }) => (
    <span className="ml-1 inline-block text-muted">
      {sortKey === column ? (sortDir === "asc" ? "\u2191" : "\u2193") : "\u2195"}
    </span>
  );

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-elevated/50">
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, company, or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-base border border-border rounded-lg pl-10 pr-4 py-2 text-sm font-body text-primary placeholder:text-muted focus:outline-none focus:border-gold/50 transition-colors"
          />
        </div>
        <span className="font-mono text-xs text-muted">
          {sorted.length} of {meetings.length}
        </span>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/20 rounded-lg text-sm font-body font-medium transition-all duration-200 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M12 5v14m0 0l-4-4m4 4l4-4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 19h16" strokeLinecap="round" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-xs font-body text-secondary uppercase tracking-wider">
              {(
                [
                  ["startTime", "Time"],
                  ["title", "Title"],
                  ["contact", "Contact"],
                  ["company", "Company"],
                  ["room", "Room"],
                  ["status", "Status"],
                  ["salesRep", "Sales Rep"],
                  ["attendeeCount", "Attendees"],
                ] as [SortKey, string][]
              ).map(([key, label]) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className="px-4 py-3 cursor-pointer hover:text-primary transition-colors select-none"
                >
                  {label}
                  <SortIcon column={key} />
                </th>
              ))}
              <th className="px-4 py-3">HubSpot ID</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((meeting) => {
              const badge = STATUS_BADGE[meeting.status] || {
                bg: "bg-gray-500/15",
                text: "text-gray-400",
              };
              return (
                <tr
                  key={meeting.id}
                  onClick={() => onSelectMeeting(meeting.id)}
                  className="border-b border-border-subtle/50 hover:bg-elevated/60 cursor-pointer transition-colors duration-150 group"
                >
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs text-primary">
                      {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                    </div>
                    <div className="font-mono text-[10px] text-muted">
                      {formatDate(meeting.startTime)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-body text-sm text-primary group-hover:text-gold transition-colors">
                      {meeting.title}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-primary">
                    {meeting.contact.name}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-secondary">
                    {meeting.contact.company}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: meeting.room.color }}
                      />
                      <span className="font-body text-sm text-primary">
                        {meeting.room.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-body font-medium ${badge.bg} ${badge.text}`}
                    >
                      {meeting.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-secondary">
                    {meeting.salesRep.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-secondary text-center">
                    {meeting.attendeeCount || "\u2014"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {meeting.hubspotDealId || "\u2014"}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <p className="font-body text-sm text-muted">
                    No meetings found
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
