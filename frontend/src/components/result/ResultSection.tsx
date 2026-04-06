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
      <h2 className="heading-display text-2xl text-gradient-brand mb-1 text-center">
        Your Video
      </h2>
      <p className="text-text-muted text-center mb-8 text-sm">
        Mathematics, illuminated
      </p>

      <div className="max-w-3xl mx-auto">
        <VideoPlayer src={videoUrl} />

        <div className="flex justify-center mt-8">
          <a
            href={downloadUrl}
            download
            className="btn-primary"
          >
            Download Video
          </a>
        </div>
      </div>
    </motion.div>
  );
}
