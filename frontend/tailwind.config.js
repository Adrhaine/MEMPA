module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    "./src/**/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        mempa: {
          green: '#1DB954',
          'green-hover': '#1ed760',
          black: '#121212',
          dark: '#181818',
          darker: '#282828',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms')
  ],
}
