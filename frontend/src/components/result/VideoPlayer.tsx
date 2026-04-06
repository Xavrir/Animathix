"use client";

import { motion } from "framer-motion";

export default function VideoPlayer({ src }: { src: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="glass-card overflow-hidden"
    >
      <video
        src={src}
        controls
        playsInline
        className="w-full aspect-video bg-black/40"
      />
    </motion.div>
  );
}
