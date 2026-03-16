/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#080808',
          surface: '#0f0f0f',
          border: '#1a1a1a',
          green: '#00ff88',
          amber: '#ffb800',
          red: '#ff4444',
          blue: '#4488ff',
          muted: '#444444',
          dim: '#888888',
          text: '#e0e0e0',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        'tick-up': 'tickUp 0.3s ease-out',
        'tick-down': 'tickDown 0.3s ease-out',
        'blink': 'blink 1s step-end infinite',
        'scanline': 'scanline 8s linear infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-green': 'pulseGreen 2s ease-in-out infinite',
      },
      keyframes: {
        tickUp: {
          '0%': { color: '#00ff88', transform: 'translateY(2px)' },
          '100%': { color: 'inherit', transform: 'translateY(0)' },
        },
        tickDown: {
          '0%': { color: '#ff4444', transform: 'translateY(-2px)' },
          '100%': { color: 'inherit', transform: 'translateY(0)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGreen: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0,255,136,0)' },
          '50%': { boxShadow: '0 0 12px 2px rgba(0,255,136,0.15)' },
        },
      },
    },
  },
  plugins: [],
}
