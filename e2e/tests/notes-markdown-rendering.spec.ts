import {expect, test} from '@playwright/test';
import {generateAndOpenFirstCourse, login, timeout} from './common';

test.describe('Notes markdown rendering', () => {
    test.describe.configure({mode: 'serial'});

    test('renders rich markdown elements in Study Notes', async ({page}) => {
        await login(page);
        await generateAndOpenFirstCourse(page, 'Introduction');

        // Switch to Study Notes tab
        await page.getByRole('tab', {name: 'Study Notes'}).click();

        // Heading should use the chapter title
        await expect(page.getByLabel('Study Notes').getByRole('heading', { name: 'Introduction' })).toBeVisible();

        // Paragraph with inline formatting
        await expect(page.getByText('bold', {exact: false})).toBeVisible(timeout);
        await expect(page.getByText('italic', {exact: false})).toBeVisible(timeout);
        await expect(page.getByText('inlineCode()', {exact: false})).toBeVisible(timeout);

        // Blockquote
        await expect(page.getByRole('blockquote')).toBeVisible();
        await expect(page.getByText('Blockquote line for emphasis')).toBeVisible(timeout);

        // Unordered list items
        await expect(page.getByText('Item A')).toBeVisible(timeout);
        await expect(page.getByText('Item B')).toBeVisible(timeout);
        await expect(page.getByText('Item C')).toBeVisible(timeout);

        // Ordered list items
        await expect(page.getByRole('heading', { name: 'Steps' })).toBeVisible();
        await expect(page.getByText('Step one')).toBeVisible(timeout);
        await expect(page.getByText('Step two')).toBeVisible(timeout);

        // Code block content
        await expect(page.getByRole('heading', { name: 'Code' })).toBeVisible();
        await expect(page.getByText('function add(a: number, b: number)', {exact: false})).toBeVisible(timeout);
        await expect(page.getByText('console.log(add(2, 3));', {exact: false})).toBeVisible(timeout);

        // Table headers and cells
        await expect(page.getByRole('heading', { name: 'Table' })).toBeVisible();
        await expect(page.getByText('FeatureValueSpeedFastSizeSmall')).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Feature' })).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Value' })).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Speed' })).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Fast' })).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Size' })).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Small' })).toBeVisible();

        // Image extracted from chapter and linked via images endpoint
        await expect(page.getByRole('heading', { name: 'Image' })).toBeVisible();
        const img = page.locator('img[src*="/api/v1/books/"]').first();
        await expect(img).toBeVisible({ timeout: 20000 });
        await expect.poll(async () => await img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
        await expect(await img.getAttribute('alt')).toContain('Figure');

        // Link
        await expect(page.getByText('Reference: OpenAI')).toBeVisible();
        const link = page.getByRole('link', {name: 'OpenAI'});
        await expect(link).toBeVisible(timeout);
        await expect(await link.getAttribute('href')).toContain('openai.com');
    });
});


