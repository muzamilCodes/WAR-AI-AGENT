/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          glow: '#00f2fe'
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
          glow: '#05ffa1'
        },
        cyber: {
          dark: '#07090e',
          card: '#0d131f',
          border: '#1e293b',
          neon: '#00f0ff'
        }
      },
      fontFamily: {
        orbitron: ['var(--font-orbitron)', 'sans-serif'],
        outfit: ['var(--font-outfit)', 'sans-serif'],
        inter: ['var(--font-inter)', 'sans-serif']
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 15px rgba(0, 242, 254, 0.6))' },
          '50%': { opacity: '0.6', filter: 'drop-shadow(0 0 5px rgba(0, 242, 254, 0.2))' }
        }
      }
    },
  },
  plugins: [],
};
