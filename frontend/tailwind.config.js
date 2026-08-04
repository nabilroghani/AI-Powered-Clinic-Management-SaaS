/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        clinic: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          900: "#134e4a"
        },
        slateBlue: "#0f172a"
      },
      boxShadow: {
        soft: "0 20px 45px -28px rgba(15, 23, 42, 0.35)"
      }
    }
  },
  plugins: []
};
