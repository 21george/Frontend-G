import { Page } from '@playwright/test';

export async function loginAsCoach(page: Page, email?: string, password?: string) {
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', email || `testcoach_${Date.now()}@example.com`);
  await page.fill('input[placeholder*="Password" i]', password || 'TestPass123!');
  await page.click('button:has-text("Sign in")');
}
