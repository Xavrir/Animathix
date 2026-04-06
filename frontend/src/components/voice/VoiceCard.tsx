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
        relative text-left p-4 rounded-xl transition-all duration-300 border group
        ${selected
          ? "border-indigo/40 bg-indigo/8 glow-indigo"
          : unavailable
            ? "border-border-light bg-surface/20 opacity-45 cursor-not-allowed"
            : "border-border hover:border-indigo/25 bg-surface/40 cursor-pointer"
        }
      `}
    >
      {selected && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-indigo" />
      )}

      <p className="text-text text-sm font-medium mb-1">{voice.name}</p>

      <div className="flex items-center gap-2">
        <span className="text-text-muted text-xs uppercase tracking-wider">
          {voice.lang}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-md border border-indigo/15 text-indigo-dim uppercase tracking-wider">
          {PROVIDER_LABELS[voice.provider] || voice.provider}
        </span>
      </div>

      {unavailable && voice.unavailable_reason && (
        <p className="mt-2 text-[11px] leading-relaxed text-text-muted">
          {voice.unavailable_reason}
        </p>
      )}

      {/* Waveform decoration */}
      <div className="flex items-end gap-px mt-3 h-3 opacity-30 group-hover:opacity-60 transition-opacity">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className={`w-0.5 rounded-sm ${selected ? "bg-indigo" : "bg-indigo/50"}`}
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
