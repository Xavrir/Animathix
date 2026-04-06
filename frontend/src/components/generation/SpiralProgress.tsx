"use client";

import { motion } from "framer-motion";

export default function SpiralProgress({ progress }: { progress: number }) {
  // Neural pulse circle progress
  const radius = 44;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex justify-center">
      <div className="relative w-28 h-28">
        <svg width="112" height="112" viewBox="0 0 112 112" className="transform -rotate-90">
          {/* Background ring */}
          <circle
            cx="56" cy="56" r={radius}
            fill="none" stroke="rgba(0,240,255,0.08)" strokeWidth="2"
          />
          {/* Progress ring */}
          <motion.circle
            cx="56" cy="56" r={radius}
            fill="none"
            stroke="url(#cyan-grad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - progress) }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="cyan-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="100%" stopColor="#39ff85" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center pulse */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className="text-cyan text-lg font-medium">
              {Math.round(progress * 100)}
            </span>
            <span className="text-cyan/50 text-xs">%</span>
          </div>
        </div>

        {/* Outer glow pulse */}
        <div
          className="absolute inset-0 rounded-full animate-synapse"
          style={{
            boxShadow: "0 0 30px rgba(0,240,255,0.08)",
          }}
        />
      </div>
    </div>
  );
}
