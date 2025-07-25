import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          dark: "#2B1719",
          forest: "#02483E",
          green: "#057C46",
          lime: "#9BB61B",
          yellow: "#F8BE00",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        pantaneiro: {
          green: "#02483E",
          lime: "#9BB61B",
          "lime-hover": "#8ba219",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      backgroundImage: {
        "wave-gradient": `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 800'%3e%3cg fill-opacity='0.15' fill='%2302483E'%3e%3cpath d='M-200 0h2000v800H-200z'/%3e%3cpath d='M-200 0h2000v800H-200z' fill-opacity='1' fill='%23F9FAFB'/%3e%3cpath d='M140.7 562.3c103.3-22.3 211.3-34.3 322.3-34.3 113.3 0 228.3 12.3 346.3 37.3s241.3 53.3 368.3 82.3c127.3 29.3 258.3 58.3 392.3 88.3v284H-200V562.3z'/%3e%3cpath d='M-200 800V538.3c134-30 265-59 392.3-88.3 127-29 250-57.3 368.3-82.3s228-25 346.3-37.3c111-12 219-24 322.3-34.3L1800 286V0H-200v800z'/%3e%3c/g%3e%3c/svg%3e")`,
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
