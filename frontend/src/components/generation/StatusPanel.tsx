"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SpiralProgress from "./SpiralProgress";
import type { JobStatus } from "@/lib/api";

const STEPS = [
  { key: "planning", label: "Analyzing", description: "Breaking down your question into visual scenes", icon: "01" },
  { key: "synthesizing_audio", label: "Voicing", description: "Preparing narration for each scene", icon: "02" },
  { key: "generating_code", label: "Composing", description: "Writing animation code for each scene", icon: "03" },
  { key: "rendering", label: "Rendering", description: "Producing your animated video frame by frame", icon: "04" },
  { key: "finalizing", label: "Finalizing", description: "Merging audio and video into the final result", icon: "05" },
  { key: "complete", label: "Done", description: "Your video is ready", icon: "06" },
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
    <span className="text-text-muted text-xs font-mono-accent tabular-nums">
      {mins}:{secs.toString().padStart(2, "0")} elapsed
    </span>
  );
}

function RotatingTip() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setIndex((i) => (i + 1) % TIPS.length), 5000);
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
        className="text-text-muted text-xs text-center italic leading-relaxed"
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
              background: "linear-gradient(90deg, transparent, #b08d57, #c9a85c, transparent)",
            }}
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="p-8 pb-6">
          <SpiralProgress progress={job.progress} />

          <motion.div
            key={job.status}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-6 mb-1"
          >
            <p className="heading-display text-xl text-gradient-brand">
              {currentStep.label}
            </p>
            <p className="text-text-secondary text-sm mt-1">
              {currentStep.description}
            </p>
          </motion.div>

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
                  <div className="w-full h-1 rounded-full overflow-hidden bg-indigo/8">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: "linear-gradient(90deg, #b08d57, #c9a85c)",
                      }}
                      initial={{ width: "0%" }}
                      animate={{
                        width: isDone
                          ? "100%"
                          : isCurrent
                            ? `${Math.min(Math.max(((job.progress - i * segmentSpan) / segmentSpan) * 100, 0), 95)}%`
                            : "0%",
                      }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[10px] font-mono tabular-nums ${isDone ? "text-text-secondary" : isCurrent ? "text-charcoal" : "text-text-muted/40"
                        }`}
                    >
                      {step.icon}
                    </span>
                    <span
                      className={`text-[10px] tracking-wider uppercase ${isCurrent ? "text-charcoal" : isDone ? "text-text-secondary" : "text-text-muted/40"
                        }`}
                    >
                      {step.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="min-h-[32px]">
            <RotatingTip />
          </div>
        </div>

        {job.status === "failed" && job.error && (
          <div className="mx-6 mb-6 p-3 border border-danger/15 bg-danger/5 rounded-lg text-danger/70 text-sm">
            {job.error}
          </div>
        )}
      </div>
    </motion.div>
  );
}
