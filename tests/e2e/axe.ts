import type { Page } from '@playwright/test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export interface AxeViolation {
  id: string;
  impact?: string | null;
  nodes: { target: unknown }[];
}

/** Run axe-core on the editor (not the page frames) and return its violations. */
export async function runAxe(page: Page, rules?: string[]): Promise<AxeViolation[]> {
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  return page.evaluate(async (only) => {
    const axe = (
      window as unknown as {
        axe: { run: (c: unknown, o: unknown) => Promise<{ violations: AxeViolation[] }> };
      }
    ).axe;
    const result = await axe.run(document, {
      iframes: false,
      ...(only ? { runOnly: only } : {}),
    });
    return result.violations;
  }, rules ?? null);
}
