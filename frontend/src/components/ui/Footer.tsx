"use client";

import Link from "next/link";

const footerLinks = [
    {
        title: "Product",
        links: [
            { label: "Create Video", href: "/create" },
            { label: "How It Works", href: "/#how-it-works" },
        ],
    },
    {
        title: "Resources",
        links: [
            { label: "Documentation", href: "#" },
            { label: "API", href: "#" },
        ],
    },
    {
        title: "Company",
        links: [
            { label: "About", href: "#" },
            { label: "GitHub", href: "#" },
        ],
    },
];

export default function Footer() {
    return (
        <footer className="border-t border-border/50 bg-cream-dark">
            <div className="mx-auto max-w-6xl px-6 py-12 md:px-10">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <Link href="/" className="heading-editorial text-lg">Animathix</Link>
                        <p className="mt-3 text-sm leading-relaxed text-text-muted max-w-[200px]">
                            Cinematic mathematical explanation.
                        </p>
                    </div>

                    {footerLinks.map((col) => (
                        <div key={col.title}>
                            <p className="text-xs font-medium tracking-wider uppercase text-text-secondary mb-3">
                                {col.title}
                            </p>
                            <ul className="space-y-2">
                                {col.links.map((link) => (
                                    <li key={link.label}>
                                        <Link href={link.href} className="text-sm text-text-muted hover:text-charcoal transition-colors">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-10 pt-6 border-t border-border flex items-center justify-between">
                    <p className="text-text-muted text-xs">(c) {new Date().getFullYear()} Animathix</p>
                </div>
            </div>
        </footer>
    );
}
