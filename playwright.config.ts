import { defineConfig } from '@playwright/test'
import { existsSync } from 'node:fs'
export default defineConfig({
  testDir: './tests', fullyParallel: true, workers: 2, retries: 0, reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:5173', timezoneId: 'Asia/Hebron', viewport: { width: 1440, height: 1100 }, launchOptions: { executablePath: process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), args: ['--no-sandbox'] }, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: 'npm run dev -- --strictPort', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI }
})
