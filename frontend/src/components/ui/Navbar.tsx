"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export default function Navbar() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => router.push("/"),
      },
    });
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-bronze/10 bg-cream/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 md:px-10">
        <Link href="/" className="heading-editorial text-xl">
          Animathix
        </Link>

        <div className="flex items-center gap-6">
          {isPending ? null : session ? (
            <>
              <span className="text-text-secondary text-sm">
                {session.user.name || session.user.email}
              </span>
              <Link href="/create" className="text-text-secondary text-sm hover:text-charcoal transition-colors">
                Studio
              </Link>
              <button
                onClick={handleSignOut}
                className="text-text-muted text-sm hover:text-charcoal transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-text-secondary text-sm hover:text-charcoal transition-colors">
                Sign In
              </Link>
              <Link href="/login" className="btn-primary text-sm py-2.5 px-5">
                Open Studio
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
