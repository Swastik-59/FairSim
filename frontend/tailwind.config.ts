import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0f',
        surface: '#12121a',
        border: '#1e1e2e',
        primary: '#6366f1',
        accent: '#22d3ee',
        text: '#e2e8f0',
        muted: '#64748b',
      },
      backgroundImage: {
        'gradient-main': 'linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)',
      },
    },
  },
  plugins: [],
}

export default config
