import { chromium } from 'playwright'

// Shared browser args that help avoid bot detection and work in CI
const LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-blink-features=AutomationControlled',
  '--disable-infobars',
]

const DEFAULT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

export async function launchBrowser() {
  return chromium.launch({ headless: true, args: LAUNCH_ARGS })
}

export async function newPage(browser) {
  const context = await browser.newContext({
    userAgent: DEFAULT_UA,
    locale: 'en-US',
    timezoneId: 'Europe/London',
    viewport: { width: 1280, height: 900 },
    // Remove webdriver flag
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
  })

  // Mask navigator.webdriver
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
  })

  return context.newPage()
}

export async function dismissCookieBanner(page) {
  const selectors = [
    '[aria-label="Accept all"]',
    '[aria-label="Accept All"]',
    'button:has-text("Accept all")',
    'button:has-text("Accept All")',
    'button:has-text("Allow all cookies")',
    'button:has-text("I Accept")',
    '#onetrust-accept-btn-handler',
  ]
  for (const sel of selectors) {
    try {
      await page.click(sel, { timeout: 2500 })
      return
    } catch {}
  }
}
