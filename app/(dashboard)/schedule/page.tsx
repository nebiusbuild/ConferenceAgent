'use client';

import { useState, useCallback } from 'react';
import PersonSchedule from '@/components/PersonSchedule';

interface Contact {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
}

export default function SchedulePage() {
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    try {
      setSearching(true);
      setError(null);
      setSearched(true);
      setSelectedContact(null);

      const res = await fetch('/api/meetings');
      if (!res.ok) throw new Error('Failed to search');
      const data = await res.json();
      const meetings = Array.isArray(data) ? data : data.meetings || [];

      const contactMap: Record<string, Contact> = {};
      const lowerQuery = query.toLowerCase();

      meetings.forEach((m: { contact?: { id?: string; name?: string; email?: string; company?: string } }) => {
        if (m.contact) {
          const matchesName = m.contact.name?.toLowerCase().includes(lowerQuery);
          const matchesEmail = m.contact.email?.toLowerCase().includes(lowerQuery);
          const matchesCompany = m.contact.company?.toLowerCase().includes(lowerQuery);

          if (matchesName || matchesEmail || matchesCompany) {
            const key = m.contact.id || m.contact.email || m.contact.name || '';
            if (!contactMap[key]) {
              contactMap[key] = {
                id: key,
                name: m.contact.name || 'Unknown',
                email: m.contact.email || '',
                company: m.contact.company,
              };
            }
          }
        }
      });

      setContacts(Object.values(contactMap));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-light tracking-wide"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--text-primary)' }}
        >
          Schedule Lookup
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Find a contact&apos;s meeting schedule by name, email, or company
        </p>
      </div>

      {/* Search */}
      <div
        className="rounded-xl border p-5"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <span
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: 'var(--text-ghost)' }}
            >
              &#8981;
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by name, email, or company..."
              className="w-full pl-10 pr-4 py-3 rounded-lg text-sm outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            className="px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:brightness-110 disabled:opacity-50"
            style={{ backgroundColor: 'var(--gold)', color: 'var(--bg-base)' }}
          >
            {searching ? (
              <span
                className="inline-block w-4 h-4 border-2 rounded-full animate-spin"
                style={{ borderColor: 'var(--bg-base)', borderTopColor: 'transparent' }}
              />
            ) : (
              'Search'
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="px-4 py-3 rounded-lg text-sm animate-fade-in"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--sienna)',
            color: 'var(--sienna)',
          }}
        >
          {error}
        </div>
      )}

      {/* Search Results */}
      {searched && !selectedContact && (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div
            className="px-5 py-4 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <h2 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              {contacts.length > 0
                ? `${contacts.length} contact${contacts.length !== 1 ? 's' : ''} found`
                : 'No contacts found'
              }
            </h2>
          </div>

          {contacts.length > 0 ? (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left transition-colors"
                  style={{ backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                      style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--gold)' }}
                    >
                      {contact.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {contact.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {contact.email}
                        {contact.company && ` \u00B7 ${contact.company}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-ghost)' }}>
                    View schedule &#8250;
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
                No contacts match &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs" style={{ color: 'var(--text-ghost)' }}>
                Try a different name, email address, or company
              </p>
            </div>
          )}
        </div>
      )}

      {/* Person Schedule */}
      {selectedContact && (
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setSelectedContact(null)}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              &#8249; Back to results
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {selectedContact.name}
              </span>
              {selectedContact.company && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {selectedContact.company}
                </span>
              )}
            </div>
          </div>

          <div
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <PersonSchedule contactId={selectedContact.id} contactName={selectedContact.name} contactCompany={selectedContact.company || ''} />
          </div>
        </div>
      )}

      {/* Empty state - before search */}
      {!searched && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <span className="text-2xl" style={{ color: 'var(--text-ghost)' }}>&#9202;</span>
            </div>
            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              Search for a contact to view their schedule
            </p>
            <p className="text-xs" style={{ color: 'var(--text-ghost)' }}>
              Enter a name, email, or company name above
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
