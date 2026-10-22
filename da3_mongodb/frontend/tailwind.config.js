/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0FDF9',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0F766E', // Primary accent: Deep teal #0F766E
          700: '#115E59', // Primary hover: #115E59
          800: '#134E4A',
          900: '#042F2E',
          950: '#021F1E',
        },
        sage: {
          50: '#F4F7F5',
          100: '#E4EBE7',
          200: '#C8D6CF',
          300: '#A7BDB3',
          400: '#87A598',
          500: '#6B9080', // Secondary accent: Muted sage #6B9080
          600: '#557467',
          700: '#40574D',
          800: '#2C3C35',
          900: '#1B2521',
        },
        graphite: {
          50: '#F5F7F6',  // Main background #F5F7F6
          100: '#EAEFEc',
          200: '#DCE4E1', // Border #DCE4E1
          300: '#B8C5C0',
          400: '#8A9BA8',
          500: '#52616B', // Secondary text #52616B
          600: '#3D4951',
          700: '#2C363D',
          800: '#1F2830',
          900: '#17212B', // Sidebar background & Primary text #17212B
          950: '#0E141B',
        },
        app: {
          bg: '#F5F7F6',
          card: '#FFFFFF',
          sidebar: '#17212B',
          text: '#17212B',
          muted: '#52616B',
          border: '#DCE4E1',
          success: '#15803D',
          warning: '#B45309',
          error: '#B91C1C',
          teal: '#0F766E',
          tealHover: '#115E59',
          sage: '#6B9080',
        }
      }
    },
  },
  plugins: [],
}
