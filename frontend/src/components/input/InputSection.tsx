"use client";

import { motion } from "framer-motion";
import MathInput from "./MathInput";
import FileUpload from "./FileUpload";

export default function InputSection({
  content,
  onContentChange,
  onFileSelect,
}: {
  content: string;
  onContentChange: (val: string) => void;
  onFileSelect: (file: File | null) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="space-y-5 max-w-2xl mx-auto"
    >
      <MathInput value={content} onChange={onContentChange} />

      <div className="flex items-center gap-4 px-4">
        <div className="flex-1 h-px bg-cyan/8" />
        <span className="text-text-dim/25 text-xs tracking-widest uppercase">or</span>
        <div className="flex-1 h-px bg-cyan/8" />
      </div>

      <FileUpload onFileSelect={onFileSelect} />
    </motion.div>
  );
}
