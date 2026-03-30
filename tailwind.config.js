/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#ec5b13",
          light: "#ff8a50",
          dark: "#b34400",
        },
        "accent-blue": {
          DEFAULT: "#2563eb",
          light: "#3b82f6",
        },
        "brand-navy": "#0a192f",
        "background-light": "#f8f6f6",
        "background-dark": "#221610",
      },
      fontFamily: {
        display: ["Public Sans", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
      boxShadow: {
        ambient: "0 20px 40px rgba(25, 28, 29, 0.06)",
        "card-hover": "0 10px 30px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"),
  ],
};
