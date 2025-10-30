import {test, expect} from '@playwright/test';

const id1 = '2ea81edd-bd2b-45f5-89d6-c18526275a47';
const dirPath = '/home/damian/business/book-course-converter/uploads/';
const pdf1 = dirPath + id1 + '.pdf';
const id2 = 'e389a702-529c-4acf-921b-d3b60887b21e';
const pdf2 = dirPath + id2 + '.pdf';

test.describe('Books list', () => {
    test.describe.configure({mode: 'serial'});

    async function login(page: import('@playwright/test').Page) {
        await page.goto('/');
        await page.getByRole('button', {name: /Sign in with Google \(Demo\)/i}).click();
        await expect(page.getByRole('button', {name: 'My books'})).toBeVisible();
    }

    test('frontend displays books created via upload flow', async ({page}) => {
        await login(page);

        // On upload page by default; upload first PDF
        await expect(page.getByRole('heading', {name: 'Turn a PDF book into a course with notes and tasks'})).toBeVisible();
        await page.setInputFiles('#file-upload', pdf1);
        await page.getByRole('button', {name: 'Process PDF'}).click();
        await expect(page.getByText('All books')).toBeVisible({timeout: 20000});
        await expect(page.getByText(id1)).toBeVisible({timeout: 20000})

        await page.getByRole('heading', {name: id1}).click();
        await expect(page.getByText('Delete book')).toBeVisible({timeout: 20000});
        await page.getByRole('button', {name: 'Delete book'}).click();

        // Go back to upload and upload second PDF
        await expect(page.getByRole('heading', {name: 'Turn a PDF book into a course with notes and tasks'})).toBeVisible();
        await page.setInputFiles('#file-upload', pdf2);
        await page.getByRole('button', {name: 'Process PDF'}).click();
        await expect(page.getByText('All books')).toBeVisible({timeout: 20000});
        await expect(page.getByText(id2)).toBeVisible({timeout: 20000})

        await page.getByRole('heading', {name: id2}).click();
        await expect(page.getByText('Delete book')).toBeVisible({timeout: 20000});
        await page.getByRole('button', {name: 'Delete book'}).click();
    });
});


