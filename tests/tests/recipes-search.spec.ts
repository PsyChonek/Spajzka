import { test, expect } from '@playwright/test';
import { login, testUsers } from '../helpers/auth';
import { waitForLoading } from '../helpers/waitFor';

// The "Pancakes" global recipe is seeded with searchNames: ["palačinky", "lívance"].
// These tests verify diacritic-insensitive matching on recipe searchNames.
test.describe('Recipes — diacritic-insensitive search', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.jan);
    await page.goto('/recipes');
    await waitForLoading(page);
  });

  test('matches a Czech searchName with diacritics', async ({ page }) => {
    const search = page.locator('input[placeholder*="earch" i]').first();
    await search.fill('palačinky');
    await expect(page.getByText(/^Pancakes$/).first()).toBeVisible({ timeout: 5000 });
  });

  test('matches the same searchName typed without diacritics', async ({ page }) => {
    const search = page.locator('input[placeholder*="earch" i]').first();
    await search.fill('palacinky');
    await expect(page.getByText(/^Pancakes$/).first()).toBeVisible({ timeout: 5000 });
  });
});
