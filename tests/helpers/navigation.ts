import { Page, expect } from '@playwright/test';

/**
 * Navigate to a page using the navigation menu
 */
export async function navigateTo(page: Page, pageName: 'Home' | 'Pantry' | 'Shopping' | 'Items' | 'Recipes' | 'Cook' | 'Groups' | 'Profile') {
  // Click on navigation item
  const navLink = page.getByRole('link', { name: new RegExp(pageName, 'i') }).first();
  await navLink.click();

  // Wait for navigation
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for the page to be ready
 */
export async function waitForPageReady(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Check if we're on the expected page
 */
export async function expectToBeOnPage(page: Page, path: string) {
  await expect(page).toHaveURL(new RegExp(path));
}
