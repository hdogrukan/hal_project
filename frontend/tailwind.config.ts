import type { Config } from "tailwindcss";
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme:{ extend:{ colors:{ primary:"#15803d"} } },

  plugins: [require("tailwindcss-animate")]
  
} satisfies Config;