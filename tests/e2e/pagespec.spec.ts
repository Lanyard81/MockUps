import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
});

const SPEC = {
  format: 'mockup-page-spec',
  version: 1,
  kit: 'nsw',
  name: 'Imported home',
  device: 'desktop',
  page: [
    { component: 'masthead', variant: 'dark' },
    {
      section: { background: 'off-white' },
      blocks: [
        { component: 'heading', variant: 'h1', text: { text: 'Find a service' } },
        { component: 'search-filters', text: { title: 'x' } },
        {
          row: [6, 6],
          columns: [
            [{ component: 'card', variant: 'sparkly', text: { title: 'Apply', copy: 'Online.' } }],
            [{ component: 'button', variant: 'dark', text: { label: 'Get started' } }],
          ],
        },
      ],
    },
  ],
};

const frames = (page: Page) => page.locator('iframe.frame__iframe');

async function openDialog(page: Page) {
  await page.getByRole('button', { name: 'File' }).click();
  await page.getByRole('menuitem', { name: /Import a page description/ }).click();
  return page.getByRole('dialog', { name: 'Import a page description' });
}

test('importing pasted JSON from the dialog adds a frame, reports, and undoes in one step', async ({
  page,
}) => {
  const dialog = await openDialog(page);
  await expect(dialog.getByRole('button', { name: 'Import', exact: true })).toBeDisabled();
  await dialog.getByLabel('Page description (JSON)').fill(JSON.stringify(SPEC));
  await dialog.getByRole('button', { name: 'Import', exact: true }).click();

  await expect(frames(page)).toHaveCount(1);
  const frame = page.frameLocator('iframe[title="Imported home"]');
  await expect(frame.locator('h1')).toHaveText('Find a service');
  await expect(frame.locator('.nsw-in-page-alert')).toContainText('search-filters');

  // The report: components, placeholders and the repaired variant, with details one click away.
  const report = page.getByRole('dialog', { name: 'Page imported' });
  await expect(report.getByTestId('import-summary-line')).toContainText('Imported 4 components.');
  await expect(report.getByTestId('import-summary-line')).toContainText('1 placeholder');
  await expect(report.getByTestId('import-summary-line')).toContainText('1 unknown variant');
  await report.getByText('Details').click();
  await expect(report.getByTestId('import-placeholders')).toContainText('search-filters');
  await report.getByRole('button', { name: 'Done' }).click();

  // The report stays in the frame's Properties until dismissed.
  await expect(page.getByTestId('import-report')).toBeVisible();
  await page.getByRole('button', { name: 'Dismiss report' }).click();
  await expect(page.getByTestId('import-report')).toHaveCount(0);

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(frames(page)).toHaveCount(1);
});

test('pasting page spec JSON into the editor imports it', async ({ page }) => {
  await page.evaluate((text) => {
    const dt = new DataTransfer();
    dt.setData('text/plain', text);
    window.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }),
    );
  }, JSON.stringify(SPEC));
  await expect(frames(page)).toHaveCount(1);
  await expect(page.getByRole('dialog', { name: 'Page imported' })).toBeVisible();
});

test('pasting ordinary text does nothing', async ({ page }) => {
  await page.evaluate(() => {
    const dt = new DataTransfer();
    dt.setData('text/plain', 'hello');
    window.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }),
    );
  });
  await expect(frames(page)).toHaveCount(1);
});

test('dropping a .page.json file imports it; several pages make several frames', async ({
  page,
}) => {
  const multi = {
    format: 'mockup-page-spec',
    version: 1,
    pages: [
      { name: 'First', kit: 'nsw', page: [{ component: 'heading', variant: 'h1' }] },
      {
        name: 'Second',
        kit: 'sharepoint',
        page: [{ section: { layout: 'two-columns' }, columns: [[{ component: 'sp-text' }], []] }],
      },
    ],
  };
  await page.evaluate((text) => {
    const dt = new DataTransfer();
    dt.items.add(new File([text], 'pages.page.json', { type: 'application/json' }));
    window.dispatchEvent(
      new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }),
    );
  }, JSON.stringify(multi));
  await expect(frames(page)).toHaveCount(2);
  await expect(page.getByTestId('frame-First').getByTestId('frame-kit')).toHaveText('NSW');
  await expect(page.getByTestId('frame-Second').getByTestId('frame-kit')).toHaveText('SharePoint');
  await expect(page.getByRole('dialog', { name: '2 pages imported' })).toBeVisible();
});

test('a spec file chosen in the dialog imports; bad text is explained and changes nothing', async ({
  page,
}) => {
  const dialog = await openDialog(page);
  await dialog.getByLabel('Page description (JSON)').fill('{"nope": true}');
  await dialog.getByRole('button', { name: 'Import', exact: true }).click();
  await expect(page.getByText(/isn’t a page spec/)).toBeVisible();
  await expect(frames(page)).toHaveCount(1);

  await dialog.getByLabel('Page description file').setInputFiles({
    name: 'home.page.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(SPEC)),
  });
  await expect(frames(page)).toHaveCount(1);
});

test('a frame goes out as a page spec and comes back as the same page', async ({ page }) => {
  // Build a page, download it as a page spec, and import the file: the copy matches the original.
  const dialog = await openDialog(page);
  await dialog.getByLabel('Page description (JSON)').fill(JSON.stringify(SPEC));
  await dialog.getByRole('button', { name: 'Import', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Page imported' })
    .getByRole('button', { name: 'Done' })
    .click();

  await page.getByTestId('frame-Imported home').locator('.frame__label').click({ button: 'right' });
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('menuitem', { name: 'Download page description (.page.json)' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('imported-home.page.json');
  const text = readFileSync(await download.path(), 'utf8');
  const spec = JSON.parse(text);
  expect(spec).toMatchObject({ format: 'mockup-page-spec', kit: 'nsw', name: 'Imported home' });

  await page.evaluate((t) => {
    const dt = new DataTransfer();
    dt.setData('text/plain', t);
    window.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }),
    );
  }, text);
  await expect(frames(page)).toHaveCount(2);
  const html = (title: string) =>
    page.frameLocator(`iframe[title="${title}"]`).locator('#root').innerHTML();
  const strip = (h: string) =>
    h.replace(/ data-node="[^"]*"| id="[^"]*"| for="[^"]*"| aria-[a-z]+="[^"]*"/g, '');
  expect(strip(await html('Imported home 2')).length).toBeGreaterThan(0);
  expect(strip(await html('Imported home'))).toBe(strip(await html('Imported home 2')));
});

test('File menu copies the instructions for each kit', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'File' }).click();
  await page.getByRole('menuitem', { name: /Copy AI instructions \(SharePoint\)/ }).click();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toContain('Recreate the attached screenshot as a page spec');
  expect(text).toContain('`sp-news`');
  expect(text).not.toContain('`masthead`');
});
