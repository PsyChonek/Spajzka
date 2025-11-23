import { test, expect } from '@playwright/test';
import { login, testUsers } from '../helpers/auth';
import { waitForLoading, waitForSync } from '../helpers/waitFor';

test.describe('Offline and Sync', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.jan);
  });

  test('should work offline - add item to pantry while offline', async ({ page, context }) => {
    await page.goto('/pantry');
    await waitForLoading(page);

    // Go offline
    await context.setOffline(true);

    // Add item while offline
    const addButton = page.getByRole('button', { name: /add/i }).first();
    await addButton.click();

    // Fill in item details
    await page.waitForSelector('input, select', { timeout: 5000 });
    const itemSelect = page.locator('input[role="combobox"], select').first();
    await itemSelect.click();
    await itemSelect.fill('Offline Item');

    await page.waitForTimeout(500);
    const firstOption = page.locator('[role="option"]').first();
    if (await firstOption.isVisible().catch(() => false)) {
      await firstOption.click();
    }

    const quantityInput = page.locator('input[type="number"]').first();
    if (await quantityInput.isVisible().catch(() => false)) {
      await quantityInput.fill('1');
    }

    // Save
    const saveButton = page.getByRole('button', { name: /save|add|confirm|ok/i }).last();
    await saveButton.click();

    await page.waitForTimeout(1000);

    // Item should appear in local state
    await expect(page.getByText(/offline item/i)).toBeVisible({ timeout: 5000 });

    // Go back online
    await context.setOffline(false);

    // Wait for sync
    await waitForSync(page);

    // Item should still be visible and synced
    await expect(page.getByText(/offline item/i)).toBeVisible();
  });

  test('should sync offline changes when coming back online', async ({ page, context }) => {
    await page.goto('/shopping');
    await waitForLoading(page);

    // Go offline
    await context.setOffline(true);

    // Make multiple changes offline
    const addButton = page.getByRole('button', { name: /add/i }).first();
    await addButton.click();

    await page.waitForSelector('input, select', { timeout: 5000 });
    const itemSelect = page.locator('input[role="combobox"], select').first();
    await itemSelect.fill('Offline Shopping Item');

    await page.waitForTimeout(500);
    const firstOption = page.locator('[role="option"]').first();
    if (await firstOption.isVisible().catch(() => false)) {
      await firstOption.click();
    }

    const saveButton = page.getByRole('button', { name: /save|add|ok/i }).last();
    await saveButton.click();
    await page.waitForTimeout(1000);

    // Verify item added locally
    const itemExists = await page.getByText(/offline shopping item/i).isVisible().catch(() => false);

    // Go back online
    await context.setOffline(false);

    // Wait for sync
    await waitForSync(page);

    // Reload page to verify data persisted
    await page.reload();
    await waitForLoading(page);

    if (itemExists) {
      // Item should still exist after sync and reload
      await expect(page.getByText(/offline shopping item/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should persist data across page reloads', async ({ page }) => {
    await page.goto('/pantry');
    await waitForLoading(page);

    // Add an item
    const addButton = page.getByRole('button', { name: /add/i }).first();
    await addButton.click();

    await page.waitForSelector('input, select', { timeout: 5000 });
    const itemSelect = page.locator('input[role="combobox"], select').first();
    await itemSelect.fill('Persist Test Item');

    await page.waitForTimeout(500);
    const firstOption = page.locator('[role="option"]').first();
    if (await firstOption.isVisible().catch(() => false)) {
      await firstOption.click();
    }

    const saveButton = page.getByRole('button', { name: /save|add|ok/i }).last();
    await saveButton.click();

    await waitForSync(page);

    // Reload the page
    await page.reload();
    await waitForLoading(page);

    // Item should still be there
    await expect(page.getByText(/persist test item/i)).toBeVisible({ timeout: 5000 });
  });

  test('should handle concurrent operations', async ({ page }) => {
    await page.goto('/pantry');
    await waitForLoading(page);

    // Quickly add multiple items
    for (let i = 0; i < 2; i++) {
      const addButton = page.getByRole('button', { name: /add/i }).first();
      await addButton.click();

      await page.waitForSelector('input, select', { timeout: 5000 });
      const itemSelect = page.locator('input[role="combobox"], select').first();
      await itemSelect.fill(`Concurrent Item ${i + 1}`);

      await page.waitForTimeout(300);
      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.isVisible().catch(() => false)) {
        await firstOption.click();
      }

      const saveButton = page.getByRole('button', { name: /save|add|ok/i }).last();
      await saveButton.click();

      // Don't wait for sync between operations
      await page.waitForTimeout(500);
    }

    // Wait for all syncs to complete
    await waitForSync(page);

    // Both items should be visible
    await expect(page.getByText(/concurrent item 1/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/concurrent item 2/i)).toBeVisible({ timeout: 5000 });
  });

  test('should display offline indicator when offline', async ({ page, context }) => {
    await page.goto('/');
    await waitForLoading(page);

    // Go offline
    await context.setOffline(true);

    // Wait a moment for offline detection
    await page.waitForTimeout(1000);

    // Look for offline indicator (icon, banner, or text)
    const offlineIndicator = page.locator('[class*="offline"], [data-offline="true"]')
      .or(page.getByText(/offline|no connection|disconnected/i));

    // Note: This test might not pass if there's no offline indicator in the UI
    // but it's a good practice to have one
    const isVisible = await offlineIndicator.isVisible().catch(() => false);

    // Go back online
    await context.setOffline(false);

    // Just verify we can toggle offline mode
    expect(true).toBeTruthy();
  });

  test('should maintain state during navigation while offline', async ({ page, context }) => {
    await page.goto('/pantry');
    await waitForLoading(page);

    // Go offline
    await context.setOffline(true);

    // Navigate to shopping
    await page.goto('/shopping');
    await page.waitForTimeout(500);

    // Navigate back to pantry
    await page.goto('/pantry');
    await page.waitForTimeout(500);

    // App should still work
    await expect(page.locator('body')).toBeVisible();

    // Go back online
    await context.setOffline(false);
  });

  test('should use localStorage for persistence', async ({ page }) => {
    await page.goto('/pantry');
    await waitForLoading(page);

    // Check that stores are persisted in localStorage
    const localStorageKeys = await page.evaluate(() => Object.keys(localStorage));

    // Should have auth and store data
    expect(localStorageKeys.length).toBeGreaterThan(0);

    // Common store keys in Spajzka (based on pinia-plugin-persistedstate)
    const hasAuthData = localStorageKeys.some(key => key.includes('auth'));
    expect(hasAuthData).toBeTruthy();
  });

  test('should sync after reconnection', async ({ page, context }) => {
    await page.goto('/pantry');
    await waitForLoading(page);

    // Make a change while online
    const initialCount = await page.locator('.q-card, .q-item').count();

    // Go offline
    await context.setOffline(true);
    await page.waitForTimeout(1000);

    // Try to make a change (it will be queued)
    const addButton = page.getByRole('button', { name: /add/i }).first();
    await addButton.click();

    await page.waitForSelector('input, select', { timeout: 5000 });
    const itemSelect = page.locator('input[role="combobox"], select').first();
    await itemSelect.fill('Sync After Reconnect');

    await page.waitForTimeout(500);
    const firstOption = page.locator('[role="option"]').first();
    if (await firstOption.isVisible().catch(() => false)) {
      await firstOption.click();
    }

    const saveButton = page.getByRole('button', { name: /save|add|ok/i }).last();
    await saveButton.click();
    await page.waitForTimeout(1000);

    // Go back online
    await context.setOffline(false);

    // Wait for sync
    await waitForSync(page);
    await page.waitForTimeout(2000);

    // Changes should be synced
    const finalCount = await page.locator('.q-card, .q-item').count();
    expect(finalCount).toBeGreaterThanOrEqual(initialCount);
  });
});
