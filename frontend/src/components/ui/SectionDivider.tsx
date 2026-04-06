"use client";

import { motion } from "framer-motion";

export default function SectionDivider() {
  // Golden spiral approximation as SVG path
  return (
    <div className="flex items-center justify-center py-12">
      <motion.svg
        width="200"
        height="24"
        viewBox="0 0 200 24"
        initial={{ opacity: 0, scaleX: 0 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        {/* Left line */}
        <line x1="0" y1="12" x2="70" y2="12" stroke="#d4a853" strokeWidth="0.5" opacity="0.4" />

        {/* Center diamond */}
        <path
          d="M 90 12 L 95 7 L 100 12 L 105 7 L 110 12 L 105 17 L 100 12 L 95 17 Z"
          fill="none"
          stroke="#d4a853"
          strokeWidth="0.8"
          opacity="0.6"
        />

        {/* Tiny inner diamond */}
        <rect
          x="97"
          y="9"
          width="6"
          height="6"
          transform="rotate(45 100 12)"
          fill="#d4a853"
          opacity="0.15"
        />

        {/* Right line */}
        <line x1="130" y1="12" x2="200" y2="12" stroke="#d4a853" strokeWidth="0.5" opacity="0.4" />
      </motion.svg>
    </div>
  );
}
