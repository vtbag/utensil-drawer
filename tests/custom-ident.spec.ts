import { test, expect, Page } from '@playwright/test';
let text = "";

test('call', async ({ page, browserName }) => {
  text = "";
  page.on("console", msg => msg.text().startsWith("test ") && (text += msg.text().slice(4)));
  await page.goto("http://localhost:3000/page3/");
  await expect(page).toHaveTitle("Page 3");
  await new Promise<void>(resolve => setTimeout(resolve, 600));
  expect(text).toBe(" 6");
  text = "";
});