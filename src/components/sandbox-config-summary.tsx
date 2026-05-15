import type { ConfigSummary } from "@/lib/session-settings";

const SUMMARY_LINE_CLASS =
  "font-mono text-[10px] uppercase tracking-[0.2em] text-black dark:text-white";

export function SandboxConfigSummaryLines({
  summary,
  className = "",
}: {
  summary: ConfigSummary;
  className?: string;
}) {
  const [line1, line2, line3] = summary;

  return (
    <div className={`space-y-0.5 ${className}`.trim()}>
      <p className={SUMMARY_LINE_CLASS}>{line1}</p>
      {line2 ? <p className={SUMMARY_LINE_CLASS}>{line2}</p> : null}
      {line3 ? <p className={SUMMARY_LINE_CLASS}>{line3}</p> : null}
    </div>
  );
}
