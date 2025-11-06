import { test, expect } from '@playwright/test';

const uploadId = '2ea81edd-bd2b-45f5-89d6-c18526275a47';
const pdf = `/home/damian/business/book-course-converter/uploads/${uploadId}.pdf`;

async function login(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Sign in with Google \(Demo\)/i }).click();
  await expect(page.getByRole('button', { name: 'My books' })).toBeVisible();
}

test.describe('Book ToC', () => {
  test.describe.configure({ mode: 'serial' });

  test('upload then open book and see chapters + Generate buttons', async ({ page }) => {
    await login(page);

    await expect(page.getByRole('heading', { name: 'Turn a PDF book into a course with notes and tasks' })).toBeVisible();
    await page.setInputFiles('#file-upload', pdf);
    await page.getByRole('button', { name: 'Process PDF' }).click();

    await expect(page.getByText('All books')).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('heading', { name: uploadId }).first()).toBeVisible({ timeout: 20000 });

    await page.getByRole('heading', { name: uploadId }).first().click();

    // ToC present: at least one chapter heading and Generate button visible
    await expect(page.getByRole('heading', { name: /Introduction|Chapter|Apache/i }).first()).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('button', { name: /Generate course/i }).first()).toBeVisible();

    // cleanup
    await page.getByRole('button', { name: 'Delete book' }).click();
  });
});
