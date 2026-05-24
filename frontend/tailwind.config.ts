import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
    './services/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg-deep)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          raised: 'var(--bg-raised)',
          muted: 'var(--bg-muted)',
          hover: 'var(--bg-hover)',
        },
        foreground: {
          DEFAULT: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          faint: 'var(--text-faint)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          soft: 'var(--accent-soft)',
          muted: 'var(--accent-muted)',
          contrast: 'var(--accent-contrast)',
        },
        border: {
          DEFAULT: 'var(--border-default)',
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        },
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(0, 0, 0, 0.25)',
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        header: 'var(--shadow-header)',
        'accent-ring': '0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent)',
      },
      spacing: {
        sidebar: '15rem',
      },
      maxWidth: {
        content: '72rem',
        'content-wide': '80rem',
        'content-narrow': '42rem',
      },
      transitionDuration: {
        ui: '200ms',
      },
    },
  },
  plugins: [],
};

export default config;
