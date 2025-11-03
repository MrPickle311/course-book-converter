import {test, expect} from '@playwright/test';
import fs from 'fs';
import {login, timeout} from "./common";

test.describe('Library pagination with many books', () => {
    test.describe.configure({mode: 'serial'});

    test('paginates books list (10 per page)', async ({page}) => {
        await login(page);

        // Set page size to 10 via settings
        await page.getByRole('button', {name: /Demo/i}).click();
        await expect(page.getByText('User Settings')).toBeVisible(timeout);
        const btn10 = page.getByRole('button', {name: '10'}).first();
        await btn10.click();
        await expect(btn10).toHaveClass(/bg-primary/);
        // close settings
        await page.mouse.click(10, 10);
        await expect(page.getByText('User Settings')).toHaveCount(0);

        const name = 'course_book';
        const pdfPath = '/home/damian/business/book-course-converter/e2e/' + name + '.pdf';
        const buffer = fs.readFileSync(pdfPath);

        // Upload 12 small PDFs to create two pages
        const booksCount = 12;
        for (let i = 0; i < booksCount; i++) {
            await expect(page.getByRole('heading', {name: 'Turn a PDF book into a course with notes and tasks'})).toBeVisible();
            await page.setInputFiles('#file-upload', {
                name: name + '.pdf',
                mimeType: 'application/pdf',
                buffer
            });
            await page.getByRole('button', {name: 'Process PDF'}).click();
            // await expect(page.getByRole('button', {name: 'My Books'})).toBeVisible(timeout);
            // Go back to upload for next iteration
            if (i < booksCount - 1) {
                await page.getByRole('button', {name: 'Back'}).click();
            }
        }

        // Ensure we are on library page
        await expect(page.getByRole('button', {name: 'My Books'})).toBeVisible(timeout);

        // Filter to only the books created in this test
        await page.getByPlaceholder('Search books by title...').fill(name);
        await expect(page.getByText(`All Books (12)`)).toBeVisible(timeout);

        // Pagination should show two pages and default to page 1
        await expect(page.getByRole('link', {name: '1'})).toBeVisible();
        await expect(page.getByRole('link', {name: '2'})).toBeVisible();

        // Page 1 should render 12 cards
        const listSelector = page.locator('.cursor-pointer');
        await expect(listSelector).toHaveCount(10);

        // Navigate to page 2 and verify remaining 5 items
        await page.getByRole('link', {name: '2'}).click();
        await expect(listSelector).toHaveCount(2);

        // Cleanup: delete all created books (both pages)
        // We remain filtered by prefix, loop until no cards remain
        while (await listSelector.count() > 0) {
            await listSelector.first().click();
            await expect(page.getByRole('button', {name: 'Delete book'})).toBeVisible(timeout);
            await page.getByRole('button', {name: 'Delete book'}).click();
            const myBooksButton = page.getByRole('button', {name: 'My Books'});
            await expect(myBooksButton).toBeVisible(timeout);
            await myBooksButton.click()
            // If current page becomes empty but page 1 still exists, click it
            if (await listSelector.count() === 0) {
                const page1 = page.getByRole('link', {name: '1'});
                if (await page1.count()) {
                    await page1.click();
                }
            }
        }

        // After cleanup, filtered view should show no books
        await expect(page.getByText('No books found')).toBeVisible();
    });
});


