import { test, expect, Page } from '@playwright/test';
let text = "";
async function start(page: Page, url:string) {
	text = "";
	page.on("console", msg => msg.text().startsWith("test ") && (text += msg.text().slice(4)));
	await page.goto(url);
	await expect(page).toHaveTitle("Page 1");
	expect(text).toBe("");
	text = "";
}

test('call', async ({ page, browserName }) => {
	await start(page, 'http://localhost:3000/page2/');
	await new Promise<void>(resolve => setTimeout(resolve, 400));
	expect (text).toBe(" test1-0 test2-0 true true");
	text = "";
});

