import { test, expect, Page } from '@playwright/test';
import { login } from '../../utils/login';
import { resetDatabaseAndImportDataFromPath } from '../../utils/dts-import';
import { navToHeader } from '../../utils/shared';

const createTransferToken = async (page, tokenName, duration, type) => {
  await navToHeader(
    page,
    ['Settings', 'Transfer Tokens', 'Create new Transfer Token'],
    'Create Transfer Token'
  );

  await page.getByLabel('Name*').click();
  await page.getByLabel('Name*').fill(tokenName);

  await page.getByLabel('Token duration').click();
  await page.getByRole('option', { name: duration }).click();

  await page.getByLabel('Token type').click();
  await page.getByRole('option', { name: type }).click();

  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByText(/copy this token/)).toBeVisible();
  await expect(page.getByText('Expiration date:')).toBeVisible();
};

test.describe('Transfer Tokens', () => {
  let page: Page;

  // For some reason, logging in after each token is extremely flaky, so we'll just do it once
  test.beforeAll(async ({ browser }) => {
    await resetDatabaseAndImportDataFromPath('with-admin.tar');
    page = await browser.newPage();
    await login({ page });
  });

  test.afterAll(async ({ browser }) => {
    page.close();
  });

  // Test token creation
  const testCases = [
    ['30-day push token', '30 days', 'Push'],
    ['30-day pull token', '30 days', 'Pull'],
    ['30-day full-access token', '30 days', 'Full access'],
    // if push+pull work generally that's good enough for e2e
    ['7-day token', '7 days', 'Full access'],
    ['90-day token', '90 days', 'Full access'],
    ['unlimited token', 'Unlimited', 'Full access'],
  ];
  for (const [name, duration, type] of testCases) {
    test(`A user should be able to create a ${name}`, async ({}) => {
      await createTransferToken(page, name, duration, type);
    });
  }

  test('Created tokens list page should be correct', async ({}) => {
    await createTransferToken(page, 'my test token', 'unlimited', 'Full access');

    // if we don't wait until createdAt is at least 1s, we see "NaN" for the timestamp
    // TODO: fix the bug and remove this
    await page.waitForTimeout(1100);

    await navToHeader(page, ['Settings', 'Transfer Tokens'], 'Transfer Tokens');

    const nameCell = page.getByRole('gridcell', { name: 'my test token', exact: true });
    await expect(nameCell).toBeVisible();

    // Locate the parent of nameCell and then search within it for the timestamp
    const parentRow = nameCell.locator('xpath=..');
    await expect(parentRow).toContainText(/\d+ (second|minute)s? ago/);

    // TODO: expand on this test, it could check edit and delete icons
  });
});
