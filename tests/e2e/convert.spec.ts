import { expect, test, type Page } from '@playwright/test';
import { addFromLibrary } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
});

const frames = (page: Page) => page.locator('iframe.frame__iframe');
const label = (page: Page, name: string) =>
  page.getByTestId(`frame-${name}`).locator('.frame__label');

async function nswPage(page: Page) {
  await page.getByRole('button', { name: 'Add masthead + header' }).first().click();
  await addFromLibrary(page, 'heading', 'Heading 1');
  await addFromLibrary(page, 'paragraph', 'Body text');
  await page.getByTestId('component-form').scrollIntoViewIfNeeded();
  await addFromLibrary(page, 'form', 'Text input');
}

test('Convert to SharePoint: a copy beside the original, a summary, placeholders, and undo', async ({
  page,
}) => {
  await nswPage(page);
  await label(page, 'Home').click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Convert to SharePoint' }).click();

  const summary = page.getByRole('dialog', { name: 'Frame converted' });
  await expect(summary).toBeVisible();
  await expect(summary).toContainText('The original is unchanged');
  await expect(summary.getByTestId('conversion-counts')).toContainText('brought across');
  await expect(summary.getByTestId('conversion-placeholders')).toContainText('Forms');
  await summary.getByRole('button', { name: 'Done' }).click();

  await expect(frames(page)).toHaveCount(2);
  await expect(page.getByTestId('frame-kit')).toHaveText(['NSW', 'SharePoint']);
  const copy = page.frameLocator('iframe.frame__iframe').nth(1);
  await expect(copy.locator('.sp-site')).toHaveCount(1);
  await expect(copy.locator('.sp-text h1')).toHaveCount(1);
  await expect(copy.locator('.sp-placeholder')).toContainText('Not converted');
  await expect(copy.locator('.sp-placeholder')).toContainText('Forms');
  // The original is as it was.
  await expect(page.frameLocator('iframe.frame__iframe').first().locator('h1')).toHaveCount(1);

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(frames(page)).toHaveCount(1);
});

test('the frame panel has the same Convert buttons, and an empty frame can’t be converted', async ({
  page,
}) => {
  await label(page, 'Home').click({ button: 'right' });
  await expect(page.getByRole('menuitem', { name: 'Convert to SharePoint' })).toBeDisabled();
  await page.keyboard.press('Escape');

  await addFromLibrary(page, 'heading', 'Heading 1');
  await page.getByTestId('frame-Home').locator('.frame__name').click();
  await page.getByRole('button', { name: 'Convert to SharePoint' }).click();
  await expect(page.getByRole('dialog', { name: 'Frame converted' })).toBeVisible();
});

test('Convert to NSW from a SharePoint frame', async ({ page }) => {
  await page.getByRole('button', { name: 'Add frame' }).click();
  await page
    .getByRole('group', { name: 'Style kit for the new frame' })
    .getByRole('button', { name: 'SharePoint' })
    .click();
  await page.getByRole('menuitem', { name: /Desktop/ }).click();
  await page
    .getByTestId('layout-blocks')
    .getByRole('button', { name: 'Two columns', exact: true })
    .click();
  await page
    .getByTestId('component-sp-text')
    .getByRole('button', { name: 'Heading 2', exact: true })
    .click();
  await page.getByTestId('component-sp-quick-chart').scrollIntoViewIfNeeded();
  await page
    .getByTestId('component-sp-quick-chart')
    .getByRole('button', { name: 'Column', exact: true })
    .click();

  await label(page, 'Desktop 2').click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Convert to NSW' }).click();
  const summary = page.getByRole('dialog', { name: 'Frame converted' });
  await expect(summary.getByTestId('conversion-placeholders')).toContainText('Quick chart');
  await summary.getByRole('button', { name: 'Done' }).click();

  await expect(frames(page)).toHaveCount(3);
  const copy = page.frameLocator('iframe.frame__iframe').nth(2);
  await expect(copy.locator('.nsw-masthead')).toHaveCount(1);
  await expect(copy.locator('h2').first()).toBeVisible();
  await expect(copy.locator('.nsw-in-page-alert')).toContainText('Not converted: Quick chart');
  await expect(page.getByTestId('frame-kit').last()).toHaveText('NSW');
});
