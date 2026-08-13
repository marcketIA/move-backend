/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{html,js}'
  ],
  theme: {
    extend: {
      colors: {
        gold: '#D4A94F',
        goldBright: '#E8C878',
        long: '#22B57B',
        short: '#E24C5B',
        amber: '#E8934A',
        bgVoid: '#05070B',
        bgPrimary: '#0A0E14',
        bgElevated: '#151C27'
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif']
      }
    }
  },
  plugins: []
};
