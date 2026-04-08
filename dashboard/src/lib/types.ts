export type Platform = 'instagram' | 'tiktok' | 'x' | 'linkedin' | 'facebook'

export interface Portfolio {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface PlatformHandle {
  id: string
  portfolio_id: string
  platform: Platform
  handle: string
  profile_url: string | null
  last_scraped_at: string | null
  created_at: string
}

export interface Post {
  id: string
  platform_handle_id: string
  platform_post_id: string | null
  posted_at: string | null
  content_snippet: string | null
  post_url: string | null
  scraped_at: string
}

export interface ScrapeLog {
  id: string
  platform_handle_id: string
  status: 'success' | 'partial' | 'failed'
  posts_found: number
  error_message: string | null
  scraped_at: string
}

// Enriched types used in the dashboard

export interface HandleWithPosts extends PlatformHandle {
  posts: Post[]
  latestPost: Post | null
  postCount: number
}

export interface PortfolioWithHandles extends Portfolio {
  handles: HandleWithPosts[]
  totalPosts: number
  activePlatforms: Platform[]
  lastActivity: string | null
}

// For the frequency heatmap: count[dayOfWeek][hourOfDay]
// dayOfWeek: 0=Sun, 1=Mon ... 6=Sat
// hourOfDay: 0..23
export type FrequencyGrid = number[][]
