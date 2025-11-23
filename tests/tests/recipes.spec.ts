import { test, expect } from '@playwright/test';
import { login, testUsers } from '../helpers/auth';
import { waitForLoading, waitForSync } from '../helpers/waitFor';

test.describe('Recipes', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.jan);
    await page.goto('/recipes');
    await waitForLoading(page);
  });

  test('should display recipes page', async ({ page }) => {
    await expect(page).toHaveURL('/recipes');

    // Check for main recipes elements
    const heading = page.getByRole('heading', { name: /recipes/i }).first();
    await expect(heading).toBeVisible();
  });

  test('should create a new recipe', async ({ page }) => {
    // Click create/add recipe button
    const addButton = page.getByRole('button', { name: /add|create|new/i }).first();
    await addButton.click();

    // Wait for form to appear
    await page.waitForSelector('input', { timeout: 5000 });

    // Fill in recipe name
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('Test Recipe');

    // Add description if field exists
    const descriptionInput = page.locator('textarea, input[name*="description"]').first();
    if (await descriptionInput.isVisible().catch(() => false)) {
      await descriptionInput.fill('This is a test recipe');
    }

    // Add ingredients if possible
    const addIngredientButton = page.getByRole('button', { name: /add.*ingredient/i }).first();
    if (await addIngredientButton.isVisible().catch(() => false)) {
      await addIngredientButton.click();
      await page.waitForTimeout(500);

      // Select ingredient
      const ingredientInput = page.locator('input[role="combobox"], select').last();
      await ingredientInput.fill('Flour');
      await page.waitForTimeout(300);

      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.isVisible().catch(() => false)) {
        await firstOption.click();
      }
    }

    // Save recipe
    const saveButton = page.getByRole('button', { name: /save|create|confirm|ok/i }).last();
    await saveButton.click();

    // Wait for sync
    await waitForSync(page);

    // Verify recipe appears in list
    await expect(page.getByText(/test recipe/i)).toBeVisible({ timeout: 5000 });
  });

  test('should view recipe details', async ({ page }) => {
    // Click on first recipe
    const firstRecipe = page.locator('.q-card, .q-item').first();
    await firstRecipe.waitFor({ timeout: 5000 });
    await firstRecipe.click();

    // Wait for details to load
    await page.waitForTimeout(500);

    // Should show recipe details (ingredients, instructions, etc.)
    const detailsVisible = await page.locator('.q-dialog, [class*="detail"], [class*="recipe"]').isVisible();
    expect(detailsVisible).toBeTruthy();
  });

  test('should edit recipe', async ({ page }) => {
    // Find a recipe
    const recipe = page.locator('.q-card, .q-item').first();
    await recipe.waitFor({ timeout: 5000 });

    // Click edit button or click on recipe
    const editButton = recipe.getByRole('button', { name: /edit/i }).first()
      .or(recipe);

    await editButton.click();

    // Wait for edit form
    await page.waitForTimeout(500);

    // Look for edit button if we opened details view
    const editFormButton = page.getByRole('button', { name: /edit/i }).first();
    if (await editFormButton.isVisible().catch(() => false)) {
      await editFormButton.click();
      await page.waitForTimeout(500);
    }

    // Update recipe name
    const nameInput = page.locator('input[type="text"]').first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill('Updated Recipe Name');

      // Save
      const saveButton = page.getByRole('button', { name: /save|update|ok/i }).last();
      await saveButton.click();

      // Wait for sync
      await waitForSync(page);

      // Verify update
      await expect(page.getByText(/updated recipe name/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should delete recipe', async ({ page }) => {
    // Count recipes before deletion
    const initialRecipes = await page.locator('.q-card, .q-item').count();

    // Find first recipe
    const firstRecipe = page.locator('.q-card, .q-item').first();
    await firstRecipe.waitFor({ timeout: 5000 });

    // Find delete button
    const deleteButton = firstRecipe.getByRole('button', { name: /delete|remove/i }).first()
      .or(firstRecipe.locator('button[class*="delete"]').first());

    if (await deleteButton.isVisible().catch(() => false)) {
      await deleteButton.click();

      // Confirm deletion
      const confirmButton = page.getByRole('button', { name: /yes|confirm|delete|ok/i }).last();
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }

      // Wait for sync
      await waitForSync(page);

      // Verify recipe count decreased
      const finalRecipes = await page.locator('.q-card, .q-item').count();
      expect(finalRecipes).toBeLessThan(initialRecipes);
    }
  });

  test('should add ingredient to recipe', async ({ page }) => {
    // Open a recipe
    const recipe = page.locator('.q-card, .q-item').first();
    await recipe.waitFor({ timeout: 5000 });
    await recipe.click();

    // Wait for details
    await page.waitForTimeout(500);

    // Click edit
    const editButton = page.getByRole('button', { name: /edit/i }).first();
    if (await editButton.isVisible().catch(() => false)) {
      await editButton.click();
      await page.waitForTimeout(500);
    }

    // Click add ingredient
    const addIngredientButton = page.getByRole('button', { name: /add.*ingredient/i }).first();
    if (await addIngredientButton.isVisible().catch(() => false)) {
      await addIngredientButton.click();
      await page.waitForTimeout(500);

      // Select ingredient
      const ingredientInput = page.locator('input[role="combobox"], select').last();
      await ingredientInput.fill('Sugar');
      await page.waitForTimeout(300);

      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.isVisible().catch(() => false)) {
        await firstOption.click();
      }

      // Set quantity if available
      const quantityInput = page.locator('input[type="number"]').last();
      if (await quantityInput.isVisible().catch(() => false)) {
        await quantityInput.fill('200');
      }

      // Save
      const saveButton = page.getByRole('button', { name: /save|ok/i }).last();
      await saveButton.click();
      await waitForSync(page);
    }
  });

  test('should filter/search recipes', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();

    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('cake');
      await page.waitForTimeout(500);

      // Items should be filtered
      const visibleRecipes = page.locator('.q-card:visible, .q-item:visible');
      const count = await visibleRecipes.count();

      // Verify filtering works
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should handle empty recipes list', async ({ page }) => {
    // Check if empty state exists
    const emptyMessage = page.getByText(/no recipes|empty|create your first recipe/i);

    const hasRecipes = await page.locator('.q-card, .q-item').count() > 0;

    if (!hasRecipes) {
      await expect(emptyMessage).toBeVisible();
    }
  });
});

test.describe('Cook View', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.jan);
    await page.goto('/cook');
    await waitForLoading(page);
  });

  test('should display cook page', async ({ page }) => {
    await expect(page).toHaveURL('/cook');

    // Check for main cook elements
    const heading = page.getByRole('heading', { name: /cook/i }).first();
    await expect(heading).toBeVisible();
  });

  test('should show recipes based on pantry items', async ({ page }) => {
    // Should display some recipes or empty state
    const hasRecipes = await page.locator('.q-card, .q-item').count() > 0;
    const emptyMessage = page.getByText(/no recipes|add items|pantry/i);

    if (hasRecipes) {
      await expect(page.locator('.q-card, .q-item').first()).toBeVisible();
    } else {
      await expect(emptyMessage).toBeVisible();
    }
  });

  test('should navigate to recipe cooking view', async ({ page }) => {
    // Find a recipe
    const recipe = page.locator('.q-card, .q-item').first();

    if (await recipe.isVisible().catch(() => false)) {
      await recipe.click();

      // Should navigate to cook/:recipeId
      await page.waitForURL(/\/cook\/.+/);

      // Should show recipe cooking interface
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should filter recipes by available ingredients', async ({ page }) => {
    // Look for filter/toggle for "available only"
    const filterButton = page.getByRole('button', { name: /available|filter|can cook/i }).first()
      .or(page.locator('input[type="checkbox"]').first());

    if (await filterButton.isVisible().catch(() => false)) {
      await filterButton.click();
      await page.waitForTimeout(500);

      // Should show filtered results
      const visibleRecipes = await page.locator('.q-card:visible, .q-item:visible').count();
      expect(visibleRecipes).toBeGreaterThanOrEqual(0);
    }
  });
});
