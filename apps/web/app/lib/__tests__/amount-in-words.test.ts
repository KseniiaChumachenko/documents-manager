import { describe, expect, it } from 'vitest';

import { hryvniaInWords, integerInWords } from '../amount-in-words';

describe('hryvniaInWords', () => {
  // Exact reproduction of the "сума прописом" line in the reference documents.
  it('matches РН-0000003 reference (5488.13)', () => {
    expect(hryvniaInWords(5488.13)).toBe(
      "П'ять тисяч чотириста вісімдесят вісім гривень 13 копійок"
    );
  });

  it('matches СФ-0000305 reference (7020.02)', () => {
    expect(hryvniaInWords(7020.02)).toBe('Сім тисяч двадцять гривень 02 копійки');
  });

  // Feminine gender agreement: гривня is feminine, so 1 → одна, 2 → дві.
  it('declines a single hryvnia (feminine)', () => {
    expect(hryvniaInWords(1)).toBe('Одна гривня 00 копійок');
  });

  it('declines two hryvnia (feminine)', () => {
    expect(hryvniaInWords(2)).toBe('Дві гривні 00 копійок');
  });

  it('declines twenty-one hryvnia (feminine units)', () => {
    expect(hryvniaInWords(21)).toBe('Двадцять одна гривня 00 копійок');
  });

  it('declines twenty-three hryvnia', () => {
    expect(hryvniaInWords(23)).toBe('Двадцять три гривні 00 копійок');
  });

  // Thousands: тисяча is feminine (одна тисяча, дві тисячі, п'ять тисяч).
  it('declines one thousand', () => {
    expect(hryvniaInWords(1000)).toBe('Одна тисяча гривень 00 копійок');
  });

  it('declines two thousand', () => {
    expect(hryvniaInWords(2000)).toBe('Дві тисячі гривень 00 копійок');
  });

  it('declines five thousand', () => {
    expect(hryvniaInWords(5000)).toBe("П'ять тисяч гривень 00 копійок");
  });

  it('handles hundreds', () => {
    expect(hryvniaInWords(488)).toBe('Чотириста вісімдесят вісім гривень 00 копійок');
  });

  it('handles zero', () => {
    expect(hryvniaInWords(0)).toBe('Нуль гривень 00 копійок');
  });

  // Kopecks: zero-padded two digits, with their own declension.
  it('declines a single kopeck', () => {
    expect(hryvniaInWords(0.01)).toBe('Нуль гривень 01 копійка');
  });

  it('declines kopecks in 2-4 range', () => {
    expect(hryvniaInWords(0.03)).toBe('Нуль гривень 03 копійки');
  });

  it('handles hundreds with thousands and feminine "few" hryvnia', () => {
    expect(hryvniaInWords(1234.5)).toBe('Одна тисяча двісті тридцять чотири гривні 50 копійок');
  });

  it('rounds up across the hryvnia boundary', () => {
    expect(hryvniaInWords(99.999)).toBe('Сто гривень 00 копійок');
  });
});

describe('integerInWords', () => {
  it('renders quantity in words (capitalised) for M-2 forms', () => {
    expect(integerInWords(1)).toBe('Один');
    expect(integerInWords(2)).toBe('Два');
    expect(integerInWords(12)).toBe('Дванадцять');
    expect(integerInWords(0)).toBe('Нуль');
  });

  it('supports feminine gender', () => {
    expect(integerInWords(1, true)).toBe('Одна');
    expect(integerInWords(2, true)).toBe('Дві');
  });
});
