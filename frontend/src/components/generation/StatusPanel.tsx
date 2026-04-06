"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SpiralProgress from "./SpiralProgress";
import type { JobStatus } from "@/lib/api";

const STEPS = [
  {
    key: "planning",
    label: "Analyzing",
    description: "Breaking down your question into visual scenes",
    icon: "🧠",
  },
  {
    key: "synthesizing_audio",
    label: "Voicing",
    description: "Preparing Kokoro narration for each scene",
    icon: "♪",
  },
  {
    key: "generating_code",
    label: "Composing",
    description: "Writing animation code for each scene",
    icon: "✦",
  },
  {
    key: "rendering",
    label: "Rendering",
    description: "Producing your animated video frame by frame",
    icon: "◈",
  },
  {
    key: "finalizing",
    label: "Finalizing",
    description: "Merging audio and video into the final result",
    icon: "⬢",
  },
  {
    key: "complete",
    label: "Done",
    description: "Your video is ready",
    icon: "✓",
  },
];

const TIPS = [
  "The AI is designing visuals tailored to your question...",
  "Kokoro narration is synthesized locally when that voice is selected...",
  "Each scene is built with mathematical precision...",
  "Complex topics may take a bit longer — quality takes time...",
  "Your video will include graphs, shapes, and step-by-step visuals...",
  "Almost like having a personal math tutor create a video just for you...",
];

function ElapsedTimer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <span className="text-text-dim/30 text-xs tabular-nums">
      {mins}:{secs.toString().padStart(2, "0")} elapsed
    </span>
  );
}

function RotatingTip() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(
      () => setIndex((i) => (i + 1) % TIPS.length),
      5000
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={index}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.4 }}
        className="text-text-dim/35 text-xs text-center italic leading-relaxed"
      >
        {TIPS[index]}
      </motion.p>
    </AnimatePresence>
  );
}

export default function StatusPanel({ job }: { job: JobStatus }) {
  const currentIndex = STEPS.findIndex((s) => s.key === job.status);
  const currentStep = STEPS[currentIndex] || STEPS[0];
  const segmentSpan = 1 / Math.max(STEPS.length - 1, 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto"
    >
      <div className="glass-card overflow-hidden">
        {/* Top bar — animated gradient */}
        <div className="h-0.5 w-full relative overflow-hidden">
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, transparent, #00f0ff, #39ff85, transparent)",
            }}
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="p-8 pb-6">
          {/* Progress ring */}
          <SpiralProgress progress={job.progress} />

          {/* Current step label */}
          <motion.div
            key={job.status}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-6 mb-1"
          >
            <p className="heading-bio text-xl text-cyan-gradient">
              {currentStep.label}
            </p>
            <p className="text-text-dim/50 text-sm mt-1">
              {currentStep.description}
            </p>
          </motion.div>

          {/* Elapsed time */}
          <div className="text-center mt-3 mb-6">
            <ElapsedTimer />
          </div>

          {/* Step progress bar */}
          <div className="flex items-center gap-1 mb-6">
            {STEPS.map((step, i) => {
              const isDone = currentIndex > i;
              const isCurrent = currentIndex === i;

              return (
                <div key={step.key} className="flex-1 flex flex-col items-center gap-2">
                  {/* Bar segment */}
                  <div className="w-full h-1 rounded-full overflow-hidden bg-cyan/6">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: "linear-gradient(90deg, #00f0ff, #39ff85)",
                      }}
                      initial={{ width: "0%" }}
                        animate={{
                          width: isDone
                            ? "100%"
                            : isCurrent
                              ? `${Math.min(
                                  Math.max(((job.progress - i * segmentSpan) / segmentSpan) * 100, 0),
                                  95
                                )}%`
                              : "0%",
                        }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>

                  {/* Label */}
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[10px] ${
                        isDone
                          ? "text-cyan/60"
                          : isCurrent
                            ? "text-cyan"
                            : "text-text-dim/15"
                      }`}
                    >
                      {step.icon}
                    </span>
                    <span
                      className={`text-[10px] tracking-wider uppercase ${
                        isCurrent
                          ? "text-cyan"
                          : isDone
                            ? "text-cyan/40"
                            : "text-text-dim/15"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rotating tips */}
          <div className="min-h-[32px]">
            <RotatingTip />
          </div>
        </div>

        {/* Error state */}
        {job.status === "failed" && job.error && (
          <div className="mx-6 mb-6 p-3 border border-red-500/15 bg-red-500/4 text-red-300/70 text-sm">
            {job.error}
          </div>
        )}
      </div>
    </motion.div>
  );
}
