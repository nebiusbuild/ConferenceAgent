import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(' ')
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: process.env.CONFERENCE_TIMEZONE || 'America/New_York',
  }).format(date)
}

export function getConferenceTimezone(): string {
  return process.env.CONFERENCE_TIMEZONE || 'America/New_York'
}

export const ROOM_COLORS: Record<string, string> = {
  'the-boardroom': '#7c9fa6',
  'summit-suite': '#8b7ec8',
  'horizon-room': '#6aaa8a',
  'catalyst-room': '#c9a84c',
  'spark-room': '#c67a5a',
  'booth-suite': '#d4a5a5',
}

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  CONFIRMED: { bg: 'bg-sage/20', text: 'text-sage' },
  RESCHEDULING: { bg: 'bg-sienna/20', text: 'text-sienna' },
  PENDING: { bg: 'bg-gold/20', text: 'text-gold' },
  CANCELLED: { bg: 'bg-red-500/20', text: 'text-red-400' },
  COMPLETED: { bg: 'bg-teal/20', text: 'text-teal' },
}
