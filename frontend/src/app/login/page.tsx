"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && session) {
      router.replace("/create");
    }
  }, [isPending, router, session]);

  async function handleGoogleSignIn() {
    setError(null);
    setLoading(true);

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/create",
        errorCallbackURL: "/login",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Google sign-in could not be started."
      );
      setLoading(false);
    }
  }

  if (isPending || session) {
    return null;
  }

  return (
    <main className="min-h-screen flex">
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
            Sign in with Google and keep your studio attached to one identity.
          </p>
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-paper">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden mb-10 text-center">
            <Link href="/" className="heading-editorial text-2xl">
              Animathix
            </Link>
          </div>

          <h1 className="heading-editorial text-2xl mb-1">Continue with Google</h1>
          <p className="text-text-secondary text-sm mb-8">
            Use your Google email to access your studio and create narrated math videos.
          </p>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="btn-primary w-full justify-center"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Redirecting...
              </span>
            ) : (
              <span className="inline-flex items-center gap-3">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                >
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.87c2.26-2.08 3.57-5.14 3.57-8.64Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.87-3c-1.07.72-2.44 1.15-4.08 1.15-3.14 0-5.8-2.12-6.75-4.96H1.25v3.09A12 12 0 0 0 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.25 14.28A7.2 7.2 0 0 1 4.87 12c0-.79.14-1.56.38-2.28V6.63H1.25A12 12 0 0 0 0 12c0 1.93.46 3.75 1.25 5.37l4-3.09Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.77c1.76 0 3.33.61 4.57 1.8l3.43-3.43C17.95 1.13 15.23 0 12 0A12 12 0 0 0 1.25 6.63l4 3.09c.95-2.84 3.61-4.95 6.75-4.95Z"
                  />
                </svg>
                Continue with Google
              </span>
            )}
          </button>

          {error && (
            <div className="mt-4 rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <Link
            href="/"
            className="block text-center mt-4 text-text-muted text-xs hover:text-text-secondary transition-colors"
          >
            &larr; Back to home
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
