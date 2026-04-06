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
    setTimeout(() => {
      localStorage.setItem("animathix_user", JSON.stringify({ email, name: name || email.split("@")[0] }));
      router.push("/create");
    }, 800);
  }

  return (
    <main className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-cream-dark border-r border-border">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center px-12"
        >
          <div className="accent-rule mx-auto mb-6" />
          <h2 className="heading-editorial text-4xl mb-4">Animathix</h2>
          <p className="text-text-secondary text-lg leading-relaxed max-w-sm">
            Transform math into visual stories that teach with clarity.
          </p>
        </motion.div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-paper">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden mb-10 text-center">
            <Link href="/" className="heading-editorial text-2xl">Animathix</Link>
          </div>

          <h1 className="heading-editorial text-2xl mb-1">
            {isSignUp ? "Create an account" : "Welcome back"}
          </h1>
          <p className="text-text-secondary text-sm mb-8">
            {isSignUp ? "Start creating animated math videos" : "Sign in to continue creating"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-text-secondary text-xs tracking-wider uppercase mb-2">Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="input-field" />
              </div>
            )}
            <div>
              <label className="block text-text-secondary text-xs tracking-wider uppercase mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="input-field" />
            </div>
            <div>
              <label className="block text-text-secondary text-xs tracking-wider uppercase mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required className="input-field" />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  {isSignUp ? "Creating..." : "Signing in..."}
                </span>
              ) : isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-text-muted text-xs">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            onClick={() => {
              localStorage.setItem("animathix_user", JSON.stringify({ email: "user@google.com", name: "User" }));
              router.push("/create");
            }}
            className="btn-secondary w-full justify-center"
          >
            Continue with Google
          </button>

          <p className="text-center mt-8 text-text-secondary text-sm">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-olive hover:text-olive-dark transition-colors cursor-pointer font-medium">
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>

          <Link href="/" className="block text-center mt-4 text-text-muted text-xs hover:text-text-secondary transition-colors">
            &larr; Back to home
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
