"use client";

import { ReactNode } from "react";

export default function DecoFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {/* Outer geometric corners */}
      <div className="absolute -top-px -left-px w-5 h-5 border-t-2 border-l-2 border-gold/50" />
      <div className="absolute -top-px -right-px w-5 h-5 border-t-2 border-r-2 border-gold/50" />
      <div className="absolute -bottom-px -left-px w-5 h-5 border-b-2 border-l-2 border-gold/50" />
      <div className="absolute -bottom-px -right-px w-5 h-5 border-b-2 border-r-2 border-gold/50" />

      {/* Inner diamond accents */}
      <div className="absolute top-1/2 -left-1.5 w-2.5 h-2.5 rotate-45 border border-gold/30 -translate-y-1/2" />
      <div className="absolute top-1/2 -right-1.5 w-2.5 h-2.5 rotate-45 border border-gold/30 -translate-y-1/2" />

      {/* Content with subtle border */}
      <div className="border border-gold/15 bg-navy-light/60 backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
}
