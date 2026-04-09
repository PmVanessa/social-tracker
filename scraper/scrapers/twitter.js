/**
 * X / Twitter scraper — public profiles, no login.
 * Reliability: VERY LOW. Since early 2023 X requires login to view tweets.
 * The page renders a "Sign in to see more" wall almost immediately.
 *
 * This scraper captures any tweets that load before the wall kicks in.
 * Twitter/X tweet IDs are Snowflake IDs — timestamp can be decoded.
 *
 * NOTE: To reliably scrape X you need authenticated cookies injected via
 * TWITTER_COOKIES env var. This scraper works without them but will usually
 * return 0 posts.
 */

import { launchBrowser, newPage, dismissCookieBanner } from '../lib/browser.js'
import { parseCookieEnv } from '../lib/cookies.js'

// Snowflake ID epoch: 2006-03-21T20:50:14.000Z
const TWITTER_EPOCH = 1288834974657n

function extractTimestampFromTweetId(tweetId) {
  try {
    const id = BigInt(tweetId)
    const ms = (id >> 22n) + TWITTER_EPOCH
    return new Date(Number(ms)).toISOString()
  } catch {}
  return null
}

export async function scrapeTwitter(handle) {
  const browser = await launchBrowser()
  const posts = []

  try {
    const page = await newPage(browser)

    // Inject cookies for authenticated access — required for X since 2023
    const cookies = parseCookieEnv(process.env.TWITTER_COOKIES)
    if (cookies) await page.context().addCookies(cookies)

    const url = `https://x.com/${handle}`

    // Intercept GraphQL timeline responses
    page.on('response', async (res) => {
      if (!res.url().includes('UserTweets')) return
      try {
        const json = await res.json()
        const instructions =
          json?.data?.user?.result?.timeline_v2?.timeline?.instructions ?? []
        for (const inst of instructions) {
          for (const entry of inst?.entries ?? []) {
            const tweet =
              entry?.content?.itemContent?.tweet_results?.result?.legacy
            if (!tweet) continue
            const tweetId = tweet.id_str ?? entry.entryId?.replace('tweet-', '')
            posts.push({
              platformPostId: tweetId,
              postUrl: tweetId ? `https://x.com/${handle}/status/${tweetId}` : null,
              postedAt: tweet.created_at
                ? new Date(tweet.created_at).toISOString()
                : extractTimestampFromTweetId(tweetId),
              contentSnippet: tweet.full_text?.slice(0, 200) ?? null,
            })
          }
        }
      } catch {}
    })

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await dismissCookieBanner(page)
    await page.waitForTimeout(4000)

    // Try extracting from DOM (catches anything that loaded before the wall)
    if (posts.length === 0) {
      const tweetLinks = await page.$$eval(
        'a[href*="/status/"]',
        (els) => els.map((el) => el.getAttribute('href')).filter(Boolean)
      )
      const seen = new Set()
      for (const href of tweetLinks) {
        const match = href.match(/\/status\/(\d+)/)
        if (!match || seen.has(match[1])) continue
        seen.add(match[1])
        posts.push({
          platformPostId: match[1],
          postUrl: `https://x.com${href}`,
          postedAt: extractTimestampFromTweetId(match[1]),
          contentSnippet: null,
        })
      }
    }

    if (posts.length === 0) {
      return { posts: [], error: 'Login wall — X requires authentication to view tweets' }
    }

    return { posts, error: null }
  } catch (err) {
    return { posts, error: err.message }
  } finally {
    await browser.close()
  }
}
