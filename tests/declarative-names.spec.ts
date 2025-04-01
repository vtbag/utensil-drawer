import { test, expect } from '@playwright/test';
test('call', async ({ page }) => {
	let text = "";
	page.on("console", msg => (msg.text().startsWith("test ") && (text += msg.text().slice(4))));
	await page.goto("http://localhost:3000/page2/");
	await expect(page).toHaveTitle("Page 2");
	await new Promise<void>(resolve => setTimeout(resolve, 1000));
	expect(text).toBe(" te\\~st1-0 test\\!2-0 true true true vtbag-decl-2-1");
});

