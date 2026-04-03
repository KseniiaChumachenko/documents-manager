import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { fetchFromAdmTools } from '../adm-tools';

describe('fetchFromAdmTools', () => {
  const mockApiBase = 'https://api.example.com';

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null when API returns non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 404 }));

    const result = await fetchFromAdmTools('12345678', mockApiBase);
    expect(result).toBeNull();
  });

  it('returns null when XML contains error', async () => {
    const errorXml = '<?xml version="1.0" encoding="windows-1251"?><error>Not found</error>';
    const encoder = new TextEncoder();
    const windows1251Encoded = encoder.encode(errorXml);

    vi.mocked(fetch).mockResolvedValueOnce(new Response(windows1251Encoded, { status: 200 }));

    const result = await fetchFromAdmTools('99999999', mockApiBase);
    expect(result).toBeNull();
  });

  it('parses valid XML response correctly', async () => {
    const validXml = `<?xml version="1.0" encoding="windows-1251"?>
      <export>
        <company>
          <egrpou>12345678</egrpou>
          <name>ТОВ Тестова Компанія</name>
          <name_short>Тестова</name_short>
          <address>м. Київ, вул. Тестова, 1</address>
          <director>Іванов Іван Іванович</director>
          <director_gen>Іванова Івана Івановича</director_gen>
          <kved>Тестова діяльність</kved>
          <kved_number>62.01</kved_number>
          <inn>123456789012</inn>
          <inn_date>2020-01-01</inn_date>
        </company>
      </export>`;

    const encoder = new TextEncoder();
    const encoded = encoder.encode(validXml);

    vi.mocked(fetch).mockResolvedValueOnce(new Response(encoded, { status: 200 }));

    const result = await fetchFromAdmTools('12345678', mockApiBase);

    expect(result).not.toBeNull();
    expect(result?.egrpou).toBe('12345678');
    expect(result?.name).toBe('ТОВ Тестова Компанія');
    expect(result?.name_short).toBe('Тестова');
    expect(result?.address).toBe('м. Київ, вул. Тестова, 1');
    expect(result?.director).toBe('Іванов Іван Іванович');
    expect(result?.director_gen).toBe('Іванова Івана Івановича');
    expect(result?.kved).toBe('Тестова діяльність');
    expect(result?.kved_number).toBe('62.01');
    expect(result?.inn).toBe('123456789012');
    expect(result?.inn_date).toBe('2020-01-01');
  });

  it('calls API with correct URL', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 404 }));

    await fetchFromAdmTools('12345678', mockApiBase);

    expect(fetch).toHaveBeenCalledWith(`${mockApiBase}?egrpou=12345678`);
  });
});
