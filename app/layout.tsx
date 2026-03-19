import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Concierge',
  description: 'Intelligent conference scheduling and room management for luxury events',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className="min-h-screen antialiased"
        style={{
          backgroundColor: 'var(--bg-base)',
          color: 'var(--text-primary)',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
