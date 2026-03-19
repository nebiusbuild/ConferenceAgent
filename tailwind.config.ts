import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        base: '#0b0f1a',
        surface: '#0e1220',
        elevated: '#13172a',
        border: '#1e2433',
        'border-subtle': '#1a1f2e',
        gold: '#c9a84c',
        teal: '#7c9fa6',
        sage: '#6aaa8a',
        sienna: '#c67a5a',
        lavender: '#8b7ec8',
        blush: '#d4a5a5',
        'text-primary': '#e8e4dc',
        'text-secondary': '#9ca3af',
        'text-muted': '#6b7280',
        'text-faint': '#4b5563',
        'text-ghost': '#3d4455',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
