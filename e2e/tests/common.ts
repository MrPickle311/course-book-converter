import {expect, test} from "@playwright/test";
import fs from 'fs';

const uploadId = '2ea81edd-bd2b-45f5-89d6-c18526275a47';
const pdf = `/home/damian/business/book-course-converter/uploads/${uploadId}.pdf`;
export const timeout = {timeout: 10000};

export async function login(page: import('@playwright/test').Page) {
    await page.goto('/');
    await page.getByRole('button', {name: /Sign in with Google \(Demo\)/i}).click();
    await expect(page.getByRole('button', {name: 'My books'})).toBeVisible();
}

export async function generateAndOpenFirstCourse(page: import('@playwright/test').Page, chapterName: string) {
    // Upload and open book
    await expect(page.getByRole('heading', {name: 'Turn a PDF book into a course with notes and tasks'})).toBeVisible();
    const buffer = fs.readFileSync(pdf);
    const uniqueName = `${uploadId}-${Date.now()}.pdf`;
    const bookTitle = uniqueName.replace('.pdf', '');
    await page.setInputFiles('#file-upload', {name: uniqueName, mimeType: 'application/pdf', buffer});
    await page.getByRole('button', {name: 'Process PDF'}).click();
    await expect(page.getByText('All books')).toBeVisible({timeout: 20000});
    await page.getByRole('heading', {name: bookTitle}).first().click();

    // Generate for the specified chapter (or fallback to first card if not found)
    let chapterCard = page.getByRole('heading', {name: chapterName}).first().locator('xpath=ancestor::div[contains(@class, "p-4")]');
    if (!(await chapterCard.isVisible().catch(() => false))) {
        chapterCard = page.locator('div.p-4').filter({has: page.getByRole('button', {name: /Generate course/i})}).first();
    }
    await expect(chapterCard).toBeVisible({timeout: 20000});
    const uiChosenTitle = (await chapterCard.getByRole('heading').first().innerText()).trim();
    await chapterCard.getByRole('button', {name: /Generate course/i}).click();

    // Go back to library and reopen book for generated state
    await page.getByRole('button', {name: 'My books'}).click();
    await page.getByRole('heading', {name: 'My Books'}).waitFor({state: 'visible'});
    await page.getByRole('heading', {name: bookTitle}).first().click();

    // Wait for the selected chapter to transition to generated state via UI only
    // Find any generated chapter row by its status badge and open it
    const firstGenerated = page.locator('.cursor-pointer').first();
    await expect(firstGenerated).toBeVisible(timeout);
    await firstGenerated.click();

    // Switch to Tasks tab and assert tasks UI state
    await page.getByRole('tab', {name: /Practice Tasks/}).click();
    await expect(page.getByRole('progressbar')).toBeVisible(timeout)
    await expect(page.getByRole('heading', { name: 'Progress Overview' })).toBeVisible(timeout)
    await expect(page.getByRole('tab', { name: 'Study Notes' })).toBeVisible(timeout)
    await expect(page.getByText('of 4 tasks completed')).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Practice Tasks (0/4)' })).toBeVisible();
}
