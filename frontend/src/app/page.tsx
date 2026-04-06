"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";

const BrainScene = dynamic(
  () => import("@/components/hero/BrainScene"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border border-cyan/20 animate-synapse" />
      </div>
    ),
  }
);

export default function LandingPage() {
  return (
    <main className="relative min-h-screen flex flex-col">
      {/* Background radial glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(0,240,255,0.04) 0%, transparent 70%)",
        }}
      />

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-6">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="heading-bio text-xl text-cyan-gradient">Animathix</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex items-center gap-6"
        >
          <Link
            href="/login"
            className="text-text-dim text-sm hover:text-text transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="border border-cyan/30 px-5 py-2 text-sm text-cyan hover:bg-cyan/8 hover:border-cyan/50 transition-all"
          >
            Get Started
          </Link>
        </motion.div>
      </nav>

      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center">
        {/* 3D Brain */}
        <div className="absolute inset-0 z-0">
          <BrainScene />
        </div>

        {/* Text overlay */}
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-cyan-dim tracking-[0.25em] uppercase text-xs font-medium mb-5"
          >
            AI-Powered Math Videos
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5 }}
            className="heading-bio text-5xl md:text-7xl lg:text-8xl text-cyan-gradient mb-7 leading-tight"
          >
            Animathix
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="text-text-dim text-lg md:text-xl leading-relaxed max-w-xl mx-auto mb-10"
          >
            Transform any math question into a beautifully animated
            explainer video — with narration that brings concepts to life.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.1 }}
            className="flex items-center justify-center gap-4"
          >
            <Link
              href="/login"
              className="relative group overflow-hidden border border-cyan/40 px-8 py-3.5 text-sm tracking-wider uppercase text-cyan hover:text-abyss transition-colors duration-500"
            >
              <div className="absolute inset-0 bg-cyan -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              <span className="relative z-10 font-medium">Start Creating</span>
            </Link>

            <Link
              href="#features"
              className="px-6 py-3.5 text-sm text-text-dim hover:text-text transition-colors"
            >
              Learn More
            </Link>
          </motion.div>
        </div>

        {/* Scroll line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 2 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
        >
          <div className="w-px h-10 bg-gradient-to-b from-cyan/40 to-transparent" />
        </motion.div>
      </section>

      {/* Features section */}
      <section id="features" className="relative z-10 px-6 py-28 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="heading-bio text-3xl md:text-4xl text-cyan-gradient mb-3">
            How It Works
          </h2>
          <p className="text-text-dim max-w-lg mx-auto">
            From question to video in minutes — powered by AI that understands mathematics.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Ask Anything",
              desc: "Type a math question, paste LaTeX, or upload a document. From algebra to calculus.",
            },
            {
              step: "02",
              title: "AI Animates",
              desc: "Our AI breaks down the concept, designs visuals, writes code, and renders the animation.",
            },
            {
              step: "03",
              title: "Watch & Learn",
              desc: "Get a narrated video with step-by-step visual explanations you can download and share.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              viewport={{ once: true }}
              className="glass-card p-8"
            >
              <span className="text-cyan/30 text-xs tracking-[0.3em] uppercase">{item.step}</span>
              <h3 className="heading-bio text-xl text-text mt-3 mb-2">{item.title}</h3>
              <p className="text-text-dim text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Link
            href="/login"
            className="inline-block border border-cyan/30 px-8 py-3 text-sm text-cyan hover:bg-cyan/8 hover:border-cyan/50 transition-all tracking-wider uppercase"
          >
            Try It Free
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-cyan/6 py-6 text-center">
        <p className="text-text-dim/30 text-xs tracking-[0.15em] uppercase">
          Animathix &mdash; Where Mathematics Comes Alive
        </p>
      </footer>
    </main>
  );
}
