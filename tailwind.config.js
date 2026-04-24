/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // Maison Sévère — braise dark theme
        bg: {
          0: "#100d0a",
          1: "#161310",
          2: "#1d1915",
          3: "#272118",
        },
        line: {
          DEFAULT: "#2a241c",
          2: "#372e22",
        },
        ink: {
          1: "#f4ece0",
          2: "#c9bfae",
          3: "#8f8474",
          4: "#5a5244",
        },
        ember: {
          DEFAULT: "#e8733a",
          soft: "#f2a878",
          deep: "#b84f1b",
        },
        amber: { DEFAULT: "#e8b04a" },
        terracotta: "#c9523e",
        olive: "#9aaa5e",
        cream: "#f1e4c8",
        info: "#88a8b8",
        // semantic aliases
        ok: "#9aaa5e",
        warn: "#e8b04a",
        danger: "#c9523e",

        // shadcn tokens
        border: "#2a241c",
        input: "#372e22",
        ring: "#e8733a",
        background: "#100d0a",
        foreground: "#f4ece0",
        primary: {
          DEFAULT: "#e8733a",
          foreground: "#1b0d04",
        },
        secondary: {
          DEFAULT: "#1d1915",
          foreground: "#f4ece0",
        },
        destructive: {
          DEFAULT: "#c9523e",
          foreground: "#f4ece0",
        },
        muted: {
          DEFAULT: "#1d1915",
          foreground: "#8f8474",
        },
        accent: {
          DEFAULT: "#272118",
          foreground: "#f2a878",
        },
        card: {
          DEFAULT: "#161310",
          foreground: "#f4ece0",
        },
        popover: {
          DEFAULT: "#161310",
          foreground: "#f4ece0",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Fraunces", "serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        lg: "14px",
        md: "10px",
        sm: "8px",
      },
      keyframes: {
        pulse: {
          "0%": { boxShadow: "0 0 0 0 rgba(154,170,94,0.6)" },
          "70%": { boxShadow: "0 0 0 8px rgba(154,170,94,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(154,170,94,0)" },
        },
        "pulse-a": {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        "pulse-ring": "pulse 2s infinite",
        "pulse-a": "pulse-a 1.5s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
