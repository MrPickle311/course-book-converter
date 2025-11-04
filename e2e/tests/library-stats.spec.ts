import {expect, test} from '@playwright/test';
import fs from 'fs';
import {backAndDeleteBook, generateAndOpenFirstCourse, login, timeout} from './common';

const sampleTaskPdf = `/home/damian/Documents/task.pdf`;

test.describe('Library statistics reflect generation and task completion', () => {
    test.describe.configure({mode: 'serial'});

    test('stats update: All Books, In Progress, Completed, Failed, Overall Progress', async ({page}) => {
        await login(page);
        await generateAndOpenFirstCourse(page, 'Introduction');
        await page.getByRole('button', { name: 'Back' }).click();
        await page.getByRole('button', { name: 'Back' }).click();

        await expect(page.locator('div').filter({ hasText: /^Total Books1$/ }).nth(1)).toBeVisible();
        await expect(page.locator('div').filter({ hasText: /^Completed0$/ }).nth(1)).toBeVisible();
        await expect(page.locator('div').filter({ hasText: /^In Progress0$/ }).nth(1)).toBeVisible();
        await expect(page.locator('div').filter({ hasText: /^Failed Tasks0$/ }).nth(1)).toBeVisible();
        await expect(page.locator('div').filter({ hasText: /^Overall Progress0%$/ }).nth(1)).toBeVisible();
        await expect(page.getByText('/0 tasks0%')).toBeVisible();
        await expect(page.getByRole('tab', { name: 'All Books (1)' })).toBeVisible();
        await expect(page.getByRole('tab', { name: 'In Progress (0)' })).toBeVisible();
        await expect(page.getByRole('tab', { name: 'Completed (0)' })).toBeVisible();
        await expect(page.getByText('Not Started')).toBeVisible();
        await expect(page.locator('div').filter({ hasText: /^Not Started$/ }).getByRole('img')).toBeVisible();
        await page.locator('.space-y-8 > .bg-card').click();
        await page.waitForTimeout(50000000)

        // await expect(page.getByText('Generated courses: 1Completed: 0Tasks: 0/40%')).toBeVisible();
        await page.getByRole('button', { name: 'Generate course' }).click();
        // await expect(page.getByText('Generated courses: 2Completed: 0Tasks: 0/80%')).toBeVisible();
        await page.getByRole('heading', { name: 'Introduction' }).click();
        await page.getByRole('tab', { name: 'Practice Tasks (0/4)' }).click();
        await page.getByRole('textbox', { name: 'Enter your answer...' }).click();
        await page.getByRole('textbox', { name: 'Enter your answer...' }).fill('Answer');
        await page.getByText('AnswerSubmit Answer').click();
        await page.locator('div').filter({ hasText: /^AnswerSubmit Answer$/ }).getByRole('button').click();
        await page.getByRole('checkbox', { name: 'A' }).click();
        await page.getByRole('checkbox', { name: 'C' }).click();
        await page.getByRole('checkbox', { name: 'A' }).click();
        await page.locator('div').filter({ hasText: /^ABCSubmit Answer$/ }).getByRole('button').click();
        await page.getByRole('checkbox', { name: 'X' }).click();
        await page.getByRole('checkbox', { name: 'Z' }).click();
        await page.locator('div').filter({ hasText: /^XYZSubmit Answer$/ }).getByRole('button').click();
        await page.getByRole('button', { name: 'Upload PDF' }).click();
        await page.getByRole('button', { name: 'Upload PDF' }).setInputFiles('task.pdf');
        await page.getByRole('button', { name: 'Submit Answer' }).click();
        await page.getByRole('button', { name: 'Back' }).click();

        // to leci do poprawki - jest completed 0, tasks 0/8 -> powinno być tasks 4/8 i pasek powinien być do połowy
        // ale jak wyjdę z książki to się aktualizuje
        // await expect(page.getByText('Generated courses: 2Completed: 0Tasks: 0/80%')).toBeVisible();

        // o tak powinno być
        await expect(page.getByText('Generated courses: 2Completed: 1Tasks: 4/850%')).toBeVisible();
        await expect(page.locator('div').filter({ hasText: /^IntroductionCompletedCreated \d{1,2}\/\d{1,2}\/\d{4}4\/4 tasks100%$/ }).first()).toBeVisible();
        await expect(page.locator('div').filter({ hasText: /^BasicsIn ProgressCreated \d{1,2}\/\d{1,2}\/\d{4}0\/4 tasks0%$/ }).first()).toBeVisible();

        await page.locator('div').filter({ hasText: /^BasicsIn ProgressCreated 11\/4\/20250\/4 tasks0%$/ }).first().click();
        await page.getByRole('tab', { name: 'Practice Tasks (0/4)' }).click();
        await page.getByRole('textbox', { name: 'Enter your answer...' }).click();
        await page.getByRole('textbox', { name: 'Enter your answer...' }).fill('answser');
        await page.getByText('answserSubmit Answer').click();
        await page.locator('div').filter({ hasText: /^answserSubmit Answer$/ }).getByRole('button').click();
        await page.getByRole('checkbox', { name: 'A' }).click();
        await page.locator('div').filter({ hasText: /^ABCSubmit Answer$/ }).getByRole('button').click();
        await page.getByRole('checkbox', { name: 'X' }).click();
        await page.getByRole('checkbox', { name: 'Z' }).click();
        await page.locator('div').filter({ hasText: /^XYZSubmit Answer$/ }).getByRole('button').click();
        await page.getByRole('button', { name: 'Upload PDF' }).click();
        await page.getByRole('button', { name: 'Upload PDF' }).setInputFiles('task.pdf');
        await page.getByRole('button', { name: 'Submit Answer' }).click();
        await page.getByRole('button', { name: 'Back' }).click();
        await expect(page.getByText('Generated courses: 2Completed: 2Tasks: 8/8100%')).toBeVisible();
        await expect(page.locator('div').filter({ hasText: /^BasicsCompletedCreated \d{1,2}\/\d{1,2}\/\d{4}4\/4 tasks100%$/ }).first()).toBeVisible();
        await page.getByRole('button', { name: 'Back' }).click();

        await expect(page.locator('div').filter({ hasText: /^8\/8 tasks$/ }).nth(1)).toBeVisible();
        await expect(page.getByText('/8 tasks100%')).toBeVisible();

        // next book

        await page.getByRole('button', { name: 'Back' }).click();
        await page.getByRole('button', { name: 'Upload PDF by drag-and-drop' }).click();
        await page.getByRole('button', { name: 'Process PDF' }).click();
        await page.getByRole('heading', { name: 'course_book' }).click();
        await page.getByRole('button', { name: 'Generate course' }).first().click();
        await page.getByRole('heading', { name: 'Introduction' }).click();
        await page.getByRole('tab', { name: 'Practice Tasks (0/4)' }).click();
        await page.getByRole('textbox', { name: 'Enter your answer...' }).click();
        await page.getByRole('textbox', { name: 'Enter your answer...' }).fill('answer');
        await page.getByText('answerSubmit Answer').click();
        await page.locator('div').filter({ hasText: /^answerSubmit Answer$/ }).getByRole('button').click();
        await page.getByRole('checkbox', { name: 'A' }).click();
        await page.locator('div').filter({ hasText: /^ABCSubmit Answer$/ }).getByRole('button').click();
        await page.getByRole('checkbox', { name: 'X' }).click();
        await page.getByRole('checkbox', { name: 'Z' }).click();
        await page.locator('div').filter({ hasText: /^XYZSubmit Answer$/ }).getByRole('button').click();
        await page.getByRole('button', { name: 'Upload PDF' }).click();
        await page.getByRole('button', { name: 'Upload PDF' }).setInputFiles('task.pdf');
        await page.getByRole('button', { name: 'Submit Answer' }).click();
        await page.getByRole('button', { name: 'Back' }).click();
        await page.getByRole('button', { name: 'Generate course' }).click();
        await page.getByRole('heading', { name: 'Basics' }).click();
        await page.getByRole('tab', { name: 'Practice Tasks (0/4)' }).click();
        await page.getByRole('textbox', { name: 'Enter your answer...' }).click();
        await page.getByRole('textbox', { name: 'Enter your answer...' }).fill('answer');
        await page.getByText('answerSubmit Answer').click();
        await page.locator('div').filter({ hasText: /^answerSubmit Answer$/ }).getByRole('button').click();
        await page.getByRole('checkbox', { name: 'A' }).click();
        await page.locator('div').filter({ hasText: /^ABCSubmit Answer$/ }).getByRole('button').click();
        await page.getByRole('checkbox', { name: 'Y' }).click();
        await page.locator('div').filter({ hasText: /^XYZSubmit Answer$/ }).getByRole('button').click();
        await page.getByRole('button', { name: 'Upload PDF' }).click();
        await page.getByRole('button', { name: 'Upload PDF' }).setInputFiles('task-bad.pdf');
        await page.getByRole('button', { name: 'Submit Answer' }).click();
        await page.getByRole('button', { name: 'Back' }).click();
        await expect(page.getByText('Generated courses: 2Completed: 2Tasks: 8/8 • 1 failed100%')).toBeVisible();
        await page.getByRole('button', { name: 'Back' }).click();

        await expect(page.locator('div').filter({ hasText: /^8\/8 tasks$/ }).nth(1)).toBeVisible();
        await expect(page.locator('div').filter({ hasText: /^100%$/ }).first()).toBeVisible();

        // final result validation
        await expect(page.getByRole('tab', { name: 'All Books (2)' })).toBeVisible();
        await expect(page.getByRole('tab', { name: 'Completed (2)' })).toBeVisible();
        await expect(page.locator('div').filter({ hasText: /^Failed Tasks1$/ }).nth(1)).toBeVisible();
        await expect(page.locator('div').filter({ hasText: /^Completed2$/ }).nth(1)).toBeVisible();
        await expect(page.locator('div').filter({ hasText: /^Overall Progress100%$/ }).nth(1)).toBeVisible();  // dodać case, gdzie in progress będzie jakiś tam niezerowy
        await expect(page.locator('div').filter({ hasText: /^Total Books2$/ }).nth(1)).toBeVisible();

        // retake i jeszcze in progress

        await page.getByRole('heading', { name: 'course_book' }).click();
        await page.getByRole('heading', { name: 'Basics' }).click();
        await page.getByRole('tab', { name: 'Practice Tasks (4/4)' }).click();
        await page.getByRole('button', { name: 'Retake' }).click();
        await page.getByRole('button', { name: 'Back' }).click();
        await expect(page.getByText('Generated courses: 2Completed: 1Tasks: 7/8 • 0 failed88%')).toBeVisible();
        await expect(page.locator('div').filter({ hasText: /^BasicsIn ProgressCreated \d{1,2}\/\d{1,2}\/\d{4}\/4 tasks75%$/ }).first()).toBeVisible();
        await page.getByRole('button', { name: 'Back' }).click();

        // walidacja na poziomie książek na poziomie library
        await expect(page.getByText('/8 tasks88%').nth(1)).toBeVisible();
        await expect(page.locator('div').filter({ hasText: /^Completed1$/ }).nth(1)).toBeVisible();
        await expect(page.locator('div').filter({ hasText: /^In Progress1$/ }).nth(1)).toBeVisible();
        await expect(page.locator('div').filter({ hasText: /^Failed Tasks0$/ }).nth(1)).toBeVisible();
        await expect(page.locator('div').filter({ hasText: /^Overall Progress50%$/ }).nth(1)).toBeVisible();

        await backAndDeleteBook(page)
    });
});


