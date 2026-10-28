import { expect, test, type Page } from '@playwright/test';
import { addFromLibrary } from './helpers';

/** Interactive controls in the editor (not inside page frames) smaller than `min` px either way. */
async function smallTargets(page: Page, min: number) {
  return page.evaluate((limit) => {
    const sel =
      'button, a[href], select, input:not([type=hidden]), textarea, summary, [role=tab], [role=menuitem], [role=button]';
    const out: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>(sel)) {
      if (el.closest('iframe, .skip-links, .tour, [hidden]')) continue;
      const box =
        el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')
          ? (el.closest('label') ?? el)
          : el;
      const r = box.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.pointerEvents === 'none') continue;
      // The small expand/collapse arrows in a tree only need the WCAG 2.5.8 minimum of 24px.
      const need = el.classList.contains('layer-row__twisty') ? Math.min(limit, 24) : limit;
      if (r.height < need || r.width < need)
        out.push(
          `${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || '').trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`,
        );
    }
    return out;
  }, min);
}

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
});

test('nothing in the editor is smaller than 32px to hit', async ({ page }) => {
  expect(await smallTargets(page, 32)).toEqual([]);
  await addFromLibrary(page, 'card', 'Default');
  await page.frameLocator('iframe[title="Home"]').locator('.nsw-card').first().click();
  expect(await smallTargets(page, 32)).toEqual([]);
  await page.getByRole('tab', { name: 'Layers' }).click();
  expect(await smallTargets(page, 32)).toEqual([]);
  await page.locator('.frame__label').first().click();
  expect(await smallTargets(page, 32)).toEqual([]);
});
