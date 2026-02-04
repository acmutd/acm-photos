import type { Config } from "tailwindcss";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    "bg-acm-gradient",
    "bg-media-gradient",
    "bg-research-gradient",
    "bg-education-gradient",
    "bg-projects-gradient",
    "bg-development-gradient",
    "bg-community-gradient",
    "bg-hackutd-gradient",
    "bg-industry-gradient",
  ],
  theme: {
    extend: {
      keyframes: {
        peechiSway: {
          "0%, 100%": { transform: "rotate(-1.2deg) translateY(0px)" },
          "50%": { transform: "rotate(1.2deg)" },
        },
      },
      animation: {
        peechiSway: "peechiSway 3.2s ease-in-out infinite",
      },

      fontFamily: {
        sans: ["Gilroy", "sans-serif"],
      },
      colors: {
        background: "hsl(var(--background))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        primaryDark: "#CACACA",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      backgroundImage: {
        "acm-gradient":
          "linear-gradient(94deg, #E10087 10.67%, #4004C0 93.37%)",
        "media-gradient":
          "linear-gradient(98deg, #E10087 7.24%, #FFD600 95.11%)",
        "research-gradient":
          "linear-gradient(98deg, #EA5400 18.05%, #FFC700 94.8%)",
        "education-gradient":
          "linear-gradient(98deg, #56E100 7.24%, #00EAC0 95.11%)",
        "projects-gradient":
          "linear-gradient(98deg, #008CF1 7.24%, #00ECEC 95.11%)",
        "development-gradient":
          "linear-gradient(97deg, #9900E1 7.31%, #5200FF 59.32%)",
        "community-gradient":
          "linear-gradient(98deg, #FFB800 18.05%, #ADFF00 94.8%)",
        "hackutd-gradient":
          "linear-gradient(98deg, #FE002E 7.24%, #AD00FF 95.11%)",
        "industry-gradient":
          "linear-gradient(98deg, #6F6F6F 7.24%, #FFFFFF 95.11%)",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
