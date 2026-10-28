import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 1700, height: 1000 } });

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
  await page.getByRole('tab', { name: 'Templates' }).click();
});

const tiles = (page: Page) => page.locator('[data-testid=template-tile]');

test('in every NSW template a section heading sits at least 16px below the item above it', async ({
  page,
}) => {
  const count = await tiles(page).count();
  expect(count).toBeGreaterThan(15);
  const problems: string[] = [];
  for (let i = 0; i < count; i++) {
    const tile = tiles(page).nth(i);
    const name = (await tile.locator('.template__name').textContent()) ?? `#${i}`;
    await tile.locator('button').first().click();
    const frame = page.locator('iframe.frame__iframe').last();
    await expect(frame).toBeVisible();
    await page.waitForTimeout(300);
    const gaps = await frame.evaluate((el) => {
      const doc = (el as HTMLIFrameElement).contentDocument!;
      const out: string[] = [];
      for (const w of doc.querySelectorAll<HTMLElement>('#root [data-node]')) {
        const h = w.querySelector(':scope > h2, :scope > h3, :scope > h4');
        const prev = w.previousElementSibling as HTMLElement | null;
        if (!h || !prev?.hasAttribute('data-node')) continue;
        const gap = w.getBoundingClientRect().top - prev.getBoundingClientRect().bottom;
        if (gap < 16) out.push(`“${h.textContent?.trim().slice(0, 30)}” ${Math.round(gap)}px`);
      }
      return out;
    });
    problems.push(...gaps.map((g) => `${name}: ${g}`));
  }
  expect(problems).toEqual([]);
});

test('the NSW header’s logo space is quiet, not a shouting placeholder', async ({ page }) => {
  await tiles(page).first().locator('button').first().click();
  const frame = page.frameLocator('iframe.frame__iframe').last();
  await expect(frame.locator('svg.nsw-header__rectangular-logo').first()).toBeVisible();
  await expect(frame.locator('svg.nsw-header__rectangular-logo text').first()).not.toHaveText(
    /PLACEHOLDER/,
  );
});

test('the Simple landing page centres its closing button under its heading', async ({ page }) => {
  await page
    .getByRole('group', { name: 'Style kit' })
    .getByRole('button', { name: 'Simple' })
    .click();
  await tiles(page).filter({ hasText: 'Landing page' }).locator('button').first().click();
  const iframe = page.locator('iframe.frame__iframe').last();
  await expect(iframe).toBeVisible();
  await page.waitForTimeout(400);
  const offsets = await iframe.evaluate((el) => {
    const doc = (el as HTMLIFrameElement).contentDocument!;
    const button = [
      ...doc.querySelectorAll<HTMLElement>('.sk-section--bg-accent .sk-button'),
    ].pop()!;
    const heading = doc.querySelector<HTMLElement>('.sk-section--bg-accent h2')!;
    const mid = (e: HTMLElement) =>
      e.getBoundingClientRect().left + e.getBoundingClientRect().width / 2;
    return { button: mid(button), heading: mid(heading), width: doc.documentElement.clientWidth };
  });
  expect(Math.abs(offsets.button - offsets.heading)).toBeLessThan(3);
});

test('Simple frame panel shows the page accent swatches only once you opt in, and names the background choices', async ({
  page,
}) => {
  await page
    .getByRole('group', { name: 'Style kit' })
    .getByRole('button', { name: 'Simple' })
    .click();
  await tiles(page).filter({ hasText: 'Landing page' }).locator('button').first().click();
  await page.locator('.frame__label').last().click();
  const panel = page.getByTestId('properties-body');
  await expect(panel.getByRole('group', { name: 'Accent colour on this page' })).toHaveCount(0);
  await expect(panel).not.toContainText('Turn on “Use a different accent” first');
  await panel.getByLabel('Use a different accent on this page').check();
  await expect(panel.getByRole('group', { name: 'Accent colour on this page' })).toBeVisible();
});
