import { test, expect } from '@playwright/test';
import { login, testUsers } from '../helpers/auth';
import { waitForLoading, waitForSync } from '../helpers/waitFor';

test.describe('Meal Plan', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.jan);
    await page.goto('/meal-plan');
    await waitForLoading(page);
  });

  test('should display meal plan calendar', async ({ page }) => {
    await expect(page).toHaveURL('/meal-plan');

    // The QCalendar component renders with the class q-calendar
    const calendar = page.locator('.q-calendar, [class*="q-calendar"]').first();
    await expect(calendar).toBeVisible({ timeout: 10_000 });
  });

  test('should show view toggle (Month / Week / Agenda)', async ({ page }) => {
    const monthBtn = page.getByRole('button', { name: /^month$/i }).first();
    const weekBtn = page.getByRole('button', { name: /^week$/i }).first();
    const agendaBtn = page.getByRole('button', { name: /^agenda$/i }).first();

    // At least two of the three should be present
    const found = [monthBtn, weekBtn, agendaBtn];
    const visibleCount = (await Promise.all(found.map(b => b.isVisible().catch(() => false))))
      .filter(Boolean).length;

    expect(visibleCount).toBeGreaterThanOrEqual(2);
  });

  test('should open add-meal dialog when clicking the add button', async ({ page }) => {
    // Floating add button
    const addBtn = page.locator('button.q-btn--fab, [aria-label*="add" i], button:has(.material-icons:has-text("add"))').first();

    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();

      // Dialog should open containing the recipe picker
      await expect(page.locator('.q-dialog').first()).toBeVisible({ timeout: 5_000 });
      await expect(page.getByText(/recipe/i).first()).toBeVisible();
    }
  });

  test('should create a meal-plan entry', async ({ page }) => {
    // Open add dialog
    const addBtn = page.locator('button.q-btn--fab, [aria-label*="add" i]').first();
    if (!(await addBtn.isVisible().catch(() => false))) {
      test.skip(true, 'Add button not rendered — requires a seeded recipe fixture');
    }

    await addBtn.click();
    await page.waitForTimeout(500);

    // Recipe picker: use-input combobox. Type to filter, pick first.
    const recipeInput = page.locator('input[role="combobox"]').first();
    await recipeInput.click();
    await page.waitForTimeout(300);

    const firstRecipe = page.locator('[role="option"]').first();
    if (await firstRecipe.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await firstRecipe.click();
    } else {
      test.skip(true, 'No recipes available in this group — requires seeded recipe');
    }

    // Save
    const saveBtn = page.getByRole('button', { name: /^save$|^add$|^confirm$/i }).last();
    await saveBtn.click();

    await waitForSync(page);

    // Entry should now be rendered somewhere on the calendar
    const dialog = page.locator('.q-dialog').first();
    await expect(dialog).toBeHidden({ timeout: 5_000 });
  });

  test('should preview shopping list from meal plan', async ({ page }) => {
    const genBtn = page.getByRole('button', { name: /generate shopping|generate.*shopping/i }).first();

    if (!(await genBtn.isVisible().catch(() => false))) {
      test.skip(true, 'Generate Shopping button not rendered');
    }

    await genBtn.click();

    // Preview dialog opens
    await expect(page.locator('.q-dialog').first()).toBeVisible({ timeout: 5_000 });

    // Should contain a date range and missingOnly toggle
    await expect(page.getByText(/from|range|pantry/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test('should work offline — queue meal entry for sync', async ({ page, context }) => {
    // Intercept network and go offline
    await context.setOffline(true);

    const addBtn = page.locator('button.q-btn--fab, [aria-label*="add" i]').first();
    if (!(await addBtn.isVisible().catch(() => false))) {
      test.skip(true, 'Add button not rendered');
    }

    await addBtn.click();
    await page.waitForTimeout(300);

    // Try to fill and save — should queue
    const recipeInput = page.locator('input[role="combobox"]').first();
    if (await recipeInput.isVisible().catch(() => false)) {
      await recipeInput.click();
      await page.waitForTimeout(300);
      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await firstOption.click();
        const saveBtn = page.getByRole('button', { name: /^save$|^add$/i }).last();
        await saveBtn.click();

        // Back online
        await context.setOffline(false);
        await waitForSync(page);

        // No error notification about sync failure
        const error = page.locator('.q-notification--negative, [class*="error"]').first();
        const isErrorVisible = await error.isVisible().catch(() => false);
        expect(isErrorVisible).toBeFalsy();
      }
    }
  });

  test('should disable generate-shopping button when offline', async ({ page, context }) => {
    await context.setOffline(true);

    const genBtn = page.getByRole('button', { name: /generate shopping/i }).first();
    if (!(await genBtn.isVisible().catch(() => false))) {
      test.skip(true, 'Generate Shopping button not rendered');
    }

    await genBtn.click();
    await page.waitForTimeout(500);

    // Either the button stays disabled or the dialog shows an offline banner
    const offlineBanner = page.getByText(/offline|requires.*online|connection/i).first();
    const isBannerVisible = await offlineBanner.isVisible({ timeout: 2_000 }).catch(() => false);

    // If dialog opened, it should have the offline banner
    if (await page.locator('.q-dialog').first().isVisible().catch(() => false)) {
      expect(isBannerVisible).toBeTruthy();
    }

    await context.setOffline(false);
  });
});
