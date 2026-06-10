/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E24B4A',
          50:  '#FCEBEB',
          100: '#F9D6D6',
          200: '#F3ADAD',
          300: '#ED8585',
          400: '#E75C5C',
          500: '#E24B4A',
          600: '#C93837',
          700: '#A32D2C',
          800: '#7C2221',
          900: '#561716',
        },
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      keyframes: {
        'promo-marquee': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'promo-pulse-soft': {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'promo-marquee': 'promo-marquee 42s linear infinite',
        'promo-pulse-soft': 'promo-pulse-soft 2.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
