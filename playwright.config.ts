import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests',
	workers: 1,
	retries: 1,
	timeout: 10000,
	webServer: {
		command: 'npm run start',
		port: 3000,
		reuseExistingServer: !process.env.CI,
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'], channel: 'chromium', browserName: 'chromium' },
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'], browserName: 'webkit' },
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'], browserName: 'firefox' },
		},
	] 
});
