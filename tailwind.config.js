/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        'spin-once': {
          '0%': { transform: 'rotateY(0deg) scale(0.5)', opacity: '0' },
          '60%': { transform: 'rotateY(720deg) scale(1.15)', opacity: '1' },
          '100%': { transform: 'rotateY(720deg) scale(1)', opacity: '1' },
        }
      },
      animation: {
        'spin-once': 'spin-once 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      }
    },
  },
  plugins: [],
}
