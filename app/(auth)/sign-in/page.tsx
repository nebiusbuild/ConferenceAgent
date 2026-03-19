export default function SignInPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      <div className="w-full max-w-md px-4">
        {/* Card */}
        <div
          className="rounded-2xl border p-10 text-center"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          {/* Logo */}
          <div className="mb-8">
            <h1
              className="text-4xl font-light tracking-wide mb-2"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--gold)' }}
            >
              Concierge
            </h1>
            <p
              className="text-xs tracking-[0.3em] uppercase"
              style={{ color: 'var(--text-muted)' }}
            >
              Conference Suite
            </p>
          </div>

          {/* Decorative divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
            <span style={{ color: 'var(--gold)', fontSize: '10px' }}>&#9670;</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
          </div>

          {/* Auth placeholder */}
          <div
            className="rounded-xl p-6 mb-6"
            style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
          >
            <div className="mb-4">
              <div
                className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              >
                <span className="text-lg" style={{ color: 'var(--gold)' }}>&#9919;</span>
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Authentication Required
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                This application uses Clerk for secure authentication.
                Configure your Clerk keys in the environment to enable sign-in.
              </p>
            </div>

            {/* Placeholder button */}
            <button
              disabled
              className="w-full py-3 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-40"
              style={{
                backgroundColor: 'var(--gold)',
                color: 'var(--bg-base)',
              }}
            >
              Sign In
            </button>
          </div>

          {/* Setup instructions */}
          <div className="text-left space-y-2">
            <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Setup instructions:
            </p>
            <div
              className="rounded-lg p-3 text-xs leading-relaxed"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                fontFamily: "'DM Mono', monospace",
              }}
            >
              <p>1. Create a Clerk app at clerk.com</p>
              <p>2. Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</p>
              <p>3. Add CLERK_SECRET_KEY</p>
              <p>4. Wrap layout with ClerkProvider</p>
            </div>
          </div>

          {/* Footer */}
          <p
            className="mt-8 text-[10px] tracking-wider uppercase"
            style={{ color: 'var(--text-ghost)' }}
          >
            Secure &middot; Private &middot; Encrypted
          </p>
        </div>
      </div>
    </div>
  );
}
