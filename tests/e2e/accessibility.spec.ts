import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1700, height: 1000 } });

const SPEC = {
  format: 'mockup-page-spec',
  version: 1,
  kit: 'nsw',
  name: 'Skippy',
  device: 'desktop',
  page: [
    {
      section: {},
      blocks: [
        { component: 'heading', variant: 'h1', text: { text: 'Main title' } },
        { component: 'heading', variant: 'h4', text: { text: 'Deep title' } },
      ],
    },
  ],
};

test('lists heading problems and selects the component from the list', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
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

  await page.getByTestId('frame-Skippy').locator('.frame__label').click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Check accessibility…' }).click();
  const dialog = page.getByRole('dialog', { name: 'Accessibility: Skippy' });
  const results = dialog.getByTestId('a11y-results');
  await expect(results).toContainText('Deep title');
  await expect(results).toContainText('Don’t skip heading levels');
  await results
    .getByRole('button', { name: /Heading/ })
    .first()
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByTestId('properties-body')).toContainText('Heading');
});
