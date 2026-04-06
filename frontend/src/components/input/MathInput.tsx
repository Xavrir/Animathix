"use client";

export default function MathInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="relative">
      {/* Corner accents */}
      <div className="absolute -top-px -left-px w-4 h-4 border-t border-l border-cyan/30" />
      <div className="absolute -top-px -right-px w-4 h-4 border-t border-r border-cyan/30" />
      <div className="absolute -bottom-px -left-px w-4 h-4 border-b border-l border-cyan/30" />
      <div className="absolute -bottom-px -right-px w-4 h-4 border-b border-r border-cyan/30" />

      <div className="border border-cyan/10 bg-surface/60 backdrop-blur-sm">
        <label className="block text-cyan-dim text-xs tracking-[0.2em] uppercase px-5 pt-4 pb-2">
          Your Math Question
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Explain the Pythagorean theorem with visual proof..."
          rows={5}
          className="w-full bg-transparent text-text px-5 pb-5 resize-none
                     placeholder:text-text-dim/25 focus:outline-none text-base leading-relaxed"
        />
      </div>
    </div>
  );
}
