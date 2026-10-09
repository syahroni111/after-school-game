import type { Page } from '@playwright/test';

export interface GameErrors {
  errors: string[];
  bad: string[];
}

/** Mengumpulkan error konsol, pageerror, dan respons HTTP >= 400 selama tes. */
export function trackErrors(page: Page): GameErrors {
  const out: GameErrors = { errors: [], bad: [] };
  page.on('console', (m) => m.type() === 'error' && out.errors.push(m.text()));
  page.on('pageerror', (e) => out.errors.push(String(e)));
  page.on('response', (r) => r.status() >= 400 && out.bad.push(`${r.status()} ${r.url()}`));
  return out;
}

export async function waitScene(page: Page, name: string, timeout = 30_000): Promise<void> {
  await page.waitForFunction(
    (n) => (window as unknown as { __game?: Phaser.Game }).__game?.scene.isActive(n) === true,
    name,
    { timeout },
  );
}
