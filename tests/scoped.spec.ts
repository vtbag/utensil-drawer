import { test, expect } from '@playwright/test';

test.skip(({ browserName }) => browserName !== 'chromium', 'no experimental web platform features');

test.use({
	launchOptions: {
		args: ['--enable-experimental-web-platform-features']
	}
});

test('three parallel calls, two on the same element scope', async ({ page, browserName }) => {
	let text = "";
	page.on("console", msg => (msg.text().startsWith("test ") && (text += msg.text().slice(4, 35))));

	await page.goto('http://localhost:3000/page1/');
	await expect(page).toHaveTitle("Page 1");
	await page.locator('#b10').click();
	await new Promise<void>(resolve => setTimeout(resolve, 1500));
	expect(text).toBe("  true  true  hi  true  true  ho  true  true  ho hu update2  ho hu update3  ho hu update1  hi update1b done ::view-transition-group(foo) update2b update3b done done ::view-transition-group(bar) ::view-transition-group(bar) finished finished finished");
});