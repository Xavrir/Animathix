"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import InputSection from "@/components/input/InputSection";
import VoiceSelector from "@/components/voice/VoiceSelector";
import StatusPanel from "@/components/generation/StatusPanel";
import ResultSection from "@/components/result/ResultSection";
import { useJobPolling } from "@/hooks/useJobPolling";
import { startGeneration, getDownloadUrl } from "@/lib/api";
import { API_BASE } from "@/lib/constants";

export default function CreatePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("animathix_user");
    if (!stored) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(stored));
  }, [router]);

  // Input state
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [voiceId, setVoiceId] = useState("af_heart");
  const [voiceProvider, setVoiceProvider] = useState("kokoro");
  const [quality, setQuality] = useState("medium");
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Generation state
  const [jobId, setJobId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { job, isLoading: isPolling, error: pollingError } = useJobPolling(jobId);

  const isStarting = isSubmitting || (jobId !== null && isPolling);
  const generationError = submitError || (pollingError instanceof Error ? pollingError.message : null);
  const canGenerate = (content.trim().length > 0 || file !== null) && !isStarting;
  const isGenerating = job && job.status !== "complete" && job.status !== "failed";
  const isComplete = job?.status === "complete";

  async function handleGenerate() {
    if (!canGenerate) return;
    setSubmitError(null);
    setJobId(null);
    setIsSubmitting(true);
    try {
      const id = await startGeneration({
        content: content || "Explain the uploaded document",
        contentType: file ? "pdf" : "text",
        voiceId,
        voiceProvider,
        quality,
        file: file || undefined,
      });
      setJobId(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start generation";
      setSubmitError(message);
      console.error("Failed to start generation:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <main className="min-h-screen flex flex-col">
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 0%, rgba(0,240,255,0.03) 0%, transparent 70%)",
        }}
      />

      {/* Top bar */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-4 border-b border-cyan/6">
        <Link href="/" className="heading-bio text-lg text-cyan-gradient">
          Animathix
        </Link>

        <div className="flex items-center gap-5">
          <span className="text-text-dim text-sm">{user.name}</span>
          <button
            onClick={() => {
              localStorage.removeItem("animathix_user");
              router.push("/");
            }}
            className="text-text-dim/40 text-xs hover:text-text-dim transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div className="relative z-10 flex-1 px-6 py-12 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="heading-bio text-3xl md:text-4xl text-cyan-gradient mb-2">
            Create a Video
          </h1>
          <p className="text-text-dim text-sm">
            Describe a math concept and we&apos;ll animate it for you
          </p>
        </motion.div>

        {/* Input */}
        <InputSection
          content={content}
          onContentChange={setContent}
          onFileSelect={setFile}
        />

        {/* Divider */}
        <div className="flex items-center justify-center py-10">
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-cyan/15 to-transparent" />
        </div>

        {/* Voice */}
        <VoiceSelector
          selectedVoiceId={voiceId}
          selectedProvider={voiceProvider}
          onSelect={(id, provider) => {
            setVoiceId(id);
            setVoiceProvider(provider);
          }}
        />

        {/* Divider */}
        <div className="flex items-center justify-center py-10">
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-cyan/15 to-transparent" />
        </div>

        {/* Quality */}
        <div className="flex justify-center gap-2 mb-10">
          {(["low", "medium", "high"] as const).map((q) => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              className={`
                px-5 py-2.5 text-xs tracking-[0.15em] uppercase border transition-all duration-300 cursor-pointer
                ${
                  quality === q
                    ? "border-cyan/40 text-cyan bg-cyan/8 glow-cyan"
                    : "border-cyan/8 text-text-dim/40 hover:border-cyan/20 hover:text-text-dim"
                }
              `}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Generate */}
        {!isGenerating && !isComplete && (
          <div className="flex justify-center">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={`
                relative group overflow-hidden border px-10 py-4 text-sm tracking-wider uppercase
                transition-all duration-500 cursor-pointer
                ${
                  canGenerate
                    ? "border-cyan/40 text-cyan hover:text-abyss"
                    : "border-cyan/10 text-text-dim/30 cursor-not-allowed"
                }
              `}
              >
                {canGenerate && (
                  <div className="absolute inset-0 bg-cyan -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                )}
              <span className="relative z-10 font-medium">
                 {isStarting ? "Starting..." : "Generate Video"}
               </span>
             </button>
           </div>
        )}

        {generationError && !isGenerating && !isComplete && (
          <div className="mt-6 max-w-xl mx-auto border border-red-500/20 bg-red-500/5 px-4 py-3 text-center text-sm text-red-300/80">
            {generationError}
          </div>
        )}

        {/* Status */}
        {isStarting && !job && !generationError && (
          <div className="mt-14 max-w-md mx-auto glass-card p-8 text-center">
            <p className="heading-bio text-xl text-cyan-gradient mb-2">Preparing your video</p>
            <p className="text-text-dim text-sm">Starting the generation job and connecting to the renderer...</p>
          </div>
        )}

        {job && isGenerating && (
          <div className="mt-14">
            <StatusPanel job={job} />
          </div>
        )}

        {/* Result */}
        {isComplete && job && (
          <div className="mt-14">
            <ResultSection
              videoUrl={`${API_BASE}/api/download/${job.job_id}`}
              downloadUrl={getDownloadUrl(job.job_id)}
            />
            <div className="flex justify-center mt-10">
              <button
                onClick={() => {
                  setJobId(null);
                  setContent("");
                  setFile(null);
                }}
                className="text-text-dim/40 text-sm hover:text-cyan transition-colors cursor-pointer"
              >
                Create another video
              </button>
            </div>
          </div>
        )}

        {/* Failed */}
        {job?.status === "failed" && (
          <div className="mt-8 text-center">
            <p className="text-red-400/70 text-sm mb-4">{job.error}</p>
            <button
              onClick={() => setJobId(null)}
              className="border border-cyan/30 px-6 py-2.5 text-sm text-cyan hover:bg-cyan/8 transition-all cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
