/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#5DA8FF",
        "primary-dark": "#3A8EEF",
        income: "#22C55E",
        "income-dark": "#16A34A",
        expense: "#EF4444",
        "expense-dark": "#DC2626",
        surface: {
          DEFAULT: "#111111",
          dark: "#111111",
        },
      },
    },
  },
  plugins: [],
};
