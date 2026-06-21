import i18n from '~/i18n';

// Ukrainian currency amount → words ("сума прописом").
//   5488.13 → "П'ять тисяч чотириста вісімдесят вісім гривень 13 копійок"
// Spelling an integer out in words has no standard platform/library API, so the
// digit assembly is custom; the *plural noun* forms (гривня/гривні/гривень, …)
// are resolved through i18next, which selects the form via Intl.PluralRules.

const UNITS_MASCULINE = [
  '',
  'один',
  'два',
  'три',
  'чотири',
  "п'ять",
  'шість',
  'сім',
  'вісім',
  "дев'ять",
  'десять',
  'одинадцять',
  'дванадцять',
  'тринадцять',
  'чотирнадцять',
  "п'ятнадцять",
  'шістнадцять',
  'сімнадцять',
  'вісімнадцять',
  "дев'ятнадцять",
];

// Only 1 and 2 differ by gender in Ukrainian cardinals.
const UNITS_FEMININE = [...UNITS_MASCULINE];
UNITS_FEMININE[1] = 'одна';
UNITS_FEMININE[2] = 'дві';

const TENS = [
  '',
  '',
  'двадцять',
  'тридцять',
  'сорок',
  "п'ятдесят",
  'шістдесят',
  'сімдесят',
  'вісімдесят',
  "дев'яносто",
];

const HUNDREDS = [
  '',
  'сто',
  'двісті',
  'триста',
  'чотириста',
  "п'ятсот",
  'шістсот',
  'сімсот',
  'вісімсот',
  "дев'ятсот",
];

type CountedNoun = 'hryvnia' | 'kopeck' | 'thousand' | 'million';

/** Resolve the correct Ukrainian plural form of a noun for a count via i18next. */
function noun(name: CountedNoun, count: number): string {
  return i18n.t(name, { count, ns: 'document' });
}

/** Render a 0-999 group as words. Gender only affects the 1/2 units digit. */
function threeDigitsToWords(n: number, feminine: boolean): string[] {
  const words: string[] = [];
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (h > 0) words.push(HUNDREDS[h]);

  const units = feminine ? UNITS_FEMININE : UNITS_MASCULINE;
  if (rest < 20) {
    if (rest > 0) words.push(units[rest]);
  } else {
    const t = Math.floor(rest / 10);
    const u = rest % 10;
    words.push(TENS[t]);
    if (u > 0) words.push(units[u]);
  }
  return words;
}

function integerToWords(n: number): string[] {
  if (n === 0) return ['нуль'];

  const groups: string[] = [];

  const millions = Math.floor(n / 1_000_000) % 1000;
  const thousands = Math.floor(n / 1000) % 1000;
  const units = n % 1000;

  if (millions > 0) {
    groups.push(...threeDigitsToWords(millions, false), noun('million', millions));
  }
  if (thousands > 0) {
    groups.push(...threeDigitsToWords(thousands, true), noun('thousand', thousands));
  }
  if (units > 0) {
    groups.push(...threeDigitsToWords(units, true));
  }

  return groups;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Render a whole number as capitalised Ukrainian words (e.g. quantity "прописом"). */
export function integerInWords(n: number, feminine = false): string {
  if (n === 0) return 'Нуль';
  // Quantities are small in practice; render the 0-999 group with the requested
  // gender and fall back to the full integer formatter for larger values.
  const words = n < 1000 ? threeDigitsToWords(n, feminine) : integerToWords(n);
  return capitalize(words.join(' '));
}

/**
 * Convert a monetary amount in hryvnia to its Ukrainian wording.
 * @param amount value in hryvnia (e.g. 5488.13)
 */
export function hryvniaInWords(amount: number): string {
  const totalKopecks = Math.round(amount * 100);
  const hryvnia = Math.floor(totalKopecks / 100);
  const kopecks = totalKopecks % 100;

  const hryvniaWords = integerToWords(hryvnia).join(' ');
  const kopeckStr = String(kopecks).padStart(2, '0');

  return capitalize(
    `${hryvniaWords} ${noun('hryvnia', hryvnia)} ${kopeckStr} ${noun('kopeck', kopecks)}`
  );
}
