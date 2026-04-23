import { test, expect } from '@playwright/test';
import { login, testUsers } from '../helpers/auth';
import { waitForLoading } from '../helpers/waitFor';

// The "Milk" global item is seeded with searchNames: ["mleko", "mléko", "leche"].
// These tests verify diacritic- and case-insensitive matching against searchNames.
test.describe('Items — diacritic-insensitive search', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.jan);
    await page.goto('/items');
    await waitForLoading(page);
  });

  test('matches a searchName with original diacritics', async ({ page }) => {
    const search = page.locator('input[type="search"], input[placeholder*="earch" i]').first();
    await search.fill('mléko');
    await expect(page.getByText(/^Milk$/).first()).toBeVisible({ timeout: 5000 });
  });

  test('matches a searchName typed without diacritics', async ({ page }) => {
    const search = page.locator('input[type="search"], input[placeholder*="earch" i]').first();
    await search.fill('mleko');
    await expect(page.getByText(/^Milk$/).first()).toBeVisible({ timeout: 5000 });
  });

  test('matches a searchName in a different alphabet (case-insensitive)', async ({ page }) => {
    const search = page.locator('input[type="search"], input[placeholder*="earch" i]').first();
    await search.fill('LECHE');
    await expect(page.getByText(/^Milk$/).first()).toBeVisible({ timeout: 5000 });
  });
});
