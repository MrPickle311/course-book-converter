import {expect, test} from '@playwright/test';
import {login, timeout} from './common';

test.describe('Theme switching (Light/Dark)', () => {
  test('toggles theme and updates root class', async ({ page }) => {
    await login(page);

    // Read initial theme from documentElement
    const initialIsDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));

    // Open settings
    await page.getByRole('button', { name: /Demo/i }).click();
    await expect(page.getByText('User Settings')).toBeVisible(timeout);

    // Toggle theme switch
    await page.getByRole('switch').click();

    // Close settings overlay
    await page.mouse.click(10, 10);

    // Assert root class flipped
    const flippedIsDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(flippedIsDark).toBe(!initialIsDark);

    // Reopen settings and toggle back to original
    await page.getByRole('button', { name: /Demo/i }).click();
    await expect(page.getByText('User Settings')).toBeVisible(timeout);
    await page.getByRole('switch').click();
    await page.mouse.click(10, 10);

    const restoredIsDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(restoredIsDark).toBe(initialIsDark);
  });
});



