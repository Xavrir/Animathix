"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

const steps = [
  {
    number: "01",
    title: "Capture the problem",
    desc: "Drop in a theorem, worksheet, or document. Animathix finds the mathematical spine of the idea.",
  },
  {
    number: "02",
    title: "Map the visual intuition",
    desc: "AI structures the explanation scene by scene — graphs, geometry, and transformations carry the understanding.",
  },
  {
    number: "03",
    title: "Render the explanation",
    desc: "Manim and Kokoro produce a narrated film that teaches with motion, pacing, and clarity.",
  },
];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Video background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.62, objectPosition: "60% center" }}
        >
          <source src="/hero-philosopher.mp4" type="video/mp4" />
        </video>

        {/* Gradient overlays for depth + text readability */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(12,11,9,0.88) 0%, rgba(12,11,9,0.72) 24%, rgba(12,11,9,0.28) 58%, rgba(12,11,9,0.08) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(12,11,9,0.78) 0%, transparent 28%, transparent 82%, rgba(12,11,9,0.34) 100%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-6xl w-full px-6 md:px-10 py-32">
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <div className="accent-rule mb-5" />
              <span className="section-label text-bronze/70">
                AI-powered mathematical cinematics
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="heading-editorial text-5xl md:text-6xl lg:text-[4.5rem] mb-6"
            >
              Watch the logic
              <br />
              become visible.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg leading-relaxed text-text-secondary max-w-md mb-10"
            >
              Animathix turns dense math questions into explainable animated
              films — with graphs, narration, and pacing that make concepts
              click.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap items-center gap-4"
            >
              <Link href="/login" className="btn-primary">
                Start Creating
              </Link>
              <Link href="#how-it-works" className="btn-secondary">
                How It Works
              </Link>
            </motion.div>
          </div>

          {/* Stat cards */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl"
          >
            {[
              { label: "Inputs", value: "Questions, PDFs, LaTeX" },
              { label: "Output", value: "Narrated explainer videos" },
              { label: "Engine", value: "Manim + Kokoro TTS" },
            ].map((s) => (
              <div
                key={s.label}
                className="px-5 py-4 rounded-xl border border-border/60 backdrop-blur-[2px]"
                style={{ background: "rgba(12, 11, 9, 0.58)" }}
              >
                <p className="section-label mb-1 text-bronze/60">{s.label}</p>
                <p className="text-sm text-charcoal">{s.value}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        id="how-it-works"
        className="relative z-10 border-t border-border/50"
      >
        <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 lg:py-28">
          <div className="max-w-md mb-14">
            <div className="accent-rule mb-5" />
            <h2 className="heading-editorial text-3xl md:text-4xl mb-4">
              From notation to narrative.
            </h2>
            <p className="text-text-secondary leading-relaxed">
              Three steps between your question and a shareable animated lesson.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true, margin: "-60px" }}
                className="card px-6 py-6"
              >
                <span className="text-xs font-medium text-bronze/50 tracking-wider">
                  {step.number}
                </span>
                <h3 className="heading-editorial text-xl mt-2 mb-3">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why different ── */}
      <section className="relative z-10 border-t border-border/50">
        <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <div className="accent-rule mb-5" />
              <h2 className="heading-editorial text-3xl md:text-4xl mb-4">
                Most tools summarize.
                <br />
                This one choreographs.
              </h2>
              <p className="text-text-secondary leading-relaxed max-w-md">
                The viewer sees why it works, where it comes from, and how the
                intuition builds — not just the answer on a screen.
              </p>
            </div>

            <div className="space-y-4">
              {[
                "Built for explanation-first math videos, not generic text recaps.",
                "Designed around visual intuition, scene transitions, and structured narration.",
                "Made for students, educators, and anyone who wants the idea to actually click.",
              ].map((note, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  className="flex items-start gap-3 card px-5 py-4"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-bronze flex-shrink-0" />
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {note}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 border-t border-border/50">
        <div
          className="mx-auto max-w-6xl px-6 py-20 md:px-10 text-center"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(176,141,87,0.04) 0%, transparent 70%)",
          }}
        >
          <div className="accent-rule mx-auto mb-6" />
          <h2 className="heading-editorial text-3xl md:text-4xl mb-4">
            Build the explanation you wish you had.
          </h2>
          <p className="text-text-secondary max-w-md mx-auto mb-8">
            Start with a single question and end with a shareable animated
            lesson.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/login" className="btn-primary">
              Try It Free
            </Link>
            <Link href="/login" className="btn-secondary">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
