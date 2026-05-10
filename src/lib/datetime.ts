const SWISS_MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

/** e.g. '10 MAY 26' — uses the viewer's local calendar from the instant. */
export function formatSwissDate(isoOrDate: string | Date): string {
  const d =
    typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  const day = d.getDate();
  const mon = SWISS_MONTHS[d.getMonth()];
  const yy = String(d.getFullYear()).slice(-2);
  return `${day} ${mon} ${yy}`;
}

/**
 * UTC ISO bounds for the local calendar day of `reference` (browser timezone).
 * Use with timestamptz columns: gte(startIso), lte(endIso).
 */
export function localCalendarDayUtcIsoRange(reference: Date = new Date()) {
  const y = reference.getFullYear();
  const m = reference.getMonth();
  const d = reference.getDate();
  const start = new Date(y, m, d, 0, 0, 0, 0);
  const end = new Date(y, m, d, 23, 59, 59, 999);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}
