import { test, expect, Page } from '@playwright/test';
let text = "";
async function start(page: Page, url: string) {
	text = "";
	page.on("console", msg => msg.text().startsWith("test ") && (text += msg.text().slice(4)));
	await page.goto(url);
	await expect(page).toHaveTitle("Page 1");
	expect(text).toBe("");
	text = "";
}

test('call', async ({ page, browserName }) => {
	//	test.skip(browserName === 'firefox', "not for firefox");
	await start(page, 'http://localhost:3000/page1/');
	await page.locator('button').click();
	await new Promise<void>(resolve => setTimeout(resolve, 1000));
	expect(text).toBe(browserName === "firefox"
		? " update1 start update2 done undefined finished"
		: " start update1 update2 done ::view-transition-group(root) finished");
});

/*
test('call_ff', async ({ page, browserName }) => {
	test.skip(browserName !== 'firefox', "only for firefox");
	await start(page, 'http://localhost:3000/page1/');
	await page.locator('button').click();
	await new Promise<void>(resolve => setTimeout(resolve, 1000));
	expect (text).toBe(" update1 start update2 done undefined finished");
});
*/