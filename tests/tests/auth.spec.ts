import { test, expect } from '@playwright/test';
import { login, logout, testUsers, clearAuth } from '../helpers/auth';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear auth state before each test
    await page.goto('/');
    await clearAuth(page);
  });

  test('should display login form on profile page for anonymous users', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Check for login form elements (app uses anonymous auth, so login is on profile page)
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^login$|^sign in$/i })).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await login(page, testUsers.jan);

    // Verify auth token is stored
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();

    // Verify user info is available in the store
    const userData = await page.evaluate(() => {
      const authData = localStorage.getItem('auth');
      return authData ? JSON.parse(authData) : null;
    });
    expect(userData).toBeTruthy();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Try to login with invalid credentials
    await page.locator('input[type="email"]').first().fill('invalid@example.com');
    await page.locator('input[type="password"]').first().fill('wrongpassword');
    await page.getByRole('button', { name: /^login$|^sign in$/i }).click();

    // Wait for error notification
    await page.waitForSelector('.q-notification--negative, .q-notification[role="alert"]', {
      timeout: 5000
    });

    // User should still be anonymous (app creates anonymous users automatically)
    const userData = await page.evaluate(() => {
      const authData = localStorage.getItem('auth');
      return authData ? JSON.parse(authData) : null;
    });
    // Check if user is anonymous
    expect(userData?.user?.isAnonymous).toBeTruthy();
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await login(page, testUsers.jan);

    // Get token before logout
    const tokenBefore = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(tokenBefore).toBeTruthy();

    // Then logout
    await logout(page);

    // After logout, app creates anonymous user, so token changes (not cleared)
    const tokenAfter = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(tokenAfter).toBeTruthy(); // Still has token (for anonymous user)
    expect(tokenAfter).not.toBe(tokenBefore); // But it's a different token

    // Verify user is now anonymous
    const userData = await page.evaluate(() => {
      const authData = localStorage.getItem('auth');
      return authData ? JSON.parse(authData) : null;
    });
    expect(userData?.user?.isAnonymous).toBeTruthy();
  });

  test('should persist authentication on page reload', async ({ page }) => {
    await login(page, testUsers.jan);

    // Get the token
    const tokenBefore = await page.evaluate(() => localStorage.getItem('auth_token'));

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify token is still there
    const tokenAfter = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(tokenAfter).toBe(tokenBefore);

    // Verify user is still authenticated (not anonymous)
    const userData = await page.evaluate(() => {
      const authData = localStorage.getItem('auth');
      return authData ? JSON.parse(authData) : null;
    });
    expect(userData?.user?.isAnonymous).toBeFalsy();
  });

  test('should allow access to all routes with anonymous user', async ({ page }) => {
    // App uses anonymous authentication - all routes are accessible
    await page.goto('/pantry');
    await page.waitForLoadState('networkidle');

    // Should be on pantry page (no redirect to login)
    await expect(page).toHaveURL('/pantry');

    // User should have an anonymous session
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();
  });

  test('should allow access to all routes when authenticated', async ({ page }) => {
    await login(page, testUsers.jan);

    // Navigate to any route
    await page.goto('/pantry');
    await page.waitForLoadState('networkidle');

    // Should be on pantry page
    await expect(page).toHaveURL('/pantry');

    // Verify user is authenticated (not anonymous)
    const userData = await page.evaluate(() => {
      const authData = localStorage.getItem('auth');
      return authData ? JSON.parse(authData) : null;
    });
    expect(userData?.user?.isAnonymous).toBeFalsy();
  });
});
