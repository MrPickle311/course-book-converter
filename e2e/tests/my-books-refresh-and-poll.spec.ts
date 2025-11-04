import { expect, test } from '@playwright/test';
import fs from 'fs';
import { login, timeout } from './common';

test.describe('My books button refreshes and polls for new books', () => {
  test.describe.configure({ mode: 'serial' });

  test('detects a newly uploaded book from another page within the polling window', async ({ browser, page }) => {
    // Page 1: go to library
    await login(page);
    await page.getByRole('button', { name: 'My books' }).click();
    await expect(page.getByRole('heading', { name: 'My Books' })).toBeVisible(timeout);
    await page.getByPlaceholder('Search books by title...').fill('');

    // Prepare a unique upload name
    const buffer = fs.readFileSync('/home/damian/business/book-course-converter/e2e/course_book.pdf');
    const uniqueName = `poll-${Date.now()}.pdf`;
    const title = uniqueName.replace('.pdf', '');

    // Page 2: simulate book being uploaded elsewhere
    const page2 = await browser.newPage();
    await login(page2);
    await expect(page2.getByRole('heading', { name: 'Turn a PDF book into a course with notes and tasks' })).toBeVisible();
    await page2.setInputFiles('#file-upload', { name: uniqueName, mimeType: 'application/pdf', buffer });
    await page2.getByRole('button', { name: 'Process PDF' }).click();
    await expect(page2.getByRole('heading', { name: 'My Books' })).toBeVisible({ timeout: 20000 });

    // Page 1: click My books to trigger refresh + polling and wait for the new book to appear
    await page.getByRole('button', { name: 'My books' }).click();
    await expect(page.getByRole('heading', { name: title }).first()).toBeVisible({ timeout: 20000 });

    // Cleanup on page 1
    await page.getByRole('heading', { name: title }).first().click();
    await expect(page.getByRole('button', { name: 'Delete book' })).toBeVisible(timeout);
    await page.getByRole('button', { name: 'Delete book' }).click();

    // Close page 2
    await page2.close();
  });
});


