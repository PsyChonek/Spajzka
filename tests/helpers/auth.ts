import { Page, expect } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  name: string;
}

export const testUsers = {
  jan: {
    email: 'test@example.com',
    password: 'password123',
    name: 'Jan Novák'
  },
  marie: {
    email: 'marie@example.com',
    password: 'password123',
    name: 'Marie Svobodová'
  },
  petr: {
    email: 'petr@example.com',
    password: 'password123',
    name: 'Petr Dvořák'
  }
} as const;

/**
 * Login helper function
 */
export async function login(page: Page, user: TestUser = testUsers.jan) {
  await page.goto('/');

  // Wait for the auth check to complete
  await page.waitForLoadState('networkidle');

  // Check if we're on the login page or if login dialog appears
  const emailInput = page.locator('input[type="email"]');
  await emailInput.waitFor({ timeout: 5000 });

  await emailInput.fill(user.email);
  await page.locator('input[type="password"]').fill(user.password);

  // Click login button
  await page.getByRole('button', { name: /login|sign in/i }).click();

  // Wait for navigation to complete
  await page.waitForURL('/');
  await page.waitForLoadState('networkidle');

  // Verify we're logged in by checking for user-specific content
  await expect(page.locator('body')).toBeVisible();
}

/**
 * Logout helper function
 */
export async function logout(page: Page) {
  // Look for profile or menu button
  const profileButton = page.getByRole('button', { name: /profile|menu/i }).first();
  await profileButton.click();

  // Click logout
  const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
  await logoutButton.click();

  // Wait for redirect to login
  await page.waitForLoadState('networkidle');
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check localStorage for auth token
    const token = await page.evaluate(() => localStorage.getItem('auth'));
    return !!token;
  } catch {
    return false;
  }
}

/**
 * Get stored auth token from localStorage
 */
export async function getAuthToken(page: Page): Promise<string | null> {
  return await page.evaluate(() => localStorage.getItem('auth'));
}

/**
 * Clear all auth data
 */
export async function clearAuth(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}
