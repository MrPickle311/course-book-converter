import {test, expect} from '@playwright/test';
import fs from 'fs';

const uploadId = '2ea81edd-bd2b-45f5-89d6-c18526275a47';
const pdf = `/home/damian/business/book-course-converter/uploads/${uploadId}.pdf`;
const sampleTaskPdf = `/home/damian/business/book-course-converter/uploads/${uploadId}.pdf`;

const timeout = {timeout: 10000};

async function login(page: import('@playwright/test').Page) {
    await page.goto('/');
    await page.getByRole('button', {name: /Sign in with Google \(Demo\)/i}).click();
    await expect(page.getByRole('button', {name: 'My books'})).toBeVisible();
}

async function generateAndOpenFirstCourse(page: import('@playwright/test').Page, chapterName: string) {
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
    await expect(page.getByText('of 3 tasks completed')).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Practice Tasks (0/3)' })).toBeVisible();

    // await page.waitForTimeout(5000000)
}


// getByText('2Choose the correct optionABCSubmit Answer')
// getByText('3Select valid itemsXYZSubmit')


test.describe('Tasks interactions', () => {
    test.describe.configure({mode: 'serial'});

    test('submit all task types until course completes', async ({page}) => {
        await login(page);
        await generateAndOpenFirstCourse(page, 'Introduction');


        await expect(page.getByRole('textbox', { name: 'Enter your answer...' })).toBeEmpty();
        let firstTask = page.getByText('1Summarize the chapterSubmit');
        await expect(firstTask).toBeVisible(timeout)
        let taskNumber = firstTask.getByText('1', {exact: true});
        await expect(taskNumber).toBeVisible(timeout)
        let taskCircle = firstTask//.locator('div')
            .filter({hasText: /^1Summarize the chapterSubmit Answer$/})
            .locator('circle');
        await expect(taskCircle).toBeVisible(timeout)
        let textArea = firstTask.getByPlaceholder('Enter your answer...')
        await expect(textArea).toBeVisible(timeout)
        await textArea.fill('Test answer');
        const submitBtn = page.locator('div').filter({ hasText: /^Test answerSubmit Answer$/ }).getByRole('button').first()
        await expect(submitBtn).toBeVisible(timeout)

        await submitBtn.click()

        await expect(submitBtn).toHaveCount(0, {timeout: 10000});
        await expect(page.locator('div').filter({ hasText: /^Score: 100%$/ })).toBeVisible(timeout)
        let updatedCircle = page.locator('div').filter({hasText: /^1Summarize the chapterYour answerTest answerScore: 100%$/})
            .getByRole('img');
        await expect(updatedCircle).toBeVisible(timeout)

        let practiceTasksUpdated = page.getByRole('tab', { name: 'Practice Tasks (1/3)' });
        await expect(practiceTasksUpdated).toBeVisible(timeout)
        await expect(page.getByText('Progress Overview1 of 3 tasks')).toBeVisible();


        // single select

        await expect(page.getByText('2Choose the correct optionABCSubmit Answer')).toBeVisible();
        await expect(page.getByText('2', { exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Choose the correct option' })).toBeVisible();
        await expect(page.locator('div').filter({ hasText: /^2Choose the correct optionABCSubmit Answer$/ }).locator('circle')).toBeVisible();
        await expect(page.getByRole('checkbox', { name: 'A' })).toBeVisible();
        await expect(page.getByRole('checkbox', { name: 'B' })).toBeVisible();
        await expect(page.getByRole('checkbox', { name: 'C' })).toBeVisible();

        await page.getByRole('checkbox', { name: 'A' }).click();
        await page.locator('div').filter({ hasText: /^ABCSubmit Answer$/ }).getByRole('button').click();

        await expect(page.getByRole('tab', { name: 'Practice Tasks (2/3)' })).toBeVisible();
        await expect(page.getByText('Progress Overview2 of 3 tasks')).toBeVisible();
        // await expect(page.getByRole('tabpanel', { name: 'Practice Tasks (2/3)' }).locator('path').nth(2)).toBeVisible();
        // await expect(page.locator('div').filter({ hasText: /^Correct$/ })).toBeVisible();

        // multiple select

        await expect(page.getByText('3Select valid itemsXYZSubmit')).toBeVisible();
        await expect(page.getByRole('checkbox', { name: 'X' })).toBeVisible();
        await expect(page.getByRole('checkbox', { name: 'Y' })).toBeVisible();
        await expect(page.getByRole('checkbox', { name: 'Z' })).toBeVisible();
        await expect(page.getByText('3', { exact: true })).toBeVisible();
        await expect(page.locator('div').filter({ hasText: /^3Select valid itemsXYZSubmit Answer$/ }).getByRole('img')).toBeVisible();

        await page.getByRole('checkbox', { name: 'X' }).click();
        await page.getByRole('checkbox', { name: 'Z' }).click();
        await page.locator('div').filter({ hasText: /^XYZSubmit Answer$/ }).getByRole('button').click();


        await expect(page.locator('div').filter({ hasText: /^Correct$/ }).nth(1)).toBeVisible();
        await expect(page.locator('div').filter({ hasText: /^3Select valid itemsXYZCorrect$/ }).getByRole('img').first()).toBeVisible();
        await expect(page.locator('div').filter({ hasText: /^Progress Overview3 of 3 tasks completed$/ }).nth(1)).toBeVisible();
        await expect(page.getByRole('tab', { name: 'Practice Tasks (3/3)' })).toBeVisible();
        await expect(page.locator('div').filter({ hasText: /^Course Completed!$/ }).getByRole('img')).toBeVisible();
        await expect(page.getByText('Course Completed!')).toBeVisible();

        // Cleanup: back then delete book
        await page.getByRole('button', {name: 'Back'}).click();
        await expect(page.getByRole('button', {name: 'Delete book'})).toBeVisible({timeout: 20000});
        await page.getByRole('button', {name: 'Delete book'}).click();
    });
});
