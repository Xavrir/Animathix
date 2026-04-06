"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export default function GoldButton({
  children,
  onClick,
  disabled = false,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative group overflow-hidden
        border border-gold/50 px-8 py-3.5
        text-sm tracking-[0.15em] uppercase
        transition-all duration-500
        ${
          disabled
            ? "opacity-40 cursor-not-allowed text-gold-dim border-gold/20"
            : "text-gold hover:text-navy hover:border-gold cursor-pointer"
        }
        ${className}
      `}
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Gold fill on hover */}
      <div
        className="absolute inset-0 bg-gold transform -translate-x-full
                    group-hover:translate-x-0 transition-transform duration-500 ease-out"
        style={{ pointerEvents: "none" }}
      />

      {/* Button text */}
      <span className="relative z-10 font-semibold">{children}</span>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gold/70" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gold/70" />
    </motion.button>
  );
}
