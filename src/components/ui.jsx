/* Small shared building blocks for the review screen. */
import { AlertCircle, AlertTriangle } from "lucide-react";

const BUTTON_VARIANTS = {
  primary: "bg-ink text-paper px-3.5 py-2 text-[13.5px] rounded-lg active:scale-[0.98] transition-transform",
  secondary: "bg-white text-ink border border-line px-2.5 py-1.5 text-xs rounded-md hover:bg-soft transition-colors",
  danger: "bg-danger text-white px-2.5 py-1.5 text-xs rounded-md hover:opacity-90 transition-opacity",
};

export function Button({ variant = "secondary", className = "", ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-default ${BUTTON_VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

const INPUT = "text-ink bg-white border border-line rounded-md outline-none focus:ring-2 focus:ring-focus";

export function Field({ label, value, onChange, mono = false }) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="text-[11px] text-muted font-medium">{label}</span>
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-9 px-2.5 text-base sm:text-[13.5px] ${mono ? "font-mono" : ""} ${INPUT}`}
      />
    </label>
  );
}

export function MiniField({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-[11px] text-muted">{label}</span>
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={`w-20 h-[30px] px-2 text-right text-base sm:text-[12.5px] font-mono ${INPUT}`}
      />
    </label>
  );
}

export function TextArea({ value, onChange }) {
  return (
    <textarea
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full h-[70px] px-2.5 pt-2 text-base sm:text-[13.5px] resize-y ${INPUT}`}
    />
  );
}

export function Section({ title, action, children }) {
  return (
    <section className="mt-1">
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="font-serif text-[16.5px] font-semibold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function FlagRow({ level, children }) {
  const isError = level === "error";
  const Icon = isError ? AlertCircle : AlertTriangle;
  return (
    <div
      className={`flex items-start gap-2 px-3 py-2 rounded-lg text-[13px] leading-snug ${
        isError ? "bg-danger-bg text-danger" : "bg-warn-bg text-warn"
      }`}
    >
      <Icon size={15} className="shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}
