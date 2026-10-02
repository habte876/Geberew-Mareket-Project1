/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        soil: {
          950: "#0b1a12",
          900: "#12241a",
          800: "#1b3326",
          700: "#274536",
        },
        gold: {
          400: "#e6c35c",
          500: "#d4a017",
          600: "#b8860b",
        },
        cream: "#f6efe2",
        leaf: "#3d8b5f",
      },
      fontFamily: {
        display: ['"Fraunces"', "serif"],
        sans: ['"Outfit"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 20px 60px rgba(212, 160, 23, 0.12)",
      },
    },
  },
  plugins: [],
};
