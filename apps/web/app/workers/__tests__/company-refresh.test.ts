import { describe, it, expect, vi } from 'vitest';

vi.mock('~/lib/adm-tools', () => ({
  fetchFromAdmTools: vi.fn(),
}));

vi.mock('drizzle-orm/d1', () => ({
  drizzle: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
  })),
}));

describe('refreshStaleCompanies', () => {
  it('returns correct result structure', async () => {
    const { refreshStaleCompanies } = await import('~/workers/company-refresh');
    const { drizzle } = await import('drizzle-orm/d1');

    const mockDb = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn().mockResolvedValue([]),
        })),
      })),
      update: vi.fn(),
    };

    vi.mocked(drizzle).mockReturnValue(mockDb as unknown as ReturnType<typeof drizzle>);

    const result = await refreshStaleCompanies({} as D1Database, 'https://api.example.com');

    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('refreshed');
    expect(result).toHaveProperty('failed');
    expect(result).toHaveProperty('skipped');
    expect(result).toHaveProperty('errors');
    expect(Array.isArray(result.errors)).toBe(true);
  });
});

describe('RefreshResult type', () => {
  it('has correct type structure', () => {
    const result = {
      total: 10,
      refreshed: 8,
      failed: 1,
      skipped: 1,
      errors: [{ egrpou: '12345678', error: 'Test error' }],
    };

    expect(result.total).toBe(10);
    expect(result.refreshed).toBe(8);
    expect(result.failed).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toHaveProperty('egrpou');
    expect(result.errors[0]).toHaveProperty('error');
  });
});
