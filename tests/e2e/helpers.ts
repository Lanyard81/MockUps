import type { Locator, Page } from '@playwright/test';

/** Click a variant tile in the library, e.g. addFromLibrary(page, 'button', 'Brand Dark'). */
export const addFromLibrary = (page: Page, componentId: string, variant: string) =>
  page
    .getByTestId(`component-${componentId}`)
    .getByRole('button', { name: variant, exact: true })
    .click();

export interface Point {
  x: number;
  y: number;
}

/** Page-space centre of a locator. */
export async function centre(loc: Locator): Promise<Point> {
  const b = (await loc.boundingBox())!;
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}

/** Press on `from`, move to `to` in steps, optionally run a check mid-drag, then release. */
export async function dragBetween(
  page: Page,
  from: Point,
  to: Point,
  whileDragging?: () => Promise<void>,
) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + 10, from.y + 10, { steps: 3 });
  await page.mouse.move(to.x, to.y, { steps: 12 });
  if (whileDragging) await whileDragging();
  await page.mouse.up();
}

/** Drag a library tile onto a page position. */
export async function dragTile(
  page: Page,
  componentId: string,
  variant: string,
  to: Point,
  whileDragging?: () => Promise<void>,
) {
  const tile = page
    .getByTestId(`component-${componentId}`)
    .getByRole('button', { name: variant, exact: true });
  await tile.scrollIntoViewIfNeeded();
  await dragBetween(page, await centre(tile), to, whileDragging);
}

export const frameBox = async (page: Page, name: string) =>
  (await page.locator(`iframe[title="${name}"]`).boundingBox())!;
