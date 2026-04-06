"use client";

import Link from "next/link";

export default function Navbar() {
    return (
        <nav className="sticky top-0 z-50 w-full border-b border-bronze/10 bg-cream/80 backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 md:px-10">
                <Link href="/" className="heading-editorial text-xl">
                    Animathix
                </Link>

                <div className="flex items-center gap-6">
                    <Link href="/login" className="text-text-secondary text-sm hover:text-charcoal transition-colors">
                        Sign In
                    </Link>
                    <Link href="/login" className="btn-primary text-sm py-2.5 px-5">
                        Open Studio
                    </Link>
                </div>
            </div>
        </nav>
    );
}
