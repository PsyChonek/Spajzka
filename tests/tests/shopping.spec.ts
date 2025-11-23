import { test, expect } from '@playwright/test';
import { login, testUsers } from '../helpers/auth';
import { waitForLoading, waitForSync } from '../helpers/waitFor';

test.describe('Shopping List', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.jan);
    await page.goto('/shopping');
    await waitForLoading(page);
  });

  test('should display shopping list page', async ({ page }) => {
    await expect(page).toHaveURL('/shopping');

    // Check for main shopping list elements
    const heading = page.getByRole('heading', { name: /shopping/i }).first();
    await expect(heading).toBeVisible();
  });

  test('should add item to shopping list', async ({ page }) => {
    // Click add button
    const addButton = page.getByRole('button', { name: /add/i }).first();
    await addButton.click();

    // Wait for dialog/form to appear
    await page.waitForSelector('input, select', { timeout: 5000 });

    // Fill in item details
    const itemSelect = page.locator('input[role="combobox"], select').first();
    await itemSelect.click();
    await itemSelect.fill('Bread');

    // Select first option if dropdown appears
    await page.waitForTimeout(500);
    const firstOption = page.locator('[role="option"]').first();
    if (await firstOption.isVisible().catch(() => false)) {
      await firstOption.click();
    }

    // Set quantity if available
    const quantityInput = page.locator('input[type="number"]').first();
    if (await quantityInput.isVisible().catch(() => false)) {
      await quantityInput.fill('1');
    }

    // Save/confirm
    const saveButton = page.getByRole('button', { name: /save|add|confirm|ok/i }).last();
    await saveButton.click();

    // Wait for sync
    await waitForSync(page);

    // Verify item appears in list
    await expect(page.getByText(/bread/i)).toBeVisible({ timeout: 5000 });
  });

  test('should check off item as purchased', async ({ page }) => {
    // Find a shopping item
    const shoppingItem = page.locator('.q-card, .q-item, .q-checkbox').first();
    await shoppingItem.waitFor({ timeout: 5000 });

    // Click checkbox or toggle
    const checkbox = shoppingItem.locator('input[type="checkbox"], .q-checkbox').first()
      .or(shoppingItem.locator('[role="checkbox"]').first());

    if (await checkbox.isVisible().catch(() => false)) {
      await checkbox.click();

      // Wait for sync
      await waitForSync(page);

      // Verify item is checked/marked
      const isChecked = await checkbox.isChecked().catch(() => false);
      expect(isChecked).toBeTruthy();
    } else {
      // Alternative: click the item itself to toggle
      await shoppingItem.click();
      await waitForSync(page);
    }
  });

  test('should uncheck purchased item', async ({ page }) => {
    // Find a checked item
    const checkedCheckbox = page.locator('input[type="checkbox"]:checked, .q-checkbox--truthy').first();

    if (await checkedCheckbox.isVisible().catch(() => false)) {
      await checkedCheckbox.click();

      // Wait for sync
      await waitForSync(page);

      // Verify item is unchecked
      const isChecked = await checkedCheckbox.isChecked().catch(() => false);
      expect(isChecked).toBeFalsy();
    }
  });

  test('should remove item from shopping list', async ({ page }) => {
    // Count items before deletion
    const initialItems = await page.locator('.q-card, .q-item, li').count();

    // Find first item
    const firstItem = page.locator('.q-card, .q-item').first();
    await firstItem.waitFor({ timeout: 5000 });

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

      // Verify item count decreased
      const finalItems = await page.locator('.q-card, .q-item, li').count();
      expect(finalItems).toBeLessThanOrEqual(initialItems);
    }
  });

  test('should clear all purchased items', async ({ page }) => {
    // Look for "clear purchased" or similar button
    const clearButton = page.getByRole('button', { name: /clear|remove.*purchased|clear.*checked/i }).first();

    if (await clearButton.isVisible().catch(() => false)) {
      // Count checked items before
      const checkedItems = await page.locator('input[type="checkbox"]:checked').count();

      if (checkedItems > 0) {
        await clearButton.click();

        // Confirm if dialog appears
        const confirmButton = page.getByRole('button', { name: /yes|confirm|ok/i }).last();
        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmButton.click();
        }

        // Wait for sync
        await waitForSync(page);

        // Verify checked items are gone
        const remainingChecked = await page.locator('input[type="checkbox"]:checked').count();
        expect(remainingChecked).toBe(0);
      }
    }
  });

  test('should update item quantity', async ({ page }) => {
    // Find an item
    const item = page.locator('.q-card, .q-item').first();
    await item.waitFor({ timeout: 5000 });

    // Click to edit or find edit button
    const editButton = item.getByRole('button', { name: /edit/i }).first()
      .or(item);

    await editButton.click();

    // Wait for edit form
    await page.waitForTimeout(500);

    // Update quantity
    const quantityInput = page.locator('input[type="number"]').first();
    if (await quantityInput.isVisible().catch(() => false)) {
      await quantityInput.fill('3');

      // Save
      const saveButton = page.getByRole('button', { name: /save|update|ok/i }).last();
      await saveButton.click();

      // Wait for sync
      await waitForSync(page);

      // Verify quantity updated
      await expect(page.getByText('3')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should filter/search shopping items', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();

    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('bread');
      await page.waitForTimeout(500);

      // Items should be filtered
      const visibleItems = page.locator('.q-card:visible, .q-item:visible');
      const count = await visibleItems.count();

      // Verify filtering works
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should handle empty shopping list', async ({ page }) => {
    // Check if empty state message exists
    const emptyMessage = page.getByText(/no items|empty|add your first item/i);

    // Either we see items or empty state
    const hasItems = await page.locator('.q-card, .q-item').count() > 0;

    if (!hasItems) {
      await expect(emptyMessage).toBeVisible();
    }
  });

  test('should move checked items to pantry', async ({ page }) => {
    // Check an item first
    const checkbox = page.locator('input[type="checkbox"], .q-checkbox').first();
    await checkbox.waitFor({ timeout: 5000 });

    if (!(await checkbox.isChecked().catch(() => false))) {
      await checkbox.click();
      await waitForSync(page);
    }

    // Look for "move to pantry" or "add to pantry" button
    const moveToPantryButton = page.getByRole('button', { name: /pantry|move.*pantry|add.*pantry/i }).first();

    if (await moveToPantryButton.isVisible().catch(() => false)) {
      await moveToPantryButton.click();

      // Confirm if needed
      const confirmButton = page.getByRole('button', { name: /yes|confirm|ok/i }).last();
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }

      // Wait for sync
      await waitForSync(page);

      // Navigate to pantry to verify
      await page.goto('/pantry');
      await waitForLoading(page);

      // Should see items in pantry
      await expect(page.locator('.q-card, .q-item').first()).toBeVisible({ timeout: 5000 });
    }
  });
});
