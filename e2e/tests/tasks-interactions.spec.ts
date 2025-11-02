import {expect, test} from '@playwright/test';
import fs from 'fs';
import {generateAndOpenFirstCourse, login, timeout} from "./common";

const sampleTaskPdf = `/home/damian/Documents/task.pdf`;

test.describe('Tasks interactions', () => {
    test.describe.configure({mode: 'serial'});

    test('submit all task types until course completes', async ({page}) => {
        await login(page);
        await generateAndOpenFirstCourse(page, 'Introduction');


        await expect(page.getByRole('textbox', {name: 'Enter your answer...'})).toBeEmpty();
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
        const submitBtn = page.locator('div').filter({hasText: /^Test answerSubmit Answer$/}).getByRole('button').first()
        await expect(submitBtn).toBeVisible(timeout)

        await submitBtn.click()

        await expect(submitBtn).toHaveCount(0, {timeout: 10000});
        await expect(page.locator('div').filter({hasText: /^Score: 100%$/})).toBeVisible(timeout)
        let updatedCircle = page.locator('div').filter({hasText: /^1Summarize the chapterYour answerTest answerScore: 100%$/})
            .getByRole('img');
        await expect(updatedCircle).toBeVisible(timeout)

        let practiceTasksUpdated = page.getByRole('tab', {name: 'Practice Tasks (1/4)'});
        await expect(practiceTasksUpdated).toBeVisible(timeout)
        await expect(page.getByText('Progress Overview1 of 4 tasks')).toBeVisible();


        // single select

        await expect(page.getByText('2Choose the correct optionABCSubmit Answer')).toBeVisible();
        await expect(page.getByText('2', {exact: true})).toBeVisible();
        await expect(page.getByRole('heading', {name: 'Choose the correct option'})).toBeVisible();
        await expect(page.locator('div').filter({hasText: /^2Choose the correct optionABCSubmit Answer$/}).locator('circle')).toBeVisible();
        await expect(page.getByRole('checkbox', {name: 'A'})).toBeVisible();
        await expect(page.getByRole('checkbox', {name: 'B'})).toBeVisible();
        await expect(page.getByRole('checkbox', {name: 'C'})).toBeVisible();

        await page.getByRole('checkbox', {name: 'A'}).click();
        await page.locator('div').filter({hasText: /^ABCSubmit Answer$/}).getByRole('button').click();

        await expect(page.getByRole('tab', {name: 'Practice Tasks (2/4)'})).toBeVisible();
        await expect(page.getByText('Progress Overview2 of 4 tasks')).toBeVisible();

        // multiple select

        await expect(page.getByText('3Select valid itemsXYZSubmit')).toBeVisible();
        await expect(page.getByRole('checkbox', {name: 'X'})).toBeVisible();
        await expect(page.getByRole('checkbox', {name: 'Y'})).toBeVisible();
        await expect(page.getByRole('checkbox', {name: 'Z'})).toBeVisible();
        await expect(page.getByText('3', {exact: true})).toBeVisible();
        await expect(page.locator('div').filter({hasText: /^3Select valid itemsXYZSubmit Answer$/}).getByRole('img')).toBeVisible();

        await page.getByRole('checkbox', {name: 'X'}).click();
        await page.getByRole('checkbox', {name: 'Z'}).click();
        await page.locator('div').filter({hasText: /^XYZSubmit Answer$/}).getByRole('button').click();

        await expect(page.locator('div').filter({hasText: /^Correct$/}).nth(1)).toBeVisible();
        await expect(page.locator('div').filter({hasText: /^3Select valid itemsXYZCorrect$/}).getByRole('img').first()).toBeVisible();
        await expect(page.locator('div').filter({hasText: /^Progress Overview3 of 4 tasks completed$/}).nth(1)).toBeVisible();
        await expect(page.getByRole('tab', {name: 'Practice Tasks (3/4)'})).toBeVisible();


        // file upload
        await expect(page.getByText('4', {exact: true})).toBeVisible();
        await expect(page.getByRole('heading', {name: 'Provide a pdf file with'})).toBeVisible();
        await expect(page.getByText('4Provide a pdf file with solution.Upload PDFNo file selectedSubmit Answer')).toBeVisible();
        await expect(page.locator('div').filter({hasText: /^4Provide a pdf file with solution\.Upload PDFNo file selectedSubmit Answer$/}).locator('circle')).toBeVisible();

        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.getByRole('button', {name: 'Upload PDF'}).click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles({
            name: "task.pdf",
            mimeType: 'application/pdf',
            buffer: fs.readFileSync(sampleTaskPdf)
        });
        await page.getByRole('button', {name: 'Submit Answer'}).click();

        await expect(page.locator('div').filter({hasText: /^Uploaded file: task\.pdf$/})).toBeVisible();
        await expect(page.locator('div').filter({hasText: /^Score: 100%$/}).nth(1)).toBeVisible();
        await expect(page.locator('div').filter({hasText: /^4Provide a pdf file with solution\.Upload PDFUploaded file: task\.pdfScore: 100%$/}).locator('path').first()).toBeVisible();

        // all course finished
        await expect(page.locator('div').filter({hasText: /^Course Completed!$/}).getByRole('img')).toBeVisible();
        await expect(page.getByText('Course Completed!')).toBeVisible();


        // Cleanup: back then delete book
        await page.getByRole('button', {name: 'Back'}).click();
        await expect(page.getByRole('button', {name: 'Delete book'})).toBeVisible(timeout);
        await page.getByRole('button', {name: 'Delete book'}).click();
    });
});
