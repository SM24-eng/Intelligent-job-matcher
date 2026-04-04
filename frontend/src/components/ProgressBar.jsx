export default function ProgressBar({ value }) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/15">
      <div
        className="h-full rounded-full bg-gradient-to-r from-sky-300 to-cyan-200 transition-all duration-500"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
