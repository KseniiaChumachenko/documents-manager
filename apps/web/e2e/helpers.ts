import type { Page } from '@playwright/test';

/**
 * Wait for React hydration to complete.
 * root.tsx sets data-hydrated="true" on <html> via useEffect after mount.
 * This is the most reliable signal that React has hydrated and event
 * listeners (including useFetcher Forms) are attached.
 */
export async function waitForHydration(page: Page) {
  await page.waitForSelector('html[data-hydrated="true"]', { timeout: 30000 });
}
