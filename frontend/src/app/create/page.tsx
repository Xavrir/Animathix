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
    if (!stored) { router.push("/login"); return; }
    setUser(JSON.parse(stored));
  }, [router]);

  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [voiceId, setVoiceId] = useState("af_heart");
  const [voiceProvider, setVoiceProvider] = useState("kokoro");
  const [quality, setQuality] = useState("medium");
  const [submitError, setSubmitError] = useState<string | null>(null);
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
        voiceId, voiceProvider, quality,
        file: file || undefined,
      });
      setJobId(id);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to start generation");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <main className="min-h-screen flex flex-col">
        <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 md:px-10 border-b border-bronze/10 bg-cream/80 backdrop-blur-md">
        <Link href="/" className="heading-editorial text-lg">Animathix</Link>
        <div className="flex items-center gap-5">
          <span className="text-text-secondary text-sm">{user.name}</span>
          <button
            onClick={() => { localStorage.removeItem("animathix_user"); router.push("/"); }}
            className="text-text-muted text-xs hover:text-text-secondary transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </nav>

      <div className="relative z-10 flex-1 px-6 py-12 max-w-3xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="accent-rule mx-auto mb-5" />
          <h1 className="heading-editorial text-3xl md:text-4xl mb-2">Create a Video</h1>
          <p className="text-text-secondary text-sm">Describe a math concept and we&apos;ll animate it for you</p>
        </motion.div>

        <InputSection content={content} onContentChange={setContent} onFileSelect={setFile} />

        <div className="flex items-center justify-center py-8">
          <div className="w-24 h-px bg-border" />
        </div>

        <VoiceSelector
          selectedVoiceId={voiceId}
          selectedProvider={voiceProvider}
          onSelect={(id, provider) => { setVoiceId(id); setVoiceProvider(provider); }}
        />

        <div className="flex items-center justify-center py-8">
          <div className="w-24 h-px bg-border" />
        </div>

        {/* Quality */}
        <div className="flex justify-center gap-2 mb-10">
          {(["low", "medium", "high"] as const).map((q) => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              className={`px-5 py-2.5 text-xs tracking-wider uppercase rounded-lg border transition-colors cursor-pointer ${quality === q
                  ? "border-olive bg-olive/8 text-olive font-medium"
                  : "border-border text-text-muted hover:border-charcoal/30 hover:text-text-secondary"
                }`}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Generate */}
        {!isGenerating && !isComplete && (
          <div className="flex justify-center">
            <button onClick={handleGenerate} disabled={!canGenerate} className="btn-primary px-10 py-3.5">
              {isStarting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Starting...
                </span>
              ) : "Generate Video"}
            </button>
          </div>
        )}

        {generationError && !isGenerating && !isComplete && (
          <div className="mt-6 max-w-xl mx-auto border border-danger/20 bg-danger/5 rounded-lg px-4 py-3 text-center text-sm text-danger">
            {generationError}
          </div>
        )}

        {isStarting && !job && !generationError && (
          <div className="mt-14 max-w-md mx-auto card px-8 py-8 text-center">
            <h3 className="heading-editorial text-xl mb-2">Preparing your video</h3>
            <p className="text-text-secondary text-sm">Connecting to the renderer...</p>
          </div>
        )}

        {job && isGenerating && <div className="mt-14"><StatusPanel job={job} /></div>}

        {isComplete && job && (
          <div className="mt-14">
            <ResultSection videoUrl={`${API_BASE}/api/download/${job.job_id}`} downloadUrl={getDownloadUrl(job.job_id)} />
            <div className="flex justify-center mt-10">
              <button onClick={() => { setJobId(null); setContent(""); setFile(null); }} className="text-text-muted text-sm hover:text-olive transition-colors cursor-pointer">
                Create another video
              </button>
            </div>
          </div>
        )}

        {job?.status === "failed" && (
          <div className="mt-8 text-center">
            <p className="text-danger text-sm mb-4">{job.error}</p>
            <button onClick={() => setJobId(null)} className="btn-secondary">Try Again</button>
          </div>
        )}
      </div>
    </main>
  );
}
