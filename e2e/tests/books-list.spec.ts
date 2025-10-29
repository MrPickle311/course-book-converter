import { test, expect } from '@playwright/test';

const backendBase = 'http://localhost:8080';

test.describe('Books list', () => {
  // Avoid cross-browser seeding races
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ request }) => {
    await request.delete(`${backendBase}/e2e/seed/reset`);
    await request.post(`${backendBase}/e2e/seed/books`, {
      data: { title: 'Clean Architecture' },
    });
    await request.post(`${backendBase}/e2e/seed/books`, {
      data: { title: 'Designing Data-Intensive Applications' },
    });
  });

  async function loginAndOpenLibrary(page: import('@playwright/test').Page) {
    await page.goto('/');
    // Demo Google sign-in (frontend-mocked)
    await page.getByRole('button', { name: /Sign in with Google \(Demo\)/i }).click();
    // Wait for authenticated header
    await expect(page.getByRole('button', { name: 'My books' })).toBeVisible();
    await page.getByRole('button', { name: 'My books' }).click();
    await expect(page.getByRole('heading', { name: 'My Books' })).toBeVisible();
  }

  test('frontend displays seeded books', async ({ page }) => {
    await loginAndOpenLibrary(page);

    await expect(
      page.getByText('Clean Architecture', { exact: false })
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByText('Designing Data-Intensive Applications', { exact: false })
    ).toBeVisible({ timeout: 15000 });
  });
});


