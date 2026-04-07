"use client";

import { useCallback, useState } from "react";

export default function FileUpload({
  onFileSelect,
}: {
  onFileSelect: (file: File | null) => void;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      setFileName(file.name);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (
        file &&
        (file.type === "application/pdf" || file.type.startsWith("image/"))
      ) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".pdf,image/png,image/jpeg,image/webp,image/bmp";
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) handleFile(file);
        };
        input.click();
      }}
      className={`
        rounded-xl border border-dashed transition-all duration-300 p-6 text-center cursor-pointer
        ${isDragging ? "border-indigo/40 bg-indigo/5" : "border-border hover:border-indigo/25 hover:bg-surface/40"}
      `}
    >
      {/* Upload icon */}
      <div className="flex justify-center mb-3">
        <div className="w-10 h-10 rounded-xl bg-indigo/10 border border-indigo/15 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-indigo-light">
            <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {fileName ? (
        <p className="text-text text-sm">
          {fileName}
          <button
            onClick={(e) => { e.stopPropagation(); setFileName(null); onFileSelect(null); }}
            className="ml-3 text-indigo-dim hover:text-indigo-light text-xs transition-colors"
          >
            remove
          </button>
        </p>
      ) : (
        <p className="text-text-muted text-sm">
          Drop a PDF or image here, or click to upload
        </p>
      )}
    </div>
  );
}
