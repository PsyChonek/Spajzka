# Spajzka E2E Tests

This directory contains end-to-end tests for the Spajzka application using [Playwright](https://playwright.dev/).

## Overview

The test suite covers:
- **Authentication** - Login, logout, session persistence
- **Pantry Management** - Add, edit, delete, filter pantry items
- **Shopping List** - Add, check off, remove shopping items
- **Recipes** - Create, edit, delete recipes and ingredients
- **Cook View** - Recipe discovery based on pantry items
- **Offline/Sync** - Offline-first functionality and data synchronization

## Project Structure

```
tests/
├── helpers/           # Test helper functions
│   ├── auth.ts       # Authentication utilities
│   ├── navigation.ts # Navigation helpers
│   └── waitFor.ts    # Wait utilities
├── tests/            # Test specs
│   ├── auth.spec.ts
│   ├── pantry.spec.ts
│   ├── shopping.spec.ts
│   ├── recipes.spec.ts
│   └── offline-sync.spec.ts
├── playwright.config.ts
└── package.json
```

## Prerequisites

1. **Install dependencies** (from the tests directory):
   ```bash
   npm install
   ```

2. **Install Playwright browsers**:
   ```bash
   npx playwright install
   ```

3. **Ensure the application is running**:
   - The tests are configured to automatically start the dev server
   - Or manually start: `npm run dev` from the root directory

## Running Tests

### From Root Directory

Run all tests:
```bash
npm test
```

Run tests with UI mode (recommended for development):
```bash
npm run test:ui
```

Run tests in headed mode (see the browser):
```bash
npm run test:headed
```

Debug tests:
```bash
npm run test:debug
```

### Specific Browser Tests

```bash
npm run test:chromium   # Chrome/Chromium only
npm run test:firefox    # Firefox only
npm run test:webkit     # Safari/WebKit only
npm run test:mobile     # Mobile browsers (Chrome & Safari)
```

### Specific Test Suites

```bash
npm run test:auth       # Authentication tests only
npm run test:pantry     # Pantry tests only
npm run test:shopping   # Shopping list tests only
npm run test:recipes    # Recipes tests only
npm run test:offline    # Offline/sync tests only
```

### View Test Report

```bash
npm run test:report
```

### From Tests Directory

You can also run tests directly from the `tests/` directory:

```bash
cd tests
npm test                # Run all tests
npm run test:ui         # UI mode
npx playwright test --grep "should login"  # Run specific test
```

## Test Configuration

The tests are configured in [playwright.config.ts](./playwright.config.ts):

- **Base URL**: `http://localhost:5173` (configurable via `BASE_URL` env var)
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Parallel Execution**: Enabled by default
- **Retries**: 2 retries on CI, 0 locally
- **Screenshots**: Captured on failure
- **Videos**: Retained on failure
- **Web Server**: Automatically starts the dev server before tests

## Writing Tests

### Using Helpers

Import and use the helper functions for common tasks:

```typescript
import { login, logout, testUsers } from '../helpers/auth';
import { waitForLoading, waitForSync } from '../helpers/waitFor';

test('my test', async ({ page }) => {
  // Login as test user
  await login(page, testUsers.jan);

  // Navigate and wait
  await page.goto('/pantry');
  await waitForLoading(page);

  // Your test code...
});
```

### Available Test Users

The following test users are available (from seed data):

```typescript
testUsers.jan    // test@example.com (system moderator)
testUsers.marie  // marie@example.com
testUsers.petr   // petr@example.com
```

All test users have the password: `password123`

### Common Patterns

**Adding an item:**
```typescript
const addButton = page.getByRole('button', { name: /add/i }).first();
await addButton.click();

const itemSelect = page.locator('input[role="combobox"]').first();
await itemSelect.fill('Milk');

const saveButton = page.getByRole('button', { name: /save|add/i }).last();
await saveButton.click();
await waitForSync(page);
```

**Testing offline functionality:**
```typescript
// Go offline
await context.setOffline(true);

// Make changes...

// Go back online
await context.setOffline(false);
await waitForSync(page);
```

## Test Data

Tests use the seeded database data from [db/seed/](../db/seed/):
- Users with known credentials
- Sample global items
- Groups and recipes (if seeded)

The database is initialized automatically when starting with Docker.

## CI/CD

The tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Install dependencies
  run: npm ci

- name: Install Playwright
  run: cd tests && npx playwright install --with-deps

- name: Run tests
  run: npm test

- name: Upload report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: tests/playwright-report/
```

## Debugging

### Debug Mode
Run tests in debug mode to step through:
```bash
npm run test:debug
```

### UI Mode
Use UI mode for interactive debugging:
```bash
npm run test:ui
```

### VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Playwright Debug",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test:debug"],
  "console": "integratedTerminal"
}
```

### Codegen
Generate tests by recording actions:
```bash
cd tests
npm run codegen
```

## Troubleshooting

**Tests fail to start the server:**
- Ensure ports 3000 and 5173 are available
- Check that `npm run dev` works from the root directory

**Authentication tests fail:**
- Verify the database is seeded with test users
- Run `npm run docker:db:init` to reinitialize the database

**Timeouts:**
- Increase timeout in config: `timeout: 60000` in playwright.config.ts
- Or per test: `test.setTimeout(60000)`

**Flaky tests:**
- Add more explicit waits: `await page.waitForLoadState('networkidle')`
- Use `waitForSync()` after state changes

## Best Practices

1. **Use test helpers** for common operations (login, navigation, etc.)
2. **Wait for state changes** using `waitForSync()` after mutations
3. **Use role-based selectors** when possible: `getByRole('button', { name: /add/i })`
4. **Avoid hard-coded waits** unless absolutely necessary
5. **Clean up after tests** if they create persistent data
6. **Test offline scenarios** to verify PWA functionality
7. **Use meaningful test descriptions** that explain the expected behavior

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Selectors Guide](https://playwright.dev/docs/selectors)
