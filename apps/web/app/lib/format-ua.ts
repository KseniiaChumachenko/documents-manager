// Ukrainian date/number formatting helpers used when rendering documents.

// Month names in the genitive case, as they appear in document titles
// ("26 Грудня 2024 р.").
const MONTHS_GENITIVE = [
  'Січня',
  'Лютого',
  'Березня',
  'Квітня',
  'Травня',
  'Червня',
  'Липня',
  'Серпня',
  'Вересня',
  'Жовтня',
  'Листопада',
  'Грудня',
];

/**
 * Format an ISO date (YYYY-MM-DD) as a long Ukrainian date: "26 Грудня 2024 р.".
 * Non-ISO input is returned unchanged so callers can pass through pre-formatted
 * reference strings.
 */
export function formatUaDateLong(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;

  const [, year, month, day] = match;
  const monthName = MONTHS_GENITIVE[Number(month) - 1];
  if (!monthName) return iso;

  return `${Number(day)} ${monthName} ${year} р.`;
}
