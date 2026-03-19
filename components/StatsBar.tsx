"use client";

interface StatsBarProps {
  stats: {
    total: number;
    confirmed: number;
    rescheduling: number;
    pending: number;
    roomsActive: number;
    repsActive: number;
  };
}

const STAT_CARDS = [
  { key: "total" as const, label: "Total Meetings", color: "text-text-primary", accent: "border-border" },
  { key: "confirmed" as const, label: "Confirmed", color: "text-sage", accent: "border-sage/30" },
  { key: "rescheduling" as const, label: "Rescheduling", color: "text-sienna", accent: "border-sienna/30" },
  { key: "pending" as const, label: "Pending", color: "text-gold", accent: "border-gold/30" },
  { key: "roomsActive" as const, label: "Rooms Active", color: "text-teal", accent: "border-teal/30" },
  { key: "repsActive" as const, label: "Reps Active", color: "text-lavender", accent: "border-lavender/30" },
];

export default function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-6 gap-3">
      {STAT_CARDS.map((card) => (
        <div
          key={card.key}
          className={`bg-surface border ${card.accent} rounded-xl px-4 py-3 text-center transition-all duration-200 hover:bg-elevated/60`}
        >
          <div className={`font-display text-3xl font-bold ${card.color} leading-none`}>
            {stats[card.key]}
          </div>
          <div className="font-body text-[10px] text-text-muted uppercase tracking-wider mt-1.5">
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}
