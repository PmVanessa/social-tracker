/**
 * TikTok scraper — public profiles, no login required.
 * Reliability: HIGH. TikTok still serves public profile pages to anonymous visitors.
 *
 * Returns posts with video URLs and approximate timestamps.
 * TikTok video IDs are snowflake-like: upper bits encode creation time (seconds since epoch).
 */

import { launchBrowser, newPage, dismissCookieBanner } from '../lib/browser.js'

const TIKTOK_EPOCH_SHIFT = 32n // TikTok encodes unix timestamp in top 32 bits of 64-bit ID

function extractTimestampFromTikTokId(videoId) {
  try {
    const id = BigInt(videoId)
    const seconds = id >> TIKTOK_EPOCH_SHIFT
    if (seconds > 1_000_000_000n && seconds < 2_000_000_000n) {
      return new Date(Number(seconds) * 1000).toISOString()
    }
  } catch {}
  return null
}

export async function scrapeTikTok(handle) {
  const browser = await launchBrowser()
  const posts = []

  try {
    const page = await newPage(browser)
    const url = `https://www.tiktok.com/@${handle}`

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await dismissCookieBanner(page)

    // Wait for the video grid
    try {
      await page.waitForSelector('[data-e2e="user-post-item"]', { timeout: 15000 })
    } catch {
      // Some accounts have 0 videos or a different selector
      return { posts: [], error: 'No video grid found — account may be private or empty' }
    }

    // Scroll to load more (3 viewport heights worth)
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight))
      await page.waitForTimeout(1200)
    }

    const items = await page.$$('[data-e2e="user-post-item"]')

    for (const item of items) {
      const anchor = await item.$('a[href*="/video/"]')
      if (!anchor) continue

      const href = await anchor.getAttribute('href')
      if (!href) continue

      const videoId = href.match(/\/video\/(\d+)/)?.[1]
      const postUrl = href.startsWith('http') ? href : `https://www.tiktok.com${href}`
      const postedAt = videoId ? extractTimestampFromTikTokId(videoId) : null

      posts.push({ platformPostId: videoId ?? null, postUrl, postedAt, contentSnippet: null })
    }

    return { posts, error: null }
  } catch (err) {
    return { posts, error: err.message }
  } finally {
    await browser.close()
  }
}
