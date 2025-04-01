import { test, expect } from '@playwright/test';

test('call', async ({ page, browserName }) => {

	let text = "";
	page.on("console", (msg => msg.text().startsWith("test ") && (text += msg.text().slice(4))));
	await page.goto('http://localhost:3000/page1/');
	await expect(page).toHaveTitle("Page 1");
	await page.locator('button').click();
	await new Promise<void>(resolve => setTimeout(resolve, 1000));
	expect(text).toBe(browserName === "firefox"
		? " update1 start update2 done undefined finished"
		: " start update1 update2 done ::view-transition-group(root) finished");
});
