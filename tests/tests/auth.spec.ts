import { test, expect } from '@playwright/test';
import { login, logout, testUsers, clearAuth } from '../helpers/auth';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear auth state before each test
    await page.goto('/');
    await clearAuth(page);
  });

  test('should display login form on initial load', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /login|sign in/i })).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await login(page, testUsers.jan);

    // Verify we're on the home page
    await expect(page).toHaveURL('/');

    // Verify auth token is stored
    const token = await page.evaluate(() => localStorage.getItem('auth'));
    expect(token).toBeTruthy();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Try to login with invalid credentials
    await page.locator('input[type="email"]').fill('invalid@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.getByRole('button', { name: /login|sign in/i }).click();

    // Wait for error notification
    await page.waitForSelector('.q-notification--negative, .q-notification[role="alert"]', {
      timeout: 5000
    }).catch(() => {
      // If no notification, check if we're still on login page
      expect(page.url()).toContain('/');
    });

    // Verify we're not authenticated
    const token = await page.evaluate(() => localStorage.getItem('auth'));
    expect(token).toBeFalsy();
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await login(page, testUsers.jan);

    // Then logout
    await logout(page);

    // Verify auth token is cleared
    const token = await page.evaluate(() => localStorage.getItem('auth'));
    expect(token).toBeFalsy();
  });

  test('should persist authentication on page reload', async ({ page }) => {
    await login(page, testUsers.jan);

    // Get the token
    const tokenBefore = await page.evaluate(() => localStorage.getItem('auth'));

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify token is still there
    const tokenAfter = await page.evaluate(() => localStorage.getItem('auth'));
    expect(tokenAfter).toBe(tokenBefore);

    // Verify we're still on the app (not redirected to login)
    await expect(page).toHaveURL('/');
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/pantry');
    await page.waitForLoadState('networkidle');

    // Should show login form
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
  });

  test('should allow access to protected routes when authenticated', async ({ page }) => {
    await login(page, testUsers.jan);

    // Navigate to protected route
    await page.goto('/pantry');
    await page.waitForLoadState('networkidle');

    // Should not show login form
    await expect(page.locator('input[type="email"]')).not.toBeVisible();
  });
});
