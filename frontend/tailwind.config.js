module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    "./src/**/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        mempa: {
          orange: '#e8c46c',
          'orange-hover': '#f0d080',
          black: '#1a1410',
          dark: '#2a1f15',
          darker: '#3d2d1e',
          darkest: '#241a10',
          cream: '#f5e6d3',
          'cream-dim': '#a89078',
          'cream-dimmer': '#7a6050',
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
