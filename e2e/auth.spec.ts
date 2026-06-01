import { test, expect } from '@playwright/test';

const TEST_EMAIL = `e2e_${Date.now()}@test.com`;

// Note: E2E tests require the backend and frontend dev servers to be running.
// Run with: npx playwright test

test.describe('Authentication', () => {
  test('coach can register and reach subscription selection', async ({ page }) => {
    await page.goto('/auth/register');
    await page.fill('input[name="name"]', 'E2E Test Coach');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[placeholder*="Password" i]', 'Password123!');
    await page.click('button:has-text("Sign up")');
    await expect(page).toHaveURL(/subscription\/select-plan|dashboard/, { timeout: 10000 });
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('text=Sign in')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});
