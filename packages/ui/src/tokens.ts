/**
 * Design tokens for Open Polityra.
 * Derived from the logo: deep space-navy backgrounds, electric blue -> cyan
 * gradient arcs, and a silver-white star/wordmark.
 */

export const colors = {
  // Primary: electric blue (logo outer arc, #1478fd = 500)
  primary: {
    50: "#eaf3ff",
    100: "#d3e6ff",
    200: "#a9ceff",
    300: "#74b0ff",
    400: "#3f92fd",
    500: "#1478fd",
    600: "#0b5fd9",
    700: "#0a4bb0",
    800: "#0d3d8c",
    900: "#0f3370",
  },
  // Accent: cyan (logo inner arc, #41cbfd = 400)
  accent: {
    50: "#ecfbff",
    100: "#cff5ff",
    200: "#a3ecff",
    300: "#6fdcfe",
    400: "#41cbfd",
    500: "#1ab0ea",
    600: "#0d8ec4",
    700: "#0f729f",
    800: "#135c80",
    900: "#144d6b",
  },
  // Space navy (brand base, matches logo background #000610)
  navy: {
    50: "#f2f6fc",
    100: "#e1eaf7",
    200: "#c3d3ec",
    300: "#9db5db",
    400: "#6f8bc0",
    500: "#4a67a0",
    600: "#324c80",
    700: "#1f3561",
    800: "#0f2147",
    900: "#061230",
    950: "#000610",
  },
  // Silver (logo star / wordmark, #eef2fc)
  silver: {
    50: "#f8faff",
    100: "#eef2fc",
    200: "#dfe6f5",
    300: "#c4cfe6",
    400: "#9aa8c7",
    500: "#74829f",
  },
  // Semantic colors
  success: { DEFAULT: "#22c55e", light: "#dcfce7", dark: "#166534" },
  warning: { DEFAULT: "#f59e0b", light: "#fef3c7", dark: "#92400e" },
  error: { DEFAULT: "#ef4444", light: "#fee2e2", dark: "#991b1b" },
  info: { DEFAULT: "#1478fd", light: "#d3e6ff", dark: "#0a4bb0" },
  // Neutral palette (cool, blue-tinted to sit with navy)
  neutral: {
    50: "#f6f8fc",
    100: "#eef2f9",
    200: "#dde4f0",
    300: "#c2cde0",
    400: "#8d9bb5",
    500: "#63718c",
    600: "#4a566e",
    700: "#333d54",
    800: "#1c243a",
    900: "#0b1226",
  },
} as const;

/** Brand gradients taken from the logo arcs and the tagline underline. */
export const gradients = {
  brand: "linear-gradient(135deg, #1478fd 0%, #41cbfd 55%, #eef2fc 100%)",
  arc: "linear-gradient(135deg, #3468f5 0%, #1478fd 40%, #41cbfd 100%)",
  glow: "radial-gradient(ellipse at 20% 0%, rgba(20,120,253,0.28), transparent 60%)",
  earthRim: "linear-gradient(90deg, rgba(20,120,253,0) 0%, #2a67bf 60%, #41cbfd 100%)",
} as const;

export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "2.5rem",
  "3xl": "3rem",
} as const;

export const radii = {
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.5rem", // app-icon style rounded square
  full: "9999px",
} as const;

export const typography = {
  fontFamily: {
    // Geometric sans like the logo wordmark ("Open" light / "Polityra" semibold)
    display: ["Outfit", "Lexend", "Inter", "system-ui", "sans-serif"],
    sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
    mono: ["JetBrains Mono", "Fira Code", "monospace"],
  },
  fontSize: {
    xs: ["0.75rem", { lineHeight: "1rem" }],
    sm: ["0.875rem", { lineHeight: "1.25rem" }],
    base: ["1rem", { lineHeight: "1.5rem" }],
    lg: ["1.125rem", { lineHeight: "1.75rem" }],
    xl: ["1.25rem", { lineHeight: "1.75rem" }],
    "2xl": ["1.5rem", { lineHeight: "2rem" }],
    "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
    "4xl": ["3rem", { lineHeight: "1.1" }],
  },
  fontWeight: { light: 300, regular: 400, medium: 500, semibold: 600 },
} as const;

export const zIndex = {
  below: -1,
  default: 0,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  toast: 1600,
} as const;
