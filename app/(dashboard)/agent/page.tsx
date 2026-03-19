'use client';

import { useState, useEffect, useCallback } from 'react';
import AgentLog from '@/components/AgentLog';

interface AgentLogEntry {
  id: string;
  timestamp: string;
  type: "email" | "sms" | "hubspot" | "reschedule" | "system" | "reminder" | "followup";
  message: string;
  channel: "Gmail" | "Twilio" | "HubSpot" | "System";
  status: "success" | "pending" | "error";
  meetingId?: string;
}

const triggerActions = [
  {
    id: 'reminder',
    label: 'Send Reminders',
    description: 'Send reminders for meetings in the next hour',
    type: 'REMINDER',
    scope: 'next_hour',
    color: 'var(--teal)',
  },
  {
    id: 'followup',
    label: 'Follow-up Pending',
    description: 'Follow up on all pending meeting requests',
    type: 'FOLLOWUP',
    scope: 'all',
    color: 'var(--sage)',
  },
  {
    id: 'sync',
    label: 'Sync HubSpot',
    description: 'Synchronize all meeting data with HubSpot CRM',
    type: 'HUBSPOT_SYNC',
    scope: 'all',
    color: 'var(--sienna)',
  },
];

function mapLogType(type: string): AgentLogEntry['type'] {
  const map: Record<string, AgentLogEntry['type']> = {
    EMAIL: 'email',
    SMS: 'sms',
    HUBSPOT_SYNC: 'hubspot',
    RESCHEDULE: 'reschedule',
    FOLLOWUP: 'followup',
    REMINDER: 'reminder',
  };
  return map[type] || 'system';
}

function mapChannel(channel: string): AgentLogEntry['channel'] {
  if (channel === 'Gmail') return 'Gmail';
  if (channel === 'Twilio') return 'Twilio';
  if (channel === 'HubSpot') return 'HubSpot';
  return 'System';
}

function mapStatus(status: string): AgentLogEntry['status'] {
  if (status === 'SENT' || status === 'DELIVERED') return 'success';
  if (status === 'FAILED') return 'error';
  return 'pending';
}

export default function AgentPage() {
  const [logs, setLogs] = useState<AgentLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggeringAction, setTriggeringAction] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ id: string; message: string; success: boolean } | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/meetings');
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      const meetings = Array.isArray(data) ? data : data.meetings || [];

      // Extract agent logs from meetings
      const extracted: AgentLogEntry[] = [];
      for (const m of meetings) {
        if (m.agentLogs) {
          for (const log of m.agentLogs) {
            extracted.push({
              id: log.id,
              timestamp: log.createdAt,
              type: mapLogType(log.type),
              message: log.message,
              channel: mapChannel(log.channel),
              status: mapStatus(log.status),
              meetingId: log.meetingId,
            });
          }
        }
        // Also generate synthetic entries for meetings without logs
        if (!m.agentLogs?.length) {
          extracted.push({
            id: `${m.id}-status`,
            timestamp: m.createdAt || m.startTime,
            type: m.status === 'RESCHEDULING' ? 'reschedule' : 'system',
            message: `Meeting "${m.title}" — ${m.status.toLowerCase()} with ${m.contact?.name || 'Unknown'}`,
            channel: 'System',
            status: m.status === 'CONFIRMED' ? 'success' : m.status === 'CANCELLED' ? 'error' : 'pending',
            meetingId: m.id,
          });
        }
      }

      extracted.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLogs(extracted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleTrigger = async (action: typeof triggerActions[0]) => {
    try {
      setTriggeringAction(action.id);
      setActionResult(null);
      const res = await fetch('/api/agent/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: action.type, scope: action.scope }),
      });
      const data = await res.json();
      setActionResult({
        id: action.id,
        message: res.ok
          ? `${action.label}: ${data.processed ?? 0} item(s) processed`
          : data.error || 'Action failed',
        success: res.ok,
      });
      if (res.ok) fetchLogs();
    } catch {
      setActionResult({ id: action.id, message: 'Failed to trigger action', success: false });
    } finally {
      setTriggeringAction(null);
      setTimeout(() => setActionResult(null), 6000);
    }
  };

  const handleAgentTrigger = (type: string) => {
    const action = triggerActions.find((a) => a.type === type);
    if (action) handleTrigger(action);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--gold)' }}
          />
          <p style={{ color: 'var(--text-muted)' }}>Loading agent activity...</p>
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
          <p className="text-lg mb-2" style={{ color: 'var(--sienna)' }}>Unable to load agent data</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{error}</p>
          <button
            onClick={fetchLogs}
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
      <div>
        <h1
          className="text-2xl font-light tracking-wide"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--text-primary)' }}
        >
          Agent Activity
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Jordan&apos;s automated scheduling actions and communications
        </p>
      </div>

      {actionResult && (
        <div
          className="px-4 py-3 rounded-lg text-sm animate-slide-in-top flex items-center gap-2"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: `1px solid ${actionResult.success ? 'var(--sage)' : 'var(--sienna)'}`,
            color: actionResult.success ? 'var(--sage)' : 'var(--sienna)',
          }}
        >
          <span>{actionResult.success ? '\u2713' : '\u2717'}</span>
          {actionResult.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {triggerActions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleTrigger(action)}
            disabled={triggeringAction !== null}
            className="p-4 rounded-xl border text-left transition-all duration-200 hover:brightness-110 disabled:opacity-50"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <span className="text-sm font-medium" style={{ color: action.color }}>
              {triggeringAction === action.id ? 'Processing...' : action.label}
            </span>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {action.description}
            </p>
          </button>
        ))}
      </div>

      <AgentLog logs={logs} onTriggerAction={handleAgentTrigger} />
    </div>
  );
}
