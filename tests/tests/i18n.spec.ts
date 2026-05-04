import { test, expect, request } from '@playwright/test';

const API_URL = 'http://localhost:3000';

// Provision an anonymous user via the REST API and inject the token + user
// into localStorage so the web app picks it up on next load. This avoids the
// login form (which has its own strict-mode quirks) and isolates this spec
// to the language-preference behaviour.
async function injectAnonymousAuth(page: import('@playwright/test').Page) {
  const ctx = await request.newContext();
  const r = await ctx.post(`${API_URL}/api/auth/anonymous`);
  expect(r.ok()).toBeTruthy();
  const { token, user } = await r.json();

  await page.goto('/');
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth', JSON.stringify({ token, user }));
  }, { token, user });
  return { token, user };
}

test.describe('i18n - language preferences', () => {
  test('Profile shows interface + items language pickers', async ({ page }) => {
    await injectAnonymousAuth(page);
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('interface-language-select')).toBeVisible();
    await expect(page.getByTestId('items-language-select')).toBeVisible();
  });

  test('switching interface language flips nav strings live', async ({ page }) => {
    await injectAnonymousAuth(page);
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Switch to English
    await page.getByTestId('interface-language-select').click();
    await page.getByRole('option', { name: 'English' }).click();
    await expect.poll(async () => {
      return await page.evaluate(() => {
        const root = document.querySelector('header');
        return root?.textContent ?? '';
      });
    }, { timeout: 5000 }).toContain('Home');

    // Switch to Czech
    await page.getByTestId('interface-language-select').click();
    await page.waitForTimeout(400);
    await page.getByRole('option', { name: 'Čeština' }).click();
    await expect.poll(async () => {
      return await page.evaluate(() => {
        const root = document.querySelector('header');
        return root?.textContent ?? '';
      });
    }, { timeout: 5000 }).toContain('Domů');
  });

  test('items language preference persists via API', async ({ page }) => {
    const { token } = await injectAnonymousAuth(page);

    const reqPromise = page.waitForRequest(
      (req) => req.url().includes('/api/auth/profile') && req.method() === 'PUT',
      { timeout: 10000 }
    );
    const respPromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/auth/profile') && resp.request().method() === 'PUT',
      { timeout: 10000 }
    );

    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('items-language-select').click();
    await page.getByRole('option', { name: 'English' }).click();

    const r = await reqPromise;
    const resp = await respPromise;
    expect(r.postDataJSON()).toEqual({ itemsLanguage: 'en' });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.itemsLanguage).toBe('en');
  });
});
