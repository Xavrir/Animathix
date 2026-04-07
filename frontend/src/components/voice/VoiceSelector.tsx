"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import VoiceCard from "./VoiceCard";
import { fetchVoices, type Voice } from "@/lib/api";

const PROVIDERS = ["kokoro", "elevenlabs", "openai"] as const;
const PROVIDER_NAMES: Record<string, string> = {
  kokoro: "Kokoro",
  elevenlabs: "ElevenLabs",
  openai: "OpenAI",
};

export default function VoiceSelector({
  selectedVoiceId,
  selectedProvider,
  onSelect,
}: {
  selectedVoiceId: string;
  selectedProvider: string;
  onSelect: (voiceId: string, provider: string) => void;
}) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [activeTab, setActiveTab] = useState<string>("kokoro");

  useEffect(() => {
    fetchVoices()
      .then(setVoices)
      .catch(() => {
        setVoices([
          { id: "af_heart", name: "Heart (Female, US)", lang: "en-us", provider: "kokoro", available: false, unavailable_reason: "Backend unavailable" },
          { id: "am_adam", name: "Adam (Male, US)", lang: "en-us", provider: "kokoro", available: false, unavailable_reason: "Backend unavailable" },
          { id: "bf_emma", name: "Emma (Female, UK)", lang: "en-gb", provider: "kokoro", available: false, unavailable_reason: "Backend unavailable" },
        ]);
      });
  }, []);

  useEffect(() => {
    if (voices.length === 0) return;

    const selectedVoice = voices.find(
      (voice) =>
        voice.id === selectedVoiceId && voice.provider === selectedProvider
    );

    if (selectedVoice && selectedVoice.available !== false) {
      setActiveTab(selectedVoice.provider);
      return;
    }

    const firstAvailable = voices.find((voice) => voice.available !== false);
    if (firstAvailable) {
      setActiveTab(firstAvailable.provider);
      if (
        firstAvailable.id !== selectedVoiceId ||
        firstAvailable.provider !== selectedProvider
      ) {
        onSelect(firstAvailable.id, firstAvailable.provider);
      }
      return;
    }

    const firstProvider = voices[0]?.provider;
    if (firstProvider) {
      setActiveTab(firstProvider);
    }
  }, [voices, selectedVoiceId, selectedProvider, onSelect]);

  const filtered = voices.filter((v) => v.provider === activeTab);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <h2 className="heading-display text-2xl text-gradient-indigo mb-1 text-center">
        Choose a Voice
      </h2>
      <p className="text-text-muted text-center mb-7 text-sm">
        Select the narrator for your video
      </p>

      {/* Tabs */}
      <div className="flex justify-center gap-1 mb-6">
        {PROVIDERS.map((p) => (
          <button
            key={p}
            onClick={() => setActiveTab(p)}
            className={`
              px-4 py-2 text-xs tracking-[0.12em] uppercase rounded-lg transition-all duration-300 border cursor-pointer
              ${activeTab === p
                ? "border-indigo/30 text-indigo-light bg-indigo/8"
                : "border-border-light text-text-muted hover:text-text-secondary hover:border-indigo/15"
              }
            `}
          >
            {PROVIDER_NAMES[p]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-2xl mx-auto">
        {filtered.map((voice) => (
          <VoiceCard
            key={`${voice.provider}-${voice.id}`}
            voice={voice}
            selected={voice.id === selectedVoiceId && voice.provider === selectedProvider}
            onSelect={() => {
              if (voice.available === false) return;
              onSelect(voice.id, voice.provider);
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
