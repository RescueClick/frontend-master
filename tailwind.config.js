/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        fontFamily: {
          hindiHeading: ['Mukta', 'sans-serif'],
          hindiBody: ['"Noto Serif Devanagari"', 'serif'],
        },
      },
    },
    plugins: [],
  };
  