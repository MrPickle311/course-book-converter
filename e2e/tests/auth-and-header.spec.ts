import {test, expect} from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
    await page.goto('/');
    await page.getByRole('button', {name: /Sign in with Google \(Demo\)/i}).click();
    await expect(page.getByRole('button', {name: 'My books'})).toBeVisible();
}

test.describe('Auth and Header', () => {
    test ('login shows header actions; logout returns to login', async ({page}) => {
        await login(page);
        await expect(page.getByRole('button', {name: 'My books'})).toBeVisible();
        await expect(page.getByRole('button', {name: 'Logout'})).toBeVisible();

        await page.getByRole('button', {name: 'Logout'}).click();
        // After logout, the email sign-in button from AuthForm should be visible
        await expect(page.getByRole('button', {name: 'Sign In with Email'})).toBeVisible({timeout: 20000});
    });

    test('Back button navigates between views', async ({page}) => {
        await login(page);

        // upload -> library
        await expect(page.getByRole('heading', {name: 'Turn a PDF book into a course with notes and tasks'})).toBeVisible();
        await page.getByRole('button', {name: 'My books'}).click();
        await expect(page.getByRole('heading', {name: 'My Books'})).toBeVisible();

        // library -> upload via Back
        await page.getByRole('button', {name: 'Back'}).click();
        await expect(page.getByRole('heading', {name: 'Turn a PDF book into a course with notes and tasks'})).toBeVisible();
    });
});
