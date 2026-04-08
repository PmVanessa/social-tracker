import { supabase } from './supabase'
import type { Portfolio, PlatformHandle, Post, PortfolioWithHandles, HandleWithPosts } from './types'

export async function getAllPortfolios(): Promise<PortfolioWithHandles[]> {
  try {
  const [{ data: portfolios }, { data: handles }, { data: posts }] = await Promise.all([
    supabase.from('portfolios').select('*').order('name'),
    supabase.from('platform_handles').select('*'),
    supabase
      .from('posts')
      .select('*')
      .order('posted_at', { ascending: false }),
  ])

  if (!portfolios) return []

  return portfolios.map((p: Portfolio) => {
    const portfolioHandles = (handles ?? []).filter(
      (h: PlatformHandle) => h.portfolio_id === p.id
    )

    const handlesWithPosts: HandleWithPosts[] = portfolioHandles.map((h: PlatformHandle) => {
      const handlePosts = (posts ?? []).filter(
        (post: Post) => post.platform_handle_id === h.id
      )
      return {
        ...h,
        posts: handlePosts,
        latestPost: handlePosts[0] ?? null,
        postCount: handlePosts.length,
      }
    })

    const allPosts = handlesWithPosts.flatMap((h) => h.posts)
    const lastActivity = allPosts
      .map((p) => p.posted_at ?? p.scraped_at)
      .sort()
      .at(-1) ?? null

    return {
      ...p,
      handles: handlesWithPosts,
      totalPosts: allPosts.length,
      activePlatforms: handlesWithPosts
        .filter((h) => h.postCount > 0)
        .map((h) => h.platform),
      lastActivity,
    }
  })
  } catch {
    return []
  }
}

export async function getPortfolio(slug: string): Promise<PortfolioWithHandles | null> {
  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!portfolio) return null

  const { data: handles } = await supabase
    .from('platform_handles')
    .select('*')
    .eq('portfolio_id', portfolio.id)

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .in('platform_handle_id', (handles ?? []).map((h: PlatformHandle) => h.id))
    .order('posted_at', { ascending: false })

  const handlesWithPosts: HandleWithPosts[] = (handles ?? []).map((h: PlatformHandle) => {
    const handlePosts = (posts ?? []).filter(
      (post: Post) => post.platform_handle_id === h.id
    )
    return {
      ...h,
      posts: handlePosts,
      latestPost: handlePosts[0] ?? null,
      postCount: handlePosts.length,
    }
  })

  const allPosts = handlesWithPosts.flatMap((h) => h.posts)
  const lastActivity = allPosts
    .map((p) => p.posted_at ?? p.scraped_at)
    .sort()
    .at(-1) ?? null

  return {
    ...portfolio,
    handles: handlesWithPosts,
    totalPosts: allPosts.length,
    activePlatforms: handlesWithPosts
      .filter((h) => h.postCount > 0)
      .map((h) => h.platform),
    lastActivity,
  }
}

export function buildFrequencyGrid(posts: Post[]): number[][] {
  // [dayOfWeek 0-6][hour 0-23]
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
  for (const post of posts) {
    if (!post.posted_at) continue
    const d = new Date(post.posted_at)
    grid[d.getDay()][d.getHours()]++
  }
  return grid
}
