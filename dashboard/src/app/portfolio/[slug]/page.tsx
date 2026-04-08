import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { getPortfolio, buildFrequencyGrid } from '@/lib/data'
import { getAllPortfolios } from '@/lib/data'
import PlatformBadge from '@/components/PlatformBadge'
import PostItem from '@/components/PostItem'
import FrequencyHeatmap from '@/components/FrequencyHeatmap'
import type { Platform } from '@/lib/types'

export const revalidate = 300

export async function generateStaticParams() {
  const portfolios = await getAllPortfolios()
  return portfolios.map((p) => ({ slug: p.slug }))
}

export default async function PortfolioPage({ params }: { params: { slug: string } }) {
  const portfolio = await getPortfolio(params.slug)
  if (!portfolio) notFound()

  const allPosts = portfolio.handles.flatMap((h) =>
    h.posts.map((p) => ({ ...p, platform: h.platform as Platform }))
  )
  const allPostsForGrid = portfolio.handles.flatMap((h) => h.posts)
  const frequencyGrid = buildFrequencyGrid(allPostsForGrid)

  const platformOrder: Platform[] = ['tiktok', 'instagram', 'x', 'linkedin', 'facebook']
  const sortedHandles = [...portfolio.handles].sort(
    (a, b) => platformOrder.indexOf(a.platform as Platform) - platformOrder.indexOf(b.platform as Platform)
  )

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-neutral-600 mb-6">
        <Link href="/" className="hover:text-neutral-400 transition-colors">
          Overview
        </Link>
        <span>/</span>
        <span className="text-neutral-300">{portfolio.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{portfolio.name}</h1>
          {portfolio.lastActivity && (
            <p className="text-sm text-neutral-500 mt-1">
              Last post {formatDistanceToNow(new Date(portfolio.lastActivity), { addSuffix: true })}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white font-mono">{portfolio.totalPosts}</p>
          <p className="text-xs text-neutral-600">total posts tracked</p>
        </div>
      </div>

      {/* Platform summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-8">
        {sortedHandles.map((handle) => (
          <div key={handle.id} className="bg-[#111] border border-[#1e1e1e] rounded-lg p-3">
            <PlatformBadge
              platform={handle.platform as Platform}
              size="md"
              unavailable={handle.postCount === 0}
            />
            <div className="mt-2 flex items-end justify-between">
              <span className="text-xl font-bold text-white font-mono">{handle.postCount}</span>
              {handle.last_scraped_at && (
                <span className="text-[10px] text-neutral-700 font-mono">
                  {formatDistanceToNow(new Date(handle.last_scraped_at), { addSuffix: true })}
                </span>
              )}
            </div>
            <p className="text-[10px] text-neutral-700 mt-0.5 truncate">@{handle.handle}</p>
          </div>
        ))}
      </div>

      {/* Main content: posts + heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Posts per platform */}
        <div className="lg:col-span-2 space-y-4">
          {sortedHandles.map((handle) => (
            <div key={handle.id} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <PlatformBadge platform={handle.platform as Platform} size="sm" />
                <span className="text-xs text-neutral-600 font-mono ml-auto">
                  @{handle.handle}
                </span>
                {handle.profile_url && (
                  <a
                    href={handle.profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-neutral-600 hover:text-neutral-400"
                  >
                    ↗
                  </a>
                )}
              </div>

              {handle.posts.length === 0 ? (
                <p className="text-xs text-neutral-700 py-2 italic">
                  No posts scraped — platform may require login
                </p>
              ) : (
                <div>
                  {handle.posts.slice(0, 10).map((post) => (
                    <PostItem key={post.id} post={post} platform={handle.platform as Platform} />
                  ))}
                  {handle.posts.length > 10 && (
                    <p className="text-xs text-neutral-600 pt-2 text-center">
                      +{handle.posts.length - 10} more posts
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Heatmap + stats sidebar */}
        <div className="space-y-4">
          <FrequencyHeatmap grid={frequencyGrid} title="Posting Pattern" />

          {/* Best windows */}
          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4">
            <h3 className="text-sm font-medium text-neutral-400 mb-3">Posting Windows</h3>
            <BestWindows grid={frequencyGrid} />
          </div>

          {/* Platform breakdown */}
          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4">
            <h3 className="text-sm font-medium text-neutral-400 mb-3">Platform Breakdown</h3>
            <div className="space-y-2">
              {sortedHandles
                .filter((h) => h.postCount > 0)
                .sort((a, b) => b.postCount - a.postCount)
                .map((h) => {
                  const pct = portfolio.totalPosts > 0
                    ? Math.round((h.postCount / portfolio.totalPosts) * 100)
                    : 0
                  return (
                    <div key={h.id}>
                      <div className="flex justify-between text-xs text-neutral-500 mb-1">
                        <span className="capitalize">{h.platform}</span>
                        <span className="font-mono">{h.postCount} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BestWindows({ grid }: { grid: number[][] }) {
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Top 5 day+hour combinations
  const cells: { day: number; hour: number; count: number }[] = []
  grid.forEach((row, d) =>
    row.forEach((count, h) => {
      if (count > 0) cells.push({ day: d, hour: h, count })
    })
  )
  const top = cells.sort((a, b) => b.count - a.count).slice(0, 5)

  if (top.length === 0) {
    return <p className="text-xs text-neutral-700 italic">No data with timestamps</p>
  }

  return (
    <div className="space-y-2">
      {top.map(({ day, hour, count }, i) => (
        <div key={i} className="flex items-center justify-between text-xs">
          <span className="text-neutral-400 font-mono">
            {DAYS[day]} {String(hour).padStart(2, '0')}:00
          </span>
          <span className="text-emerald-400 font-mono">{count} post{count !== 1 ? 's' : ''}</span>
        </div>
      ))}
    </div>
  )
}
