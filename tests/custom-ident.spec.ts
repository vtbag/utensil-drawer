import { test, expect } from '@playwright/test';


test('call', async ({ page, browserName }) => {
  let text = "";
	page.on("console", msg => (msg.text().startsWith("test ") && (text += msg.text().slice(4)) && console.log("XXX " + msg.text())));
  await page.goto("http://localhost:3000/page3/");
  await expect(page).toHaveTitle("Page 3");
  await new Promise<void>(resolve => setTimeout(resolve, 1000));
  expect(text).toBe(" 6");
});