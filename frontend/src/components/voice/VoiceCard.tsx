"use client";

import type { Voice } from "@/lib/api";

const PROVIDER_LABELS: Record<string, string> = {
  kokoro: "Free",
  elevenlabs: "Premium",
  openai: "Premium",
};

export default function VoiceCard({
  voice,
  selected,
  onSelect,
}: {
  voice: Voice;
  selected: boolean;
  onSelect: () => void;
}) {
  const unavailable = voice.available === false;

  return (
    <button
      onClick={onSelect}
      disabled={unavailable}
      className={`
        relative text-left p-4 transition-all duration-300 border group
        ${
          selected
            ? "border-cyan/40 bg-cyan/6 glow-cyan"
            : unavailable
              ? "border-cyan/6 bg-surface/20 opacity-45 cursor-not-allowed"
              : "border-cyan/8 hover:border-cyan/20 bg-surface/40 cursor-pointer"
        }
      `}
    >
      {selected && (
        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-cyan" />
      )}

      <p className="text-text text-sm font-medium mb-1">{voice.name}</p>

      <div className="flex items-center gap-2">
        <span className="text-text-dim/40 text-xs uppercase tracking-wider">
          {voice.lang}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 border border-cyan/15 text-cyan-dim/60 uppercase tracking-wider">
          {PROVIDER_LABELS[voice.provider] || voice.provider}
        </span>
      </div>

      {unavailable && voice.unavailable_reason && (
        <p className="mt-2 text-[11px] leading-relaxed text-text-dim/50">
          {voice.unavailable_reason}
        </p>
      )}

      {/* Waveform decoration */}
      <div className="flex items-end gap-px mt-3 h-3 opacity-30 group-hover:opacity-60 transition-opacity">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className={`w-0.5 rounded-sm ${selected ? "bg-cyan" : "bg-cyan/50"}`}
            style={{
              height: `${20 + Math.sin(i * 0.9 + (selected ? 1 : 0)) * 60 + 20}%`,
              transition: "height 0.3s ease",
            }}
          />
        ))}
      </div>
    </button>
  );
}
