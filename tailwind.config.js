/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#f8f9fa',
        ink: '#1a1a2e',
        muted: '#6b7280',
        line: '#e5e7eb',
        signal: '#2563eb',
        signalDark: '#1d4ed8',
        rust: '#dc2626',
        gold: '#f59e0b',
      },
      borderRadius: {
        card: '16px',
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
        body: ['system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}