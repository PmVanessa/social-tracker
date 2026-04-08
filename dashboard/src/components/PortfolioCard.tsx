import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import type { PortfolioWithHandles } from '@/lib/types'
import PlatformBadge from './PlatformBadge'
import type { Platform } from '@/lib/types'

const ALL_PLATFORMS: Platform[] = ['instagram', 'tiktok', 'x', 'linkedin', 'facebook']

interface Props {
  portfolio: PortfolioWithHandles
}

export default function PortfolioCard({ portfolio }: Props) {
  const lastActivity = portfolio.lastActivity
    ? formatDistanceToNow(new Date(portfolio.lastActivity), { addSuffix: true })
    : null

  // Weekly posting frequency bars (last 7 days)
  const now = Date.now()
  const weekBars = Array.from({ length: 7 }, (_, i) => {
    const start = now - (7 - i) * 86400000
    const end = start + 86400000
    const count = portfolio.handles
      .flatMap((h) => h.posts)
      .filter((p) => {
        if (!p.posted_at) return false
        const t = new Date(p.posted_at).getTime()
        return t >= start && t < end
      }).length
    return count
  })
  const maxBar = Math.max(...weekBars, 1)

  return (
    <Link
      href={`/portfolio/${portfolio.slug}`}
      className="block bg-[#111] border border-[#1e1e1e] rounded-xl p-5 hover:border-[#333] hover:bg-[#141414] transition-all duration-150 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-white font-semibold text-base leading-tight group-hover:text-neutral-100">
            {portfolio.name}
          </h2>
          {lastActivity ? (
            <p className="text-xs text-neutral-600 mt-1">Last post {lastActivity}</p>
          ) : (
            <p className="text-xs text-neutral-700 mt-1">No posts recorded yet</p>
          )}
        </div>
        <span className="text-xs font-mono text-neutral-500 bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-1 rounded-lg">
          {portfolio.totalPosts} posts
        </span>
      </div>

      {/* Platform badges */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {ALL_PLATFORMS.map((platform) => {
          const handle = portfolio.handles.find((h) => h.platform === platform)
          if (!handle) return null
          return (
            <PlatformBadge
              key={platform}
              platform={platform}
              count={handle.postCount}
              size="sm"
              unavailable={handle.postCount === 0}
            />
          )
        })}
      </div>

      {/* 7-day frequency mini chart */}
      <div className="mt-3">
        <p className="text-[10px] text-neutral-700 mb-1.5 uppercase tracking-wider">Last 7 days</p>
        <div className="flex items-end gap-[3px] h-8">
          {weekBars.map((count, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-emerald-500 transition-all"
              style={{
                height: `${Math.max(2, (count / maxBar) * 100)}%`,
                opacity: count === 0 ? 0.1 : 0.6 + (count / maxBar) * 0.4,
              }}
              title={`${count} post${count !== 1 ? 's' : ''}`}
            />
          ))}
        </div>
      </div>
    </Link>
  )
}
