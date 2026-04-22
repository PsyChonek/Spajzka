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
 * The app uses anonymous authentication, so we need to go to /profile to login
 */
export async function login(page: Page, user: TestUser = testUsers.jan) {
  // Navigate to profile page where login form is located
  await page.goto('/profile');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Find the email input field (should be visible for anonymous users)
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.waitFor({ timeout: 5000 });

  // Fill in login credentials
  await emailInput.fill(user.email);
  await page.locator('input[type="password"]').first().fill(user.password);

  // Click login button (look for button with Login or Sign in text)
  await page.getByRole('button', { name: /^login$|^sign in$/i }).click();

  // Wait for login to complete
  await page.waitForLoadState('networkidle');

  // Give time for auth state to update
  await page.waitForTimeout(1000);

  // Verify we're logged in by checking localStorage
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  await expect(token).toBeTruthy();
}

/**
 * Logout helper function
 */
export async function logout(page: Page) {
  // Navigate to profile page if not already there
  await page.goto('/profile');
  await page.waitForLoadState('networkidle');

  // Click logout button
  const logoutButton = page.getByRole('button', { name: /logout|sign out/i }).first();
  await logoutButton.click();

  // Wait for logout to complete (app creates anonymous user automatically)
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
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
