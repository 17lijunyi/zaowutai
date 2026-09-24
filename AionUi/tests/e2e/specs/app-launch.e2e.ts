/**
 * App Launch – basic smoke tests.
 *
 * Verifies the Electron window opens, the renderer loads, and no
 * critical console errors are thrown on startup.
 */
import { test, expect } from '../fixtures';
import { createErrorCollector, waitForSettle } from '../helpers';
import { httpGet } from '../helpers/httpBridge';

test.describe('App Launch', () => {
  test('window opens and has a title', async ({ page }) => {
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('renderer loads successfully', async ({ page }) => {
    await page.waitForSelector('body', { state: 'visible' });
    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
  });

  test('no uncaught console errors on load', async ({ page }) => {
    const collector = createErrorCollector(page);
    await waitForSettle(page);
    expect(collector.critical()).toHaveLength(0);
  });

  test('packaged backend includes the custom model comparison routes', async ({ page }) => {
    await page.waitForFunction(() => (window as unknown as { __backendPort?: number }).__backendPort);
    const models = await httpGet<unknown>(page, '/api/model-bench/models');
    expect(Array.isArray(models)).toBe(true);
  });
});
