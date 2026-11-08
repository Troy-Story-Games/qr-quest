import { expect, test } from '@playwright/test';

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

test('find-the-eyes quest can be completed', async ({ page }) => {
  await page.goto('./#/quests/find-eyes');
  const code = page.getByRole('img', { name: 'Find the three eyes' });
  for (let round = 0; round < 3; round++) {
    await expect(code).toBeVisible();
    const box = (await code.boundingBox())!;
    // The code has a 2-module quiet zone; eyes sit 3.5 modules in from three corners.
    const size = Number((await code.getAttribute('viewBox'))!.split(' ')[2]) - 4;
    const cell = box.width / (size + 4);
    const at = (mx: number, my: number) => page.mouse.click(box.x + (mx + 2) * cell, box.y + (my + 2) * cell);
    await at(3.5, 3.5);
    await at(size - 3.5, 3.5);
    await at(3.5, size - 3.5);
    // Wait for the next round to slide in before tapping again.
    await page.waitForTimeout(2600);
  }
  await expect(page.getByRole('heading', { name: 'Quest complete!' })).toBeVisible();
});
