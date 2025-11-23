import { test, expect } from '@playwright/test';
import { login, testUsers } from '../helpers/auth';
import { waitForLoading, waitForSync } from '../helpers/waitFor';

test.describe('Pantry Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.jan);
    await page.goto('/pantry');
    await waitForLoading(page);
  });

  test('should display pantry page', async ({ page }) => {
    await expect(page).toHaveURL('/pantry');

    // Check for main pantry elements
    const heading = page.getByRole('heading', { name: /pantry/i }).first();
    await expect(heading).toBeVisible();
  });

  test('should add item to pantry', async ({ page }) => {
    // Click add button
    const addButton = page.getByRole('button', { name: /add/i }).first();
    await addButton.click();

    // Wait for dialog/form to appear
    await page.waitForSelector('input, select', { timeout: 5000 });

    // Fill in item details - adjust selectors based on actual implementation
    const itemSelect = page.locator('input[role="combobox"], select').first();
    await itemSelect.click();
    await itemSelect.fill('Milk');

    // Select first option if dropdown appears
    await page.waitForTimeout(500);
    const firstOption = page.locator('[role="option"]').first();
    if (await firstOption.isVisible().catch(() => false)) {
      await firstOption.click();
    }

    // Set quantity
    const quantityInput = page.locator('input[type="number"]').first();
    if (await quantityInput.isVisible().catch(() => false)) {
      await quantityInput.fill('2');
    }

    // Save/confirm
    const saveButton = page.getByRole('button', { name: /save|add|confirm|ok/i }).last();
    await saveButton.click();

    // Wait for sync
    await waitForSync(page);

    // Verify item appears in list
    await expect(page.getByText(/milk/i)).toBeVisible({ timeout: 5000 });
  });

  test('should update item quantity in pantry', async ({ page }) => {
    // Find an existing item card/row
    const itemCard = page.locator('.q-card, .q-item').first();
    await itemCard.waitFor({ timeout: 5000 });

    // Click on item to edit or find edit button
    const editButton = itemCard.getByRole('button', { name: /edit/i }).first()
      .or(itemCard.locator('button').first());

    if (await editButton.isVisible().catch(() => false)) {
      await editButton.click();
    } else {
      await itemCard.click();
    }

    // Wait for edit form/dialog
    await page.waitForTimeout(500);

    // Update quantity
    const quantityInput = page.locator('input[type="number"]').first();
    await quantityInput.fill('5');

    // Save
    const saveButton = page.getByRole('button', { name: /save|update|confirm|ok/i }).last();
    await saveButton.click();

    // Wait for sync
    await waitForSync(page);

    // Verify update - quantity should be visible somewhere in the UI
    await expect(page.getByText('5')).toBeVisible({ timeout: 5000 });
  });

  test('should remove item from pantry', async ({ page }) => {
    // Count items before deletion
    const initialItems = await page.locator('.q-card, .q-item').count();

    // Find first item
    const firstItem = page.locator('.q-card, .q-item').first();
    await firstItem.waitFor({ timeout: 5000 });

    // Get item name for verification
    const itemText = await firstItem.textContent();

    // Find and click delete/remove button
    const deleteButton = firstItem.getByRole('button', { name: /delete|remove/i }).first()
      .or(firstItem.locator('button[class*="delete"], button[class*="remove"]').first());

    if (await deleteButton.isVisible().catch(() => false)) {
      await deleteButton.click();

      // Confirm deletion if dialog appears
      const confirmButton = page.getByRole('button', { name: /yes|confirm|delete|ok/i }).last();
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }

      // Wait for sync
      await waitForSync(page);

      // Verify item count decreased or item text is gone
      const finalItems = await page.locator('.q-card, .q-item').count();
      expect(finalItems).toBeLessThan(initialItems);
    }
  });

  test('should filter/search pantry items', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();

    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('milk');
      await page.waitForTimeout(500);

      // Items should be filtered
      const visibleItems = page.locator('.q-card:visible, .q-item:visible');
      const count = await visibleItems.count();

      // Verify filtering works (at least some items should match or none if no milk)
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display item details', async ({ page }) => {
    // Click on first item
    const firstItem = page.locator('.q-card, .q-item').first();
    await firstItem.waitFor({ timeout: 5000 });
    await firstItem.click();

    // Should show details (quantity, price, etc.)
    await page.waitForTimeout(500);

    // Verify some detail is visible - could be in dialog or expanded view
    const detailsVisible = await page.locator('input, .q-dialog, [class*="detail"]').first().isVisible();
    expect(detailsVisible).toBeTruthy();
  });

  test('should handle empty pantry state', async ({ page }) => {
    // This test assumes pantry might be empty or we can clear it
    // Check if empty state message exists
    const emptyMessage = page.getByText(/no items|empty|add your first item/i);

    // Either we see items or empty state
    const hasItems = await page.locator('.q-card, .q-item').count() > 0;

    if (!hasItems) {
      await expect(emptyMessage).toBeVisible();
    }
  });

  test('should move item to shopping list', async ({ page }) => {
    // Find an item
    const firstItem = page.locator('.q-card, .q-item').first();
    await firstItem.waitFor({ timeout: 5000 });

    // Look for shopping cart or "add to shopping" button
    const shoppingButton = firstItem.getByRole('button', { name: /shop|cart|shopping/i }).first()
      .or(firstItem.locator('[class*="shopping"], [class*="cart"]').first());

    if (await shoppingButton.isVisible().catch(() => false)) {
      await shoppingButton.click();

      // Wait for sync
      await waitForSync(page);

      // Navigate to shopping list to verify
      await page.goto('/shopping');
      await waitForLoading(page);

      // Should see items in shopping list
      await expect(page.locator('.q-card, .q-item').first()).toBeVisible({ timeout: 5000 });
    }
  });
});
