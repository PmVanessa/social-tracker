/**
 * LinkedIn scraper — public company/person pages.
 * Reliability: VERY LOW. LinkedIn redirects anonymous visitors to a login wall
 * before rendering any post content.
 *
 * This scraper captures the small amount of profile data that sometimes renders
 * before the redirect, but post history is not accessible without authentication.
 *
 * NOTE: To enable LinkedIn scraping, inject authenticated cookies via
 * LINKEDIN_COOKIES env var (JSON array of cookie objects from a logged-in session).
 */

import { launchBrowser, newPage } from '../lib/browser.js'

export async function scrapeLinkedIn(handle, isPersonal = false) {
  const browser = await launchBrowser()
  const posts = []

  try {
    const page = await newPage(browser)
    const baseUrl = isPersonal
      ? `https://www.linkedin.com/in/${handle}/recent-activity/all/`
      : `https://www.linkedin.com/company/${handle}/posts/`

    // Inject cookies if provided (for future authenticated scraping)
    if (process.env.LINKEDIN_COOKIES) {
      try {
        const cookies = JSON.parse(process.env.LINKEDIN_COOKIES)
        await page.context().addCookies(cookies)
      } catch {}
    }

    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(3000)

    // Check for login wall
    const isGated = await page.$('form[action*="login"], .sign-in-modal, #join-form')
    if (isGated) {
      return { posts: [], error: 'Login wall — LinkedIn requires authentication' }
    }

    // If cookies were provided and we're past the wall, try to extract posts
    const postLinks = await page.$$eval(
      'a[href*="/feed/update/"]',
      (els) => els.map((el) => el.getAttribute('href')).filter(Boolean)
    )

    const seen = new Set()
    for (const href of postLinks) {
      const match = href.match(/urn:li:activity:(\d+)/)
      if (!match || seen.has(match[1])) continue
      seen.add(match[1])
      posts.push({
        platformPostId: match[1],
        postUrl: `https://www.linkedin.com/feed/update/urn:li:activity:${match[1]}/`,
        postedAt: null, // timestamps not easily available without parsing post details
        contentSnippet: null,
      })
    }

    if (posts.length === 0) {
      return { posts: [], error: 'No posts found — likely behind login wall' }
    }

    return { posts, error: null }
  } catch (err) {
    return { posts, error: err.message }
  } finally {
    await browser.close()
  }
}
