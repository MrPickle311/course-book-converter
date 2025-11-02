import {test, expect, Page} from '@playwright/test';
import fs from 'fs';
import {backAndDeleteBook, generateAndOpenFirstCourse, login, timeout} from "./common";

const uploadId = '2ea81edd-bd2b-45f5-89d6-c18526275a47';
const pdf = `/home/damian/business/book-course-converter/uploads/${uploadId}.pdf`;
const sampleTaskPdf = `/home/damian/Documents/task.pdf`;



test.describe('Task retaking', () => {
    test.describe.configure({mode: 'serial'});

    test('retake MCQ: wrong answer -> Retake -> correct answer', async ({page}) => {
        await login(page);
        await generateAndOpenFirstCourse(page, 'Introduction');

        // MCQ card is deterministic in e2e: title "Choose the correct option"
        const mcqCard = page.getByRole('heading', {name: 'Choose the correct option'}).first().locator('xpath=ancestor::div[contains(@class, "card")]');
        await expect(mcqCard.first()).toBeVisible(timeout);

        // Submit wrong answer: choose B (correct is A)
        const radioB = mcqCard.locator('label:has-text("B")');
        await radioB.click();
        await mcqCard.getByRole('button', {name: 'Submit Answer'}).click();

        // Retake should appear for incorrect submission
        await expect(mcqCard.getByRole('button', {name: 'Retake'})).toBeVisible(timeout);

        // Retake, then choose correct A and resubmit
        await mcqCard.getByRole('button', {name: 'Retake'}).click();
        await expect(mcqCard.getByRole('button', {name: 'Submit Answer'})).toBeVisible(timeout);

        const radioA = mcqCard.locator('label:has-text("A")');
        await radioA.click();
        await mcqCard.getByRole('button', {name: 'Submit Answer'}).click();

        // After correct submission, Retake should not be visible anymore
        await expect(mcqCard.getByRole('button', {name: 'Retake'})).toHaveCount(0);

        // Cleanup: back and delete book
        await backAndDeleteBook(page);
    });

    test('retake Multi-select: wrong set -> Retake -> correct set', async ({page}) => {
        await login(page);
        await generateAndOpenFirstCourse(page, 'Introduction');

        // Multi-select card: deterministic e2e title "Select valid items"
        const msCard = page
            .getByRole('heading', {name: 'Select valid items'})
            .first()
            .locator('xpath=ancestor::div[contains(@class, "card")]');
        await expect(msCard.first()).toBeVisible(timeout);

        // Submit a wrong combination: choose only Y (correct is X and Z)
        await msCard.getByRole('checkbox', {name: 'Y'}).click();
        await msCard.getByRole('button', {name: 'Submit Answer'}).click();

        // Expect incorrect state and Retake button visible
        await expect(msCard.getByText('Incorrect')).toBeVisible(timeout);
        await expect(msCard.getByRole('button', {name: 'Retake'})).toBeVisible(timeout);

        // Retake, then choose the correct set (X and Z) and resubmit
        await msCard.getByRole('button', {name: 'Retake'}).click();
        await expect(msCard.getByRole('button', {name: 'Submit Answer'})).toBeVisible(timeout);

        await msCard.getByRole('checkbox', {name: 'X'}).click();
        await msCard.getByRole('checkbox', {name: 'Z'}).click();
        await msCard.getByRole('button', {name: 'Submit Answer'}).click();

        // Should now be correct and Retake should disappear
        await expect(msCard.getByText('Correct')).toBeVisible(timeout);
        await expect(msCard.getByRole('button', {name: 'Retake'})).toHaveCount(0);

        // Cleanup
        await backAndDeleteBook(page);
    });

    test('retake Short-answer: forced incorrect -> Retake -> correct', async ({page}) => {
        await login(page);
        await generateAndOpenFirstCourse(page, 'Introduction');

        const saCard = page
            .getByRole('heading', {name: 'Summarize the chapter'})
            .first()
            .locator('xpath=ancestor::div[contains(@class, "card")]');
        await expect(saCard.first()).toBeVisible(timeout);

        // Force incorrect using backend mock keyword that the mock recognizes
        const textarea = saCard.getByPlaceholder('Enter your answer...');
        await textarea.fill('wrong answer');
        await saCard.getByRole('button', {name: 'Submit Answer'}).click();

        await expect(saCard.getByText('Score: 0%')).toBeVisible(timeout);
        await expect(saCard.getByRole('button', {name: 'Retake'})).toBeVisible(timeout);
        await expect(saCard.getByText('Feedback:')).toBeVisible(timeout);
        await expect(saCard.getByText('Forced incorrect')).toBeVisible(timeout);
        await expect(saCard.getByText('Please re-read the chapter')).toBeVisible(timeout);
        await expect(saCard.getByText('Answer lacks key points')).toBeVisible(timeout);

        // Retake and submit a normal answer -> should be correct
        await saCard.getByRole('button', {name: 'Retake'}).click();
        await expect(saCard.getByRole('button', {name: 'Submit Answer'})).toBeVisible(timeout);
        await textarea.fill('A clear summary of the chapter.');
        await saCard.getByRole('button', {name: 'Submit Answer'}).click();

        await expect(saCard.getByText('Score: 100%')).toBeVisible(timeout);
        await expect(saCard.getByRole('button', {name: 'Retake'})).toHaveCount(0);

        await backAndDeleteBook(page);
    });

    test('retake PDF upload: non-PDF -> Retake -> correct PDF', async ({page}) => {
        await login(page);
        await generateAndOpenFirstCourse(page, 'Introduction');

        const uploadCard = page
            .getByRole('heading', {name: 'Provide a pdf file with solution.'})
            .first()
            .locator('xpath=ancestor::div[contains(@class, "card")]');
        await expect(uploadCard.first()).toBeVisible(timeout);

        // Upload a non-PDF to trigger incorrect
        const fileChooserPromise = page.waitForEvent('filechooser');
        await uploadCard.getByRole('button', {name: 'Upload PDF'}).click();
        const chooser1 = await fileChooserPromise;
        await chooser1.setFiles({
            name: 'notpdf.txt',
            mimeType: 'text/plain',
            // any bytes are fine; backend uses file name extension to validate
            buffer: fs.readFileSync(sampleTaskPdf)
        });
        await uploadCard.getByRole('button', {name: 'Submit Answer'}).click();

        await expect(uploadCard.getByText('Score: 0%')).toBeVisible(timeout);
        await expect(uploadCard.getByRole('button', {name: 'Retake'})).toBeVisible(timeout);
        await expect(uploadCard.getByText('Feedback:')).toBeVisible(timeout);
        await expect(uploadCard.getByText('Only PDF files are supported')).toBeVisible(timeout);

        // Retake, then upload a valid PDF and submit
        await uploadCard.getByRole('button', {name: 'Retake'}).click();
        await expect(uploadCard.getByRole('button', {name: 'Submit Answer'})).toBeVisible(timeout);

        const fileChooserPromise2 = page.waitForEvent('filechooser');
        await uploadCard.getByRole('button', {name: 'Upload PDF'}).click();
        const chooser2 = await fileChooserPromise2;
        await chooser2.setFiles({
            name: 'task.pdf',
            mimeType: 'application/pdf',
            buffer: fs.readFileSync(sampleTaskPdf)
        });
        await uploadCard.getByRole('button', {name: 'Submit Answer'}).click();

        await expect(uploadCard.getByText('Score: 100%')).toBeVisible(timeout);
        await expect(uploadCard.getByRole('button', {name: 'Retake'})).toHaveCount(0);

        await backAndDeleteBook(page);
    });
});
