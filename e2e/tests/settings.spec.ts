import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Sign in with Google \(Demo\)/i }).click();
  await expect(page.getByRole('button', { name: 'My books' })).toBeVisible();
}

test.describe('User Settings interactions', () => {
  test('toggle theme, change courses per page, change image size', async ({ page }) => {
    await login(page);

    // Open settings via user button (first name "Demo")
    await page.getByRole('button', { name: /Demo/i }).click();
    await expect(page.getByText('User Settings')).toBeVisible({ timeout: 10000 });

    // Toggle theme: label switches between Light mode / Dark mode
    const appearanceLabel = page.getByText(/Light mode|Dark mode/).first();
    const before = await appearanceLabel.textContent();
    await page.getByRole('switch').click();
    const after = await appearanceLabel.textContent();
    expect(before).not.toEqual(after);

    // Courses per page: set to 100 and verify visual state then to 50
    const btn100 = page.getByRole('button', { name: '100' }).first();
    await btn100.click();
    await expect(btn100).toHaveClass(/bg-primary/);

    const btn50 = page.getByRole('button', { name: '50' }).first();
    await btn50.click();
    await expect(btn50).toHaveClass(/bg-primary/);

    // Image size: choose Medium and verify selected styling
    const btnMedium = page.getByRole('button', { name: 'Medium' }).first();
    await btnMedium.click();
    await expect(btnMedium).toHaveClass(/bg-primary/);

    // Close settings by clicking overlay backdrop
    await page.mouse.click(10, 10); // click outside panel
    await expect(page.getByText('User Settings')).toHaveCount(0);
  });
});
