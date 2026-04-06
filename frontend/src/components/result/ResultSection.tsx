"use client";

import { motion } from "framer-motion";
import VideoPlayer from "./VideoPlayer";

export default function ResultSection({
  videoUrl,
  downloadUrl,
}: {
  videoUrl: string;
  downloadUrl: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="heading-bio text-2xl text-cyan-gradient mb-1 text-center">
        Your Video
      </h2>
      <p className="text-text-dim/50 text-center mb-8 text-sm">
        Mathematics, illuminated
      </p>

      <div className="max-w-3xl mx-auto">
        <VideoPlayer src={videoUrl} />

        <div className="flex justify-center mt-8">
          <a
            href={downloadUrl}
            download
            className="relative group overflow-hidden border border-cyan/30 px-8 py-3
                       text-sm tracking-wider uppercase text-cyan hover:text-abyss transition-colors duration-500"
          >
            <div className="absolute inset-0 bg-cyan -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
            <span className="relative z-10 font-medium">Download Video</span>
          </a>
        </div>
      </div>
    </motion.div>
  );
}
