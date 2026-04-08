/**
 * Instagram scraper — public profiles only, no login.
 * Reliability: LOW-MEDIUM. Instagram aggressively gates content behind login.
 * This scraper extracts what it can before the login wall appears.
 *
 * Strategy:
 *  1. Try the shared_data JSON embedded in the page (legacy, often still present briefly)
 *  2. Fall back to extracting post hrefs from the rendered DOM
 *
 * Post timestamps may not be available — posted_at will be null in those cases.
 */

import { launchBrowser, newPage } from '../lib/browser.js'

export async function scrapeInstagram(handle) {
  const browser = await launchBrowser()
  const posts = []

  try {
    const page = await newPage(browser)
    const url = `https://www.instagram.com/${handle}/`

    // Capture any XHR responses that contain post data
    const capturedTimelines = []
    page.on('response', async (res) => {
      const resUrl = res.url()
      if (resUrl.includes('graphql/query') || resUrl.includes('api/v1/feed/user')) {
        try {
          const json = await res.json()
          capturedTimelines.push(json)
        } catch {}
      }
    })

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(3000)

    // --- Strategy 1: extract from captured API responses ---
    for (const json of capturedTimelines) {
      const edges =
        json?.data?.user?.edge_owner_to_timeline_media?.edges ??
        json?.items ??
        []

      for (const edge of edges) {
        const node = edge?.node ?? edge
        const shortcode = node?.shortcode ?? node?.code
        const takenAt = node?.taken_at_timestamp ?? node?.taken_at
        const caption = node?.edge_media_to_caption?.edges?.[0]?.node?.text?.slice(0, 200) ?? null

        if (!shortcode) continue

        posts.push({
          platformPostId: shortcode,
          postUrl: `https://www.instagram.com/p/${shortcode}/`,
          postedAt: takenAt ? new Date(takenAt * 1000).toISOString() : null,
          contentSnippet: caption,
        })
      }
    }

    if (posts.length > 0) return { posts, error: null }

    // --- Strategy 2: parse shared_data from page HTML ---
    const sharedData = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[type="text/javascript"]'))
      for (const s of scripts) {
        if (s.textContent.includes('window._sharedData')) {
          const match = s.textContent.match(/window\._sharedData\s*=\s*(\{.+?\});/)
          if (match) {
            try { return JSON.parse(match[1]) } catch {}
          }
        }
      }
      return null
    })

    const timelineMedia =
      sharedData?.entry_data?.ProfilePage?.[0]?.graphql?.user
        ?.edge_owner_to_timeline_media?.edges ?? []

    for (const { node } of timelineMedia) {
      posts.push({
        platformPostId: node.shortcode,
        postUrl: `https://www.instagram.com/p/${node.shortcode}/`,
        postedAt: node.taken_at_timestamp
          ? new Date(node.taken_at_timestamp * 1000).toISOString()
          : null,
        contentSnippet:
          node.edge_media_to_caption?.edges?.[0]?.node?.text?.slice(0, 200) ?? null,
      })
    }

    if (posts.length > 0) return { posts, error: null }

    // --- Strategy 3: extract post links from DOM (no timestamps) ---
    const hrefs = await page.$$eval('a[href*="/p/"]', (els) =>
      els.map((el) => el.getAttribute('href')).filter(Boolean)
    )

    const seen = new Set()
    for (const href of hrefs) {
      const match = href.match(/\/p\/([A-Za-z0-9_-]+)/)
      if (!match || seen.has(match[1])) continue
      seen.add(match[1])
      posts.push({
        platformPostId: match[1],
        postUrl: `https://www.instagram.com/p/${match[1]}/`,
        postedAt: null,
        contentSnippet: null,
      })
    }

    if (posts.length === 0) {
      return { posts: [], error: 'Login wall — no post data accessible without authentication' }
    }

    return { posts, error: 'Partial data — timestamps unavailable (login wall)' }
  } catch (err) {
    return { posts, error: err.message }
  } finally {
    await browser.close()
  }
}
