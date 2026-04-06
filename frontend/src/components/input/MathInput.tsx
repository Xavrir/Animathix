"use client";

export default function MathInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="glass-card overflow-hidden">
      <label className="block section-label px-5 pt-5 pb-2">
        Your Math Question
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Explain the Pythagorean theorem with visual proof..."
        rows={5}
        className="w-full bg-transparent text-text px-5 pb-5 resize-none
                   placeholder:text-text-muted focus:outline-none text-base leading-relaxed"
      />
    </div>
  );
}
