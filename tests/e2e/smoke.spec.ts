import { expect, test, type Page } from '@playwright/test';

test('home shows every activity', async ({ page }) => {
  await page.goto('./');
  for (const name of [
    'Make a Code',
    'How It Works',
    'Quests',
    'Scanner',
    'Scratch Lab',
    'Decorate',
    'Treasure Hunt',
  ]) {
    await expect(page.getByRole('button', { name: new RegExp(name) })).toBeVisible();
  }
});

test('making a code awards XP', async ({ page }) => {
  await page.goto('./#/make');
  await page.getByRole('textbox').first().fill('Hello from the test!');
  await page.getByRole('button', { name: /Make it!/ }).click();
  await expect(page.getByText('+10 XP')).toBeVisible();
  await expect(page.getByRole('img', { name: /QR code for: Hello from the test!/ })).toBeVisible();
});

test('walkthrough reaches the end', async ({ page }) => {
  await page.goto('./#/learn');
  const next = page.getByRole('button', { name: 'Next', exact: true });
  await expect(next).toBeVisible();
  while (await next.isVisible()) await next.click();
  await expect(page.getByText('Ta-da!')).toBeVisible();
});

/** Taps the centre of module (mx, my) on a QrView with a 2-module quiet zone. */
async function tapModule(page: Page, label: string, mx: number, my: number) {
  const code = page.getByRole('img', { name: label });
  await code.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const box = (await code.boundingBox())!;
  const total = Number((await code.getAttribute('viewBox'))!.split(' ')[2]);
  const cell = box.width / total;
  await page.mouse.click(box.x + (mx + 2.5) * cell, box.y + (my + 2.5) * cell);
}

async function codeSize(page: Page, label: string) {
  return Number((await page.getByRole('img', { name: label }).getAttribute('viewBox'))!.split(' ')[2]) - 4;
}

/** Start with enough XP to have every quest unlocked. */
async function unlockQuests(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'kidqr-progress',
      JSON.stringify({
        state: {
          xp: 600,
          stats: {},
          questStars: {},
          badges: ['royal'],
          streak: { count: 0, lastDay: null },
          dailyDoneOn: null,
          buildLevelStars: {},
        },
        version: 1,
      }),
    );
  });
}

test('find-the-eyes round 1 finds the three big eyes', async ({ page }) => {
  await page.goto('./#/quests/find-eyes');
  const label = 'Find the eyes';
  await expect(page.getByRole('img', { name: label })).toBeVisible();
  const size = await codeSize(page, label);
  await tapModule(page, label, 3, 3);
  await tapModule(page, label, size - 4, 3);
  await tapModule(page, label, 3, size - 4);
  // Round 2 is a bigger code with a little eye as well.
  await expect(page.getByText(/3 big and \d+ little/)).toBeVisible({ timeout: 5000 });
});

test('walkthrough starts by showing the finished code', async ({ page }) => {
  await page.goto('./#/learn');
  const code = page.getByRole('img', { name: 'QR code being built' });
  await expect(code).toBeVisible();
  expect(await code.locator('path').count()).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByText('Three big eyes')).toBeVisible();
});

test('build-a-qr level 1 can be completed', async ({ page }) => {
  await unlockQuests(page);
  await page.goto('./#/quests/build-a-qr/1');
  const label = 'QR code being built by hand';
  await expect(page.getByRole('img', { name: label })).toBeVisible();
  const size = await codeSize(page, label);
  for (const [x, y] of [
    [3, 3],
    [size - 4, 3],
    [3, size - 4],
  ]) {
    await page.getByRole('button', { name: /^Eye$/ }).first().click();
    await tapModule(page, label, x, y);
  }
  await page.getByRole('button', { name: /Mix it up/ }).click();
  await expect(page.getByText('It scans!')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Level 1 complete!' })).toBeVisible({ timeout: 5000 });
});
