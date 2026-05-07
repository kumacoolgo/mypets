import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        berry: "#f46a8b",
        mint: "#53c7a3",
        honey: "#f6bd60",
        ink: "#293241"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(41, 50, 65, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
