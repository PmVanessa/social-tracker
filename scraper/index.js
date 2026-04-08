/**
 * Social Media Tracker — Main Scraper
 *
 * Loads all portfolio handles from Supabase, runs the appropriate scraper
 * for each platform, and upserts posts + logs back to the database.
 *
 * Usage:
 *   node index.js           — full run
 *   DRY_RUN=true node index.js  — prints results, no DB writes
 */

import 'dotenv/config'
import { supabase } from './lib/supabase.js'
import { scrapeTikTok } from './scrapers/tiktok.js'
import { scrapeInstagram } from './scrapers/instagram.js'
import { scrapeTwitter } from './scrapers/twitter.js'
import { scrapeLinkedIn } from './scrapers/linkedin.js'
import { scrapeFacebook } from './scrapers/facebook.js'

const DRY_RUN = process.env.DRY_RUN === 'true'

const SCRAPERS = {
  tiktok:   scrapeTikTok,
  instagram: scrapeInstagram,
  x:         scrapeTwitter,
  linkedin:  (handle) => {
    // Quadri Aminu uses a personal LinkedIn (/in/ URL), others use /company/
    return scrapeLinkedIn(handle, handle === 'aminu-quadri')
  },
  facebook:  scrapeFacebook,
}

// Delay between handles to avoid hammering platforms
const INTER_HANDLE_DELAY_MS = 4000

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function runScraper(handle) {
  const scraper = SCRAPERS[handle.platform]
  if (!scraper) {
    console.warn(`  ⚠  No scraper for platform: ${handle.platform}`)
    return { posts: [], error: `No scraper for platform ${handle.platform}` }
  }

  console.log(`  → Scraping ${handle.platform}/${handle.handle} ...`)
  try {
    const result = await scraper(handle.handle)
    if (result.error) {
      console.warn(`    ✗ ${result.error} (${result.posts.length} posts captured)`)
    } else {
      console.log(`    ✓ ${result.posts.length} posts found`)
    }
    return result
  } catch (err) {
    console.error(`    ✗ Unexpected error: ${err.message}`)
    return { posts: [], error: err.message }
  }
}

async function saveResults(handle, result) {
  if (DRY_RUN) {
    console.log('    [DRY RUN] Would upsert:', result.posts.length, 'posts')
    return
  }

  // Upsert posts
  if (result.posts.length > 0) {
    const rows = result.posts
      .filter((p) => p.platformPostId) // skip posts without an ID (can't dedupe)
      .map((p) => ({
        platform_handle_id: handle.id,
        platform_post_id:   p.platformPostId,
        posted_at:          p.postedAt ?? null,
        content_snippet:    p.contentSnippet ?? null,
        post_url:           p.postUrl ?? null,
        scraped_at:         new Date().toISOString(),
      }))

    if (rows.length > 0) {
      const { error } = await supabase
        .from('posts')
        .upsert(rows, { onConflict: 'platform_handle_id,platform_post_id' })

      if (error) console.error('    DB upsert error:', error.message)
    }
  }

  // Update last_scraped_at on the handle
  await supabase
    .from('platform_handles')
    .update({ last_scraped_at: new Date().toISOString() })
    .eq('id', handle.id)

  // Write scrape log
  const status = result.error
    ? result.posts.length > 0 ? 'partial' : 'failed'
    : 'success'

  await supabase.from('scrape_logs').insert({
    platform_handle_id: handle.id,
    status,
    posts_found:    result.posts.length,
    error_message:  result.error ?? null,
    scraped_at:     new Date().toISOString(),
  })
}

async function main() {
  console.log(`\n🔍 Social Tracker Scraper — ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`)

  // Load all handles (with portfolio name for logging)
  const { data: handles, error } = await supabase
    .from('platform_handles')
    .select('id, platform, handle, portfolio_id, portfolios(name)')

  if (error) {
    console.error('Failed to load handles from Supabase:', error.message)
    process.exit(1)
  }

  console.log(`Loaded ${handles.length} handles across ${new Set(handles.map((h) => h.portfolio_id)).size} portfolios\n`)

  let totalPosts = 0
  let successCount = 0
  let failCount = 0

  for (const handle of handles) {
    const portfolioName = handle.portfolios?.name ?? handle.portfolio_id
    console.log(`📁 ${portfolioName}`)

    const result = await runScraper(handle)
    await saveResults(handle, result)

    totalPosts += result.posts.length
    if (result.error && result.posts.length === 0) failCount++
    else successCount++

    await sleep(INTER_HANDLE_DELAY_MS)
  }

  console.log(`\n✅ Done — ${totalPosts} posts captured across ${successCount} handles (${failCount} failed)\n`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
