import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1700, height: 1000 } });

const SPEC = {
  format: 'mockup-page-spec',
  version: 1,
  kit: 'nsw',
  name: 'Wide word',
  device: 'desktop',
  page: [
    {
      section: {},
      blocks: [
        { component: 'heading', variant: 'h1', text: { text: 'WWWWWWWWWWWWWWWWWWWWWWWW' } },
        { component: 'paragraph', text: { text: 'An ordinary sentence that wraps happily.' } },
      ],
    },
  ],
};

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
});

test('shows the page at three widths and flags what does not fit, selectable from the list', async ({
  page,
}) => {
  await page.evaluate((text) => {
    const dt = new DataTransfer();
    dt.setData('text/plain', text);
    window.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }),
    );
  }, JSON.stringify(SPEC));
  await page
    .getByRole('dialog', { name: 'Page imported' })
    .getByRole('button', { name: 'Done' })
    .click();

  await page.getByTestId('frame-Wide word').locator('.frame__label').click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Check responsive layouts…' }).click();
  const dialog = page.getByRole('dialog', { name: 'Responsive view: Wide word' });
  await expect(dialog.getByRole('region')).toHaveCount(3);

  // A phone is too narrow for that word; a desktop is not.
  await expect(dialog.getByTestId('issues-iphone')).toContainText('Wider than the screen');
  await expect(dialog.getByTestId('issues-desktop')).toContainText('No problems found');

  // The named component can be picked: the dialog closes and it is selected in the editor.
  await dialog
    .getByTestId('issues-iphone')
    .getByRole('button', { name: /Heading/ })
    .first()
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByTestId('properties-body')).toContainText('Heading');
});

test('a freeform frame says it does not reflow', async ({ page }) => {
  await page.getByRole('button', { name: 'Add page' }).click();
  await page
    .getByRole('group', { name: 'Layout for the new page' })
    .getByRole('button', { name: 'Free' })
    .click();
  await page.getByRole('menuitem', { name: /Desktop/ }).click();
  await page.getByTestId('frame-Desktop 2').locator('.frame__label').click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Check responsive layouts…' }).click();
  await expect(page.getByTestId('responsive-free')).toBeVisible();
});
