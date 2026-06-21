import { describe, expect, it } from 'vitest';

import { formatUaDateLong } from '../format-ua';

describe('formatUaDateLong', () => {
  it('matches reference invoice date (2024-12-26)', () => {
    expect(formatUaDateLong('2024-12-26')).toBe('26 грудня 2024 р.');
  });

  it('matches reference bill date (2025-02-26)', () => {
    expect(formatUaDateLong('2025-02-26')).toBe('26 лютого 2025 р.');
  });

  it('matches reference power-of-attorney date (2023-06-30)', () => {
    expect(formatUaDateLong('2023-06-30')).toBe('30 червня 2023 р.');
  });

  it('does not zero-pad the day', () => {
    expect(formatUaDateLong('2023-01-08')).toBe('8 січня 2023 р.');
  });

  it('returns the input unchanged when it is not an ISO date', () => {
    expect(formatUaDateLong('not-a-date')).toBe('not-a-date');
  });
});
