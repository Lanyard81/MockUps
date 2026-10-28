import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { addFromLibrary } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
});

const openShare = async (page: Page) => {
  await page.getByRole('button', { name: 'Share and export' }).click();
  return page.getByRole('dialog', { name: 'Share and export' });
};

test('the Share button lists every way out, each with what it is for', async ({ page }) => {
  await addFromLibrary(page, 'heading', 'Heading 1');
  const dialog = await openShare(page);
  for (const name of [
    /Image \(PNG\)/,
    /PDF document/,
    /Web page \(HTML\)/,
    /Shareable viewer/,
    /Page description/,
  ])
    await expect(dialog.getByLabel(name)).toBeVisible();
  await expect(dialog).toContainText('AI assistant');
  // An NSW page has no build notes (they belong to SharePoint).
  await expect(dialog.getByLabel(/build notes/i)).toHaveCount(0);
});

test('a page description downloads, or copies instead', async ({ page }) => {
  await addFromLibrary(page, 'heading', 'Heading 1');
  const dialog = await openShare(page);
  await dialog.getByLabel(/Page description/).check();
  const [d] = await Promise.all([
    page.waitForEvent('download'),
    dialog.getByRole('button', { name: 'Export', exact: true }).click(),
  ]);
  expect(d.suggestedFilename()).toBe('home.page.json');
  expect(JSON.parse(readFileSync(await d.path(), 'utf8')).format).toBe('mockup-page-spec');
});

test('a SharePoint page offers its build notes, and only for one page', async ({ page }) => {
  await page.getByRole('button', { name: 'Add page' }).click();
  await page
    .getByRole('group', { name: 'Style kit for the new page' })
    .getByRole('button', { name: 'SharePoint' })
    .click();
  await page.getByRole('menuitem', { name: /Desktop/ }).click();
  const dialog = await openShare(page);
  const notes = dialog.getByLabel(/SharePoint build notes/);
  await expect(notes).toBeEnabled();
  await notes.check();
  const [d] = await Promise.all([
    page.waitForEvent('download'),
    dialog.getByRole('button', { name: 'Export', exact: true }).click(),
  ]);
  expect(d.suggestedFilename()).toMatch(/\.build-notes\.md$/);
});

test('a PDF can be made on A4 sheets', async ({ page }) => {
  await addFromLibrary(page, 'heading', 'Heading 1');
  const dialog = await openShare(page);
  await dialog.getByLabel('PDF document').check();
  await dialog.getByLabel('A4 sheets').check();
  const [d] = await Promise.all([
    page.waitForEvent('download'),
    dialog.getByRole('button', { name: 'Export', exact: true }).click(),
  ]);
  const pdf = readFileSync(await d.path()).toString('latin1');
  expect(pdf).toContain('/MediaBox [0 0 595.5 842.25]');
});

test('converting says what each part became and places the copy clear of the others', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Add masthead + header' }).click();
  await addFromLibrary(page, 'heading', 'Heading 1');
  await page.locator('.frame__label').first().click({ button: 'right' });
  await page.getByRole('menuitem', { name: /Convert to SharePoint/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Page converted' });
  await expect(dialog.getByTestId('conversion-mappings')).toContainText('→');
  await expect(dialog.getByTestId('conversion-mappings')).toContainText('Heading');
  await dialog.getByRole('button', { name: 'Done' }).click();
  // The copy is to the right of the original, with the kit in its name once.
  const boxes = await page
    .locator('.frame')
    .evaluateAll((els) =>
      els.map((e) => ({ x: e.getBoundingClientRect().x, w: e.getBoundingClientRect().width })),
    );
  expect(boxes).toHaveLength(2);
  expect(boxes[1]!.x).toBeGreaterThan(boxes[0]!.x + boxes[0]!.w);
  await page.locator('.frame__label').nth(1).click({ button: 'right' });
  await page.getByRole('menuitem', { name: /Convert to NSW/ }).click();
  await page
    .getByRole('dialog', { name: 'Page converted' })
    .getByRole('button', { name: 'Done' })
    .click();
  await expect(page.getByTestId('frame-Home (NSW)')).toBeVisible();
});
