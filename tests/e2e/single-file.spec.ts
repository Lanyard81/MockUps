import { expect, test } from '@playwright/test';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const file = resolve('dist-single/nsw-mockup-builder.html');

test('single file works from disk with no network', async ({ page, context }) => {
  test.skip(!existsSync(file), 'run npm run build:single first');
  const requests: string[] = [];
  page.on('request', (r) => {
    if (/^https?:/.test(r.url())) requests.push(r.url());
  });
  await context.setOffline(true);
  await page.goto(`file://${file}`);
  const home = page.frameLocator('iframe[title="Home"]');
  await expect(home.locator('.nsw-button--dark').first()).toHaveCSS(
    'background-color',
    'rgb(0, 38, 100)',
  );
  const fonts = await page.locator('iframe[title="Home"]').evaluate((f) => {
    const doc = (f as HTMLIFrameElement).contentDocument!;
    return [doc.fonts.check('16px "Public Sans"'), doc.fonts.check('24px "Material Icons"')];
  });
  expect(fonts).toEqual([true, true]);
  await page.getByRole('button', { name: 'Add frame' }).click();
  await page.getByRole('menuitem', { name: /Android/ }).click();
  await expect(page.locator('.frame')).toHaveCount(2);
  expect(requests).toEqual([]);
});
