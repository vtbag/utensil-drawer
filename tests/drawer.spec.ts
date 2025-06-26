import { test, expect } from '@playwright/test';

test('API called once', async ({ page, browserName }) => {

	let text = "";
	page.on("console", msg => (msg.text().startsWith("test ") && (text += msg.text().slice(4, 35))));

	await page.goto('http://localhost:3000/page1/');
	await expect(page).toHaveTitle("Page 1");
	await page.locator('#b1').click();
	await new Promise<void>(resolve => setTimeout(resolve, 1000));
	expect(text).toBe(browserName === "firefox"
		? " start update1  update1b done undefined finished"
		: " start update1  update1b done ::view-transition-group(root) finished");
});

test('two unchained calls', async ({ page, browserName }) => {

	let text = "";
	page.on("console", msg => (msg.text().startsWith("test ") && (text += msg.text().slice(4, 29))));

	await page.goto('http://localhost:3000/page1/');
	await expect(page).toHaveTitle("Page 1");
	await page.locator('#b2').click();
	await new Promise<void>(resolve => setTimeout(resolve, 1000));
	expect(text).toBe(browserName === "firefox"
		? "  true  hi  true  ho update1  ho update2  ho update1b done undefined finished update2b done undefined finished"
		: "  true  hi  true  ho ready error AbortError:  update1  ho update2  ho update1b done finished update2b done ::view-transition-group( finished");
});

test('two chained calls', async ({ page, browserName }) => {

	let text = "";
	page.on("console", msg => (msg.text().startsWith("test ") && (text += msg.text().slice(4, 35))));

	await page.goto('http://localhost:3000/page1/');
	await expect(page).toHaveTitle("Page 1");
	await page.locator('#b3').click();
	await new Promise<void>(resolve => setTimeout(resolve, 1000));
	expect(text).toBe(browserName === "firefox"
		? "  true  hi  false  ho update1  ho update2  ho update1b done undefined finished update2b done undefined finished"
		: "  true  hi  true  hi ho update1  hi ho update2  hi ho update1b update2b done done ::view-transition-group(root) ::view-transition-group(root) finished finished");
});

test('chained call after busy-waiting', async ({ page, browserName }) => {

	let text = "";
	page.on("console", msg => (msg.text().startsWith("test ") && (text += msg.text().slice(4, 35))));

	await page.goto('http://localhost:3000/page1/');
	await expect(page).toHaveTitle("Page 1");
	await page.locator('#b4').click();
	await new Promise<void>(resolve => setTimeout(resolve, 1000));
	expect(text).toBe(browserName === "firefox"
		? "  true  hi  false  ho update1  ho update2  ho update1b done undefined finished update2b done undefined finished"
		: "  true  hi  true  hi ho update1  hi ho update2  hi ho update1b update2b done done ::view-transition-group(root) ::view-transition-group(root) finished finished");
});

test('two asynchronous chained calls', async ({ page, browserName }) => {

	let text = "";
	page.on("console", msg => (msg.text().startsWith("test ") && (text += msg.text().slice(4, 35))));

	await page.goto('http://localhost:3000/page1/');
	await expect(page).toHaveTitle("Page 1");
	await page.locator('#b5').click();
	await new Promise<void>(resolve => setTimeout(resolve, 1000));
	expect(text).toBe(browserName === "firefox"
		? "  true  hi  false  ho update1  ho update2  ho update1b done undefined finished update2b done undefined finished"
		: "  true  hi  true  hi ho update1  hi ho update2  hi ho update1b update2b done done ::view-transition-group(root) ::view-transition-group(root) finished finished");
});


test('one plus two chained calls', async ({ page, browserName }) => {
	test.fixme(!!process.env.CI && browserName === 'firefox', "This test is flaky on CI");
	let text = "";
	page.on("console", msg => (msg.text().startsWith("test ") && (text += msg.text().slice(4, 35))));

	await page.goto('http://localhost:3000/page1/');
	await expect(page).toHaveTitle("Page 1");
	await page.locator('#b6').click();
	await new Promise<void>(resolve => setTimeout(resolve, 1000));
	expect(text).toBe(browserName === "firefox"
		? "  true  hi update1  hi  true  ho done undefined finished update1b done undefined finished  true  ha ready2  ho he update2  ha hu x2 update3  ha hu x2 update2b update3b done undefined finished"
		: "  true  hi update1  hi  true  ho update1b done ::view-transition-group(root)  true  ha finished update2  ho he ha hu update3  ho he ha hu update2b update3b done done ::view-transition-group(root) ready2  ho he ha hu x2 ::view-transition-group(root) finished finished");
});