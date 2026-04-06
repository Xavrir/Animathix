"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Simulate auth - in production, wire to your auth backend
    setTimeout(() => {
      localStorage.setItem("animathix_user", JSON.stringify({ email, name: name || email.split("@")[0] }));
      router.push("/create");
    }, 800);
  }

  return (
    <main className="min-h-screen flex">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        {/* Ambient glow */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,240,255,0.06) 0%, rgba(5,10,14,1) 70%)",
          }}
        />

        {/* Animated neural network decoration */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" viewBox="0 0 600 800">
          {Array.from({ length: 20 }).map((_, i) => {
            const x1 = 100 + Math.sin(i * 1.2) * 200;
            const y1 = 100 + (i / 20) * 600;
            const x2 = 300 + Math.cos(i * 0.8) * 200;
            const y2 = 150 + ((i + 5) % 20 / 20) * 600;
            return (
              <line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#00f0ff"
                strokeWidth="0.5"
              />
            );
          })}
          {Array.from({ length: 15 }).map((_, i) => (
            <circle
              key={`n${i}`}
              cx={150 + Math.sin(i * 0.9) * 200}
              cy={60 + (i / 15) * 680}
              r="3"
              fill="#00f0ff"
              opacity="0.3"
            />
          ))}
        </svg>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-12"
        >
          <h2 className="heading-bio text-4xl text-cyan-gradient mb-4">
            Animathix
          </h2>
          <p className="text-text-dim text-lg leading-relaxed max-w-sm">
            Unlock the power of AI to visualize mathematics like never before.
          </p>

          {/* Decorative brain pulse */}
          <div className="mt-12 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border border-cyan/15 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border border-cyan/20 flex items-center justify-center animate-synapse">
                  <div className="w-8 h-8 rounded-full bg-cyan/10" />
                </div>
              </div>
              {/* Orbiting dots */}
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-cyan/50"
                  style={{
                    top: `${50 + Math.sin((i / 4) * Math.PI * 2) * 50}%`,
                    left: `${50 + Math.cos((i / 4) * Math.PI * 2) * 50}%`,
                    transform: "translate(-50%, -50%)",
                    animation: `synapse-pulse ${2 + i * 0.5}s ease-in-out infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-10 text-center">
            <Link href="/" className="heading-bio text-2xl text-cyan-gradient">
              Animathix
            </Link>
          </div>

          <h1 className="heading-bio text-2xl text-text mb-1">
            {isSignUp ? "Create an account" : "Welcome back"}
          </h1>
          <p className="text-text-dim text-sm mb-8">
            {isSignUp
              ? "Start creating animated math videos"
              : "Sign in to continue creating"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div>
                <label className="block text-text-dim text-xs tracking-wider uppercase mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-surface border border-cyan/10 px-4 py-3 text-text text-sm
                             placeholder:text-text-dim/30 focus:outline-none input-glow transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-text-dim text-xs tracking-wider uppercase mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-surface border border-cyan/10 px-4 py-3 text-text text-sm
                           placeholder:text-text-dim/30 focus:outline-none input-glow transition-all"
              />
            </div>

            <div>
              <label className="block text-text-dim text-xs tracking-wider uppercase mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full bg-surface border border-cyan/10 px-4 py-3 text-text text-sm
                           placeholder:text-text-dim/30 focus:outline-none input-glow transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden border border-cyan/40 py-3.5
                         text-sm tracking-wider uppercase text-cyan hover:text-abyss
                         transition-colors duration-500 cursor-pointer disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-cyan -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              <span className="relative z-10 font-medium">
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border border-current animate-spin border-t-transparent" />
                    {isSignUp ? "Creating..." : "Signing in..."}
                  </span>
                ) : isSignUp ? "Create Account" : "Sign In"}
              </span>
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-cyan/8" />
            <span className="text-text-dim/30 text-xs">or</span>
            <div className="flex-1 h-px bg-cyan/8" />
          </div>

          {/* Social auth placeholders */}
          <div className="space-y-3">
            <button
              onClick={() => {
                localStorage.setItem("animathix_user", JSON.stringify({ email: "user@google.com", name: "User" }));
                router.push("/create");
              }}
              className="w-full border border-cyan/8 py-3 text-sm text-text-dim
                         hover:border-cyan/20 hover:text-text transition-all cursor-pointer"
            >
              Continue with Google
            </button>
          </div>

          <p className="text-center mt-8 text-text-dim text-sm">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-cyan hover:text-cyan-glow transition-colors cursor-pointer"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>

          <Link
            href="/"
            className="block text-center mt-4 text-text-dim/30 text-xs hover:text-text-dim transition-colors"
          >
            &larr; Back to home
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
