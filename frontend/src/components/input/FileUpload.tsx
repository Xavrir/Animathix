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
      if (file?.type === "application/pdf") {
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
        input.accept = ".pdf";
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) handleFile(file);
        };
        input.click();
      }}
      className={`
        border border-dashed transition-all duration-300 p-6 text-center cursor-pointer
        ${isDragging ? "border-cyan/40 bg-cyan/4" : "border-cyan/12 hover:border-cyan/25"}
      `}
    >
      {/* Upload icon */}
      <div className="flex justify-center mb-3">
        <div className="w-8 h-8 rounded-full border border-cyan/20 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-cyan/50">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {fileName ? (
        <p className="text-text text-sm">
          {fileName}
          <button
            onClick={(e) => { e.stopPropagation(); setFileName(null); onFileSelect(null); }}
            className="ml-3 text-cyan-dim hover:text-cyan text-xs"
          >
            remove
          </button>
        </p>
      ) : (
        <p className="text-text-dim/40 text-sm">
          Drop a PDF here or click to upload
        </p>
      )}
    </div>
  );
}
