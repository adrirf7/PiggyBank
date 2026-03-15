/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#F97316",
        "primary-dark": "#EA6C0A",
        income: "#22C55E",
        "income-dark": "#16A34A",
        expense: "#EF4444",
        "expense-dark": "#DC2626",
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#1E293B",
        },
      },
    },
  },
  plugins: [],
};
