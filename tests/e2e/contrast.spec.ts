import { expect, test } from '@playwright/test';
import { runAxe } from './axe';

for (const theme of ['dark', 'light']) {
  test(`axe finds no colour-contrast failures in the ${theme} editor`, async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem('pagewright.theme', t), theme);
    await page.goto('./');
    await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
    const violations = await runAxe(page, ['color-contrast']);
    expect(
      violations.map((v) => `${v.id}: ${v.nodes.map((n) => JSON.stringify(n.target)).join(', ')}`),
    ).toEqual([]);
  });
}

test('the axe check can fail: it catches a low-contrast sample', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => {
    const p = document.createElement('p');
    p.id = 'bad';
    p.textContent = 'Pale grey on white';
    p.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;color:#aaa;background:#fff';
    document.body.append(p);
  });
  const violations = await runAxe(page, ['color-contrast']);
  expect(violations.map((v) => v.id)).toContain('color-contrast');
});
