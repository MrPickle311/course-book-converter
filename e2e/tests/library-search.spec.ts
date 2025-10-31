import { test, expect } from '@playwright/test';

const id1 = '2ea81edd-bd2b-45f5-89d6-c18526275a47';
const id2 = 'e389a702-529c-4acf-921b-d3b60887b21e';
const pdf1 = `/home/damian/business/book-course-converter/uploads/${id1}.pdf`;
const pdf2 = `/home/damian/business/book-course-converter/uploads/${id2}.pdf`;

async function login(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Sign in with Google \(Demo\)/i }).click();
  await expect(page.getByRole('button', { name: 'My books' })).toBeVisible();
}

test.describe('Library search filters books by title', () => {
  test.describe.configure({ mode: 'serial' });

  test('search filters to matching book, then cleanup by deleting both', async ({ page }) => {
    await login(page);

    // Upload first
    await expect(page.getByRole('heading', { name: 'Turn a PDF book into a course with notes and tasks' })).toBeVisible();
    await page.setInputFiles('#file-upload', pdf1);
    await page.getByRole('button', { name: 'Process PDF' }).click();
    await expect(page.getByText('All books')).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('heading', { name: id1 }).first()).toBeVisible({ timeout: 20000 });

    // Upload second
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByRole('heading', { name: 'Turn a PDF book into a course with notes and tasks' })).toBeVisible();
    await page.setInputFiles('#file-upload', pdf2);
    await page.getByRole('button', { name: 'Process PDF' }).click();
    await expect(page.getByText('All books')).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('heading', { name: id2 }).first()).toBeVisible({ timeout: 20000 });

    // Ensure both are visible
    await expect(page.getByRole('heading', { name: id1 }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: id2 }).first()).toBeVisible();

    // Filter by id1 prefix
    await page.getByPlaceholder('Search books by title...').fill(id1.slice(0, 8));
    await expect(page.getByRole('heading', { name: id1 }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: id2 }).first()).toHaveCount(0);

    // Clear filter, filter by id2 prefix
    await page.getByPlaceholder('Search books by title...').fill('');
    await expect(page.getByRole('heading', { name: id2 }).first()).toBeVisible({ timeout: 10000 });
    await page.getByPlaceholder('Search books by title...').fill(id2.slice(0, 8));
    await expect(page.getByRole('heading', { name: id2 }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: id1 }).first()).toHaveCount(0);

    // Cleanup: delete both
    await page.getByRole('heading', { name: id2 }).first().click();
    await expect(page.getByRole('button', { name: 'Delete book' })).toBeVisible({ timeout: 20000 });
    await page.getByRole('button', { name: 'Delete book' }).click();

    // Remove filter to see remaining book
    await page.getByRole('button', { name: 'My books' }).click();
    await expect(page.getByRole('heading', { name: 'My Books' })).toBeVisible({ timeout: 20000 });
    await page.getByPlaceholder('Search books by title...').fill('');
    await expect(page.getByRole('heading', { name: id1 }).first()).toBeVisible({ timeout: 10000 });

    await page.getByRole('heading', { name: id1 }).first().click();
    await expect(page.getByRole('button', { name: 'Delete book' })).toBeVisible({ timeout: 20000 });
    await page.getByRole('button', { name: 'Delete book' }).click();

    await expect(page.getByRole('heading', { name: 'Turn a PDF book into a course with notes and tasks' })).toBeVisible();
  });
});
