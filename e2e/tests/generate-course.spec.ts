import {test, expect} from '@playwright/test';
import {login} from "./common";

const id = '2ea81edd-bd2b-45f5-89d6-c18526275a47';
const pdf = `/home/damian/business/book-course-converter/uploads/${id}.pdf`;

test.describe('Generate course for a chapter and open it', () => {
    test.describe.configure({mode: 'serial'});

    test('generate and open course for Introduction, then delete book', async ({page}) => {
        await login(page);

        // Upload known PDF
        await expect(page.getByRole('heading', {name: 'Turn a PDF book into a course with notes and tasks'})).toBeVisible();
        await page.setInputFiles('#file-upload', pdf);
        await page.getByRole('button', {name: 'Process PDF'}).click();

        // Library visible and our book present
        await expect(page.getByText('All books')).toBeVisible({timeout: 20000});
        await expect(page.getByRole('heading', {name: id}).first()).toBeVisible({timeout: 20000});

        // Open the book detail
        await page.getByRole('heading', {name: id}).first().click();

        // Generate course for Introduction
        await page.getByRole('button', {name: 'Generate course'}).first().click();

        let generatedChapterCard = page.locator('div')
            .filter({hasText: /^IntroductionIn ProgressCreated \d{1,2}\/\d{1,2}\/\d{4}\d{1,2}\/\d{1,2} tasks0%$/})
            .first()
        await expect(generatedChapterCard).toBeVisible({timeout: 20000});
        await generatedChapterCard.click()
        await expect(page.getByText('This paragraph contains')).toBeVisible({timeout: 20000})

        await page.getByRole('button', {name: 'Back'}).click()
        await expect(page.getByRole('button', {name: 'Delete book'})).toBeVisible({timeout: 20000});
        await page.getByRole('button', {name: 'Delete book'}).click();
        await expect(page.getByRole('heading', {name: 'Turn a PDF book into a course with notes and tasks'})).toBeVisible();
    });
});
