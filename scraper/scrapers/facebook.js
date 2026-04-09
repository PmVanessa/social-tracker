/**
 * Facebook scraper — public pages.
 * Reliability: VERY LOW. Facebook requires login to view page posts.
 * This scraper captures any public metadata visible before the auth gate.
 *
 * NOTE: To enable Facebook scraping, inject authenticated cookies via
 * FACEBOOK_COOKIES env var (JSON array of cookie objects from a logged-in session).
 */

import { launchBrowser, newPage, dismissCookieBanner } from '../lib/browser.js'
import { parseCookieEnv } from '../lib/cookies.js'

export async function scrapeFacebook(handle) {
  const browser = await launchBrowser()
  const posts = []

  try {
    const page = await newPage(browser)
    const url = `https://www.facebook.com/${handle}`

    // Inject cookies for authenticated access
    const cookies = parseCookieEnv(process.env.FACEBOOK_COOKIES)
    if (cookies) await page.context().addCookies(cookies)

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await dismissCookieBanner(page)
    await page.waitForTimeout(3000)

    // Check for login gate
    const isGated = await page.$('#login_form, [data-testid="royal_login_form"], [data-pagelet="login_with_work_email"]')
    if (isGated) {
      return { posts: [], error: 'Login wall — Facebook requires authentication' }
    }

    // Try to find post permalinks (story URLs) if we're authenticated
    const postLinks = await page.$$eval(
      'a[href*="/posts/"], a[href*="story_fbid="], a[href*="permalink"]',
      (els) =>
        els
          .map((el) => el.getAttribute('href'))
          .filter((h) => h && (h.includes('/posts/') || h.includes('story_fbid=')))
    )

    const seen = new Set()
    for (const href of postLinks) {
      const storyMatch = href.match(/story_fbid=(\d+)/)
      const postMatch = href.match(/\/posts\/(\d+)/)
      const id = storyMatch?.[1] ?? postMatch?.[1]
      if (!id || seen.has(id)) continue
      seen.add(id)
      posts.push({
        platformPostId: id,
        postUrl: href.startsWith('http') ? href : `https://www.facebook.com${href}`,
        postedAt: null,
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
