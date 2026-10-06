import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        eundal: {
          50: "#faf8f5",
          100: "#f4f0e8",
          200: "#e8dfce",
          300: "#d9c7ad",
          400: "#c7ab88",
          500: "#b59168",
          600: "#9f7851",
          700: "#7e5c3e",
          800: "#5c432d",
          900: "#3d2c1e",
          950: "#22170f",
        },
        night: {
          800: "#1e1e24",
          900: "#131316",
          950: "#0c0c0e",
        },
      },
    },
  },
  plugins: [],
};
export default config;
