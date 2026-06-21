// Ukrainian date formatting via the platform Intl APIs (full ICU is available
// in both Node and the Cloudflare Workers runtime).

const LONG_DATE = new Intl.DateTimeFormat('uk-UA', {
  timeZone: 'UTC',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * Format an ISO date (YYYY-MM-DD) as a long Ukrainian date: "26 грудня 2024 р.".
 * Non-ISO or invalid input is returned unchanged so callers can pass through
 * pre-formatted strings.
 */
export function formatUaDateLong(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return LONG_DATE.format(date);
}
