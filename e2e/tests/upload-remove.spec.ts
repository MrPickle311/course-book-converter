import {test, expect} from '@playwright/test';
import {loadSampleBook, login, timeout} from "./common";

test.describe('Upload remove selection', () => {
    test.describe.configure({mode: 'serial'});

    test('choose -> remove -> choose available again', async ({page}) => {
        await login(page);

        // Initial upload UI
        await expect(page.getByRole('heading', {name: 'Turn a PDF book into a course with notes and tasks'})).toBeVisible();
        await loadSampleBook(page)
        await expect(page.getByRole('button', {name: 'Process PDF'})).toBeVisible(timeout);

        // Choose a file
        await expect(page.getByRole('button', {name: 'Process PDF'})).toBeVisible();
        await expect(page.getByRole('button', {name: 'Remove'})).toBeVisible();

        // Remove selection
        await page.getByRole('button', {name: 'Remove'}).click();

        await expect(page.locator('div').filter({hasText: /^Drag and drop your PDF book hereorChoose FileOnly PDF files are supported$/}).nth(1)).toBeVisible();
    });
});


