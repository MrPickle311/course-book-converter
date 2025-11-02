import {test, expect, Page} from '@playwright/test';
import fs from 'fs';
import {generateAndOpenFirstCourse, login} from "./common";

const uploadId = '2ea81edd-bd2b-45f5-89d6-c18526275a47';
const pdf = `/home/damian/business/book-course-converter/uploads/${uploadId}.pdf`;
const sampleTaskPdf = `/home/damian/Documents/task.pdf`;


async function backAndDeleteBook(page: Page) {
    await page.getByRole('button', {name: 'Back'}).click();
    await expect(page.getByRole('button', {name: 'Delete book'})).toBeVisible({timeout: 20000});
    await page.getByRole('button', {name: 'Delete book'}).click();
    await expect(page.getByRole('heading', {name: 'Turn a PDF book into a course with notes and tasks'})).toBeVisible();
}

test.describe('Task retaking', () => {
    test.describe.configure({mode: 'serial'});

    test('retake MCQ: wrong answer -> Retake -> correct answer', async ({page}) => {
        await login(page);
        await generateAndOpenFirstCourse(page, 'Introduction');

        // MCQ card is deterministic in e2e: title "Choose the correct option"
        const mcqCard = page.getByRole('heading', {name: 'Choose the correct option'}).first().locator('xpath=ancestor::div[contains(@class, "card")]');
        await expect(mcqCard.first()).toBeVisible({timeout: 20000});

        // Submit wrong answer: choose B (correct is A)
        const radioB = mcqCard.locator('label:has-text("B")');
        await radioB.click();
        await mcqCard.getByRole('button', {name: 'Submit Answer'}).click();

        // Retake should appear for incorrect submission
        await expect(mcqCard.getByRole('button', {name: 'Retake'})).toBeVisible({timeout: 10000});

        // Retake, then choose correct A and resubmit
        await mcqCard.getByRole('button', {name: 'Retake'}).click();
        await expect(mcqCard.getByRole('button', {name: 'Submit Answer'})).toBeVisible({timeout: 10000});

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
        await expect(msCard.first()).toBeVisible({timeout: 20000});

        // Submit a wrong combination: choose only Y (correct is X and Z)
        await msCard.getByRole('checkbox', {name: 'Y'}).click();
        await msCard.getByRole('button', {name: 'Submit Answer'}).click();

        // Expect incorrect state and Retake button visible
        await expect(msCard.getByText('Incorrect')).toBeVisible({timeout: 10000});
        await expect(msCard.getByRole('button', {name: 'Retake'})).toBeVisible({timeout: 10000});

        // Retake, then choose the correct set (X and Z) and resubmit
        await msCard.getByRole('button', {name: 'Retake'}).click();
        await expect(msCard.getByRole('button', {name: 'Submit Answer'})).toBeVisible({timeout: 10000});

        await msCard.getByRole('checkbox', {name: 'X'}).click();
        await msCard.getByRole('checkbox', {name: 'Z'}).click();
        await msCard.getByRole('button', {name: 'Submit Answer'}).click();

        // Should now be correct and Retake should disappear
        await expect(msCard.getByText('Correct')).toBeVisible({timeout: 10000});
        await expect(msCard.getByRole('button', {name: 'Retake'})).toHaveCount(0);

        // Cleanup
        await backAndDeleteBook(page);
    });
});
