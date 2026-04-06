export const COLORS = {
  // Scene backgrounds
  dark: "#0c0b09",
  darkSurface: "#141210",
  // Visualization — bronze tones matching the antiquity theme
  brainPrimary: "#b08d57",
  brainSecondary: "#a89d8a",
  brainHighlight: "#c9a85c",
  brainDim: "#6b6255",
  brainAccent: "#b8623a",
  // Legacy aliases (BrainScene compat)
  indigo: "#b08d57",
  indigoLight: "#a89d8a",
  indigoGlow: "#c9a85c",
  indigoDim: "#6b6255",
  amber: "#b8623a",
  // Text on dark
  textLight: "#e0d6c2",
  textDim: "#6b6255",
} as const;

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
