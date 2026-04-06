"use client";

import { motion } from "framer-motion";

export default function SpiralProgress({ progress }: { progress: number }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex justify-center">
      <div className="relative w-28 h-28">
        <svg width="112" height="112" viewBox="0 0 112 112" className="transform -rotate-90">
          {/* Background ring */}
          <circle
            cx="56" cy="56" r={radius}
            fill="none" stroke="rgba(176,141,87,0.10)" strokeWidth="2"
          />
          {/* Progress ring */}
          <motion.circle
            cx="56" cy="56" r={radius}
            fill="none"
            stroke="url(#indigo-grad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - progress) }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="indigo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#b08d57" />
              <stop offset="100%" stopColor="#c9a85c" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center pulse */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className="text-indigo-light text-lg font-medium">
              {Math.round(progress * 100)}
            </span>
            <span className="text-indigo/50 text-xs">%</span>
          </div>
        </div>

        {/* Outer glow pulse */}
        <div
          className="absolute inset-0 rounded-full animate-pulse-glow"
          style={{
            boxShadow: "0 0 30px rgba(176,141,87,0.10)",
          }}
        />
      </div>
    </div>
  );
}
