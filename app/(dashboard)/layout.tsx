'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Timeline', icon: '◈' },
  { href: '/meetings', label: 'Meetings', icon: '◎' },
  { href: '/sessions', label: 'Sessions', icon: '▦' },
  { href: '/events', label: 'Events', icon: '◇' },
  { href: '/schedule', label: 'Schedule', icon: '◫' },
  { href: '/agent', label: 'Agent', icon: '⟡' },
  { href: '/analytics', label: 'Analytics', icon: '△' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className="flex flex-col w-[240px] shrink-0 border-r"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <h1
            className="text-2xl font-light tracking-wide"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: 'var(--gold)',
            }}
          >
            Concierge
          </h1>
          <p
            className="text-xs mt-1 tracking-widest uppercase"
            style={{ color: 'var(--text-muted)' }}
          >
            Conference Suite
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200"
                style={{
                  backgroundColor: isActive ? 'var(--bg-elevated)' : 'transparent',
                  color: isActive ? 'var(--gold)' : 'var(--text-secondary)',
                  borderLeft: isActive ? '2px solid var(--gold)' : '2px solid transparent',
                }}
              >
                <span className="text-base" style={{ opacity: isActive ? 1 : 0.6 }}>
                  {item.icon}
                </span>
                <span
                  className="font-medium"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t text-xs"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text-ghost)',
          }}
        >
          <p style={{ fontFamily: "'DM Mono', monospace" }}>v1.0.0</p>
        </div>
      </aside>

      {/* Main content */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ backgroundColor: 'var(--bg-base)' }}
      >
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
