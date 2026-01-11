import { test, expect } from '@playwright/test';

test('API called once', async ({ page, browserName }) => {

	let text = "";
	page.on("console", msg => (msg.text().startsWith("test ") && (text += msg.text().slice(4, 35))));

	await page.goto('http://localhost:3000/page1/');
	await expect(page).toHaveTitle("Page 1");
	await page.locator('#b1').click();
	await new Promise<void>(resolve => setTimeout(resolve, 1000));
	console.log(await page.evaluate("navigator.userAgent"))
	expect(text).toBe(" start update1  update1b done ::view-transition-group(root) finished");
});

test('two unchained calls', async ({ page, browserName }) => {

	let text = "";
	page.on("console", msg => (msg.text().startsWith("test ") && (text += msg.text().slice(4, 29))));

	await page.goto('http://localhost:3000/page1/');
	await expect(page).toHaveTitle("Page 1");
	await page.locator('#b2').click();
	await new Promise<void>(resolve => setTimeout(resolve, 1000));
	expect(text).toBe(browserName === "firefox"
		? "  true   true  ready error Error update1  update2  update1b done finished update2b done ::view-transition-group( finished"
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
		? "  true   true  update1  update2  update1b update2b done done ::view-transition-group(root) ::view-transition-group(root) finished finished"
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
		? "  true   true  update1  update2  update1b update2b done done ::view-transition-group(root) ::view-transition-group(root) finished finished"
		: "  true  hi  true  hi ho update1  hi ho update2  hi ho update1b update2b done done ::view-transition-group(root) ::view-transition-group(root) finished finished");
});

test('two asynchronous chained calls', async ({ page, browserName }) => {

	let text = "";
	page.on("console", msg => (msg.text().startsWith("test ") && (text += msg.text().slice(4, 35))));

	await page.goto('http://localhost:3000/page1/');
	await expect(page).toHaveTitle("Page 1");
	await page.locator('#b5').click();
	await new Promise<void>(resolve => setTimeout(resolve, 1500));
	expect(text).toBe(browserName === "firefox"
		? "  true   true  update1  update2  update1b update2b done done ::view-transition-group(root) ::view-transition-group(root) finished finished"
		: "  true  hi  true  hi ho update1  hi ho update2  hi ho update1b update2b done done ::view-transition-group(root) ::view-transition-group(root) finished finished");
});


test('one plus two chained calls', async ({ page, browserName }) => {
	let text = "";
	page.on("console", msg => (msg.text().startsWith("test ") && (text += msg.text().slice(4, 35))));

	await page.goto('http://localhost:3000/page1/');
	await expect(page).toHaveTitle("Page 1");
	await page.locator('#b6').click();
	await new Promise<void>(resolve => setTimeout(resolve, 1500));
	expect(text).toBe(browserName === "firefox"
		? "  true  update1   true  ho update1b done ::view-transition-group(root)  true  ha finished update2  update3  update2b update3b done done ::view-transition-group(root) ::view-transition-group(root) finished finished"
		: "  true  hi update1  hi  true  ho update1b done ::view-transition-group(root)  true  ha finished update2  ho he ha hu update3  ho he ha hu update2b update3b done done ::view-transition-group(root) ready2  ho he ha hu x2 ::view-transition-group(root) finished finished");
});

test('second call interrupts during update', async ({ page, browserName }) => {

	let text = "";
	page.on("console", msg => (msg.text().startsWith("test ") && (text += msg.text().slice(4, 29))));

	await page.goto('http://localhost:3000/page1/');
	await expect(page).toHaveTitle("Page 1");
	await page.locator('#b7').click();
	await new Promise<void>(resolve => setTimeout(resolve, 1000));
	expect(text).toBe(browserName === "firefox"
		? "  true  update1   true  ready error Error update2  update1b done finished update2b done ::view-transition-group( finished"
		: "  true  hi update1  hi  true  ho ready error AbortError:  update2  ho update1b done finished update2b done ::view-transition-group( finished");
});



test('polyfill types come and go', async ({ page, browserName }) => {

	let text = "";
	page.on("console", msg => (msg.text().startsWith("test ") && (text += msg.text().slice(4, 100))));

	await page.goto('http://localhost:3000/page1/');
	await expect(page).toHaveTitle("Page 1");
	await page.locator('#b8').click();
	await new Promise<void>(resolve => setTimeout(resolve, 1000));
	expect(text).toBe(" good vtbag-vtt-good vtbag-vtt-ugly good vtbag-vtt-good vtbag-vtt-ugly vtbag-vtt-0 vtbag-vtt-bad good vtbag-vtt-good");
});

test('polyfill remote control', async ({ page, browserName }) => {

	let text = "";
	page.on("console", msg => (msg.text().startsWith("test ") && (text += msg.text().slice(4, 59))));

	await page.goto('http://localhost:3000/page1/');
	await expect(page).toHaveTitle("Page 1");
	await page.locator('#b9').click();
	await new Promise<void>(resolve => setTimeout(resolve, 1000));
	expect(text).toBe(" initial vtbag-vtt-0 vtbag-vtt-rc-1 true  rc-1 rc-2 initial vtbag-vtt-0 vtbag-vtt-rc-1 vtbag-vtt-rc-2 true  rc-3 initial vtbag-vtt-0 vtbag-vtt-rc-1 vtbag-vtt-rc-2 true  rc-3 rc-4 initial vtbag-vtt-0 vtbag-vtt-rc-3 vtbag-vtt-rc-4 initial");
});