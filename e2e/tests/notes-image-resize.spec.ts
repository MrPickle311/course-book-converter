import {expect, test} from '@playwright/test';
import {backAndDeleteBook, generateAndOpenFirstCourse, login, timeout} from './common';

test.describe('Notes image resizing', () => {
    test.describe.configure({mode: 'serial'});

    test('generate course and validate image width changes with settings', async ({page}) => {
        await login(page);
        await generateAndOpenFirstCourse(page, 'Introduction');
        await page.getByRole('tab', {name: 'Study Notes'}).click();

        // Locate the first image from notes (served via images endpoint)
        const img = page.locator('img[src*="/api/v1/books/"]').first();
        await expect(img).toBeVisible(timeout);

        // Helper to read current rendered width
        let imgBox = await img.boundingBox()

        // Start with Small (default may already be small, enforce via settings to be deterministic)
        await page.getByRole('button', {name: /Demo/i}).click();
        await expect(page.getByText('User Settings')).toBeVisible(timeout);
        await page.getByRole('button', {name: 'Small'}).first().click();
        await page.mouse.click(10, 10);
        const widthSmall = imgBox.width

        // Medium should be wider
        await page.getByRole('button', {name: /Demo/i}).click();
        await expect(page.getByText('User Settings')).toBeVisible(timeout);
        await page.getByRole('button', {name: 'Medium'}).first().click();
        await page.mouse.click(10, 10);
        imgBox = await img.boundingBox()
        const widthMedium = imgBox.width
        await expect(widthMedium).toBeGreaterThan(widthSmall);

        // Large should be >= medium
        await page.getByRole('button', {name: /Demo/i}).click();
        await expect(page.getByText('User Settings')).toBeVisible(timeout);
        await page.getByRole('button', {name: 'Large'}).first().click();
        await page.mouse.click(10, 10);
        imgBox = await img.boundingBox()
        const widthLarge = imgBox.width
        await expect(widthLarge).toBeGreaterThanOrEqual(widthMedium);

        // Cleanup: back then delete the created book
        await backAndDeleteBook(page)
    });
});


