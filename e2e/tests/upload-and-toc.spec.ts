import { test, expect } from '@playwright/test';
import {backAndDeleteBook, login} from "./common";

const id = 'e389a702-529c-4acf-921b-d3b60887b21e';
const pdf = `/home/damian/business/book-course-converter/uploads/${id}.pdf`;

test.describe('Upload -> open book -> chapters visible', () => {
    test.describe.configure({ mode: 'serial' });

    test('upload shows chapters on book page', async ({ page }) => {
        await login(page);

        await expect(page.getByRole('heading', { name: 'Turn a PDF book into a course with notes and tasks' })).toBeVisible();
        await page.setInputFiles('#file-upload', pdf);
        await page.getByRole('button', { name: 'Process PDF' }).click();

        await expect(page.getByText('All books')).toBeVisible({ timeout: 20000 });
        await expect(page.getByRole('heading', { name: id }).first()).toBeVisible({ timeout: 20000 });

        await page.getByRole('heading', { name: id }).first().click();

        await expect(page.getByRole('heading', { name: 'Introduction' }).first()).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('heading', { name: 'Basics' }).first()).toBeVisible({ timeout: 15000 });

        await expect(page.getByText('Delete book')).toBeVisible({ timeout: 20000 });
        await page.getByRole('button', { name: 'Delete book' }).click();
    });
});


