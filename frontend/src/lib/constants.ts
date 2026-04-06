export const COLORS = {
  abyss: "#050a0e",
  deep: "#0a1018",
  surface: "#0d1520",
  surfaceLight: "#12202e",
  cyan: "#00f0ff",
  cyanDim: "#007a82",
  cyanGlow: "#00d4e0",
  green: "#39ff85",
  greenDim: "#1a8a4a",
  text: "#c8dce8",
  textDim: "#5a7a8e",
  accent: "#1a3a5a",
} as const;

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
