module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        // Warm academic palette
        primary: {
          50: '#faf7f2',
          100: '#f5f0e8',
          200: '#e8e0d4',
          300: '#d4c5a9',
          400: '#c4b08a',
          500: '#a09585',
          600: '#8b7e6a',
          700: '#6b6358',
          800: '#2d3436',
          900: '#1e2425',
        },
        accent: {
          50: '#fdf8f0',
          100: '#f8edd8',
          200: '#f0d9b0',
          300: '#d4c5a9',
          400: '#c4a96e',
          500: '#b5944f',
          600: '#9a7b3e',
          700: '#7a6232',
          800: '#5e4c28',
          900: '#453820',
        },
        surface: {
          50: '#faf7f2',
          100: '#f5f0e8',
          200: '#e8e0d4',
          300: '#d4cab8',
          400: '#a09585',
          500: '#8b7e6a',
          600: '#6b6358',
          700: '#524a40',
          800: '#2d3436',
          900: '#1e2425',
        },
        success: '#4a7c59',
        warning: '#c17f3e',
        error: '#b54a4a',
        info: '#4a7c59',
      },
      fontFamily: {
        display: ['Lora', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      spacing: {
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '6': '1.5rem',
        '8': '2rem',
        '12': '3rem',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(45, 52, 54, 0.06), 0 1px 2px rgba(45, 52, 54, 0.04)',
        'card-hover': '0 10px 25px rgba(45, 52, 54, 0.08), 0 4px 10px rgba(45, 52, 54, 0.05)',
        'elevated': '0 20px 40px rgba(45, 52, 54, 0.1), 0 8px 16px rgba(45, 52, 54, 0.06)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
