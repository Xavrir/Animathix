"use client";

import { motion } from "framer-motion";

export default function VideoPlayer({ src }: { src: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* Corner accents — pointer-events-none so they don't block video controls */}
      <div className="absolute -inset-2 pointer-events-none">
        <div className="absolute top-0 left-0 w-5 h-5 border-t border-l border-cyan/25" />
        <div className="absolute top-0 right-0 w-5 h-5 border-t border-r border-cyan/25" />
        <div className="absolute bottom-0 left-0 w-5 h-5 border-b border-l border-cyan/25" />
        <div className="absolute bottom-0 right-0 w-5 h-5 border-b border-r border-cyan/25" />
      </div>

      {/* Video — z-10 to ensure controls are clickable above decorations */}
      <video
        src={src}
        controls
        playsInline
        className="relative z-10 w-full aspect-video bg-black/40 border border-cyan/10"
      />
    </motion.div>
  );
}
