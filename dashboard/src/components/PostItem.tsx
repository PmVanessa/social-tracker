import { formatDistanceToNow, format } from 'date-fns'
import type { Post } from '@/lib/types'
import type { Platform } from '@/lib/types'

interface Props {
  post: Post
  platform: Platform
}

export default function PostItem({ post, platform }: Props) {
  const time = post.posted_at ?? post.scraped_at
  const date = new Date(time)
  const isOld = Date.now() - date.getTime() > 7 * 24 * 60 * 60 * 1000

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[#1a1a1a] last:border-0 group">
      {/* Time column */}
      <div className="min-w-[80px] text-right shrink-0">
        <span className="text-xs text-neutral-500 font-mono" title={format(date, 'PPpp')}>
          {post.posted_at
            ? formatDistanceToNow(date, { addSuffix: true })
            : `scraped ${formatDistanceToNow(new Date(post.scraped_at), { addSuffix: true })}`}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {post.content_snippet ? (
          <p className="text-sm text-neutral-300 truncate">{post.content_snippet}</p>
        ) : (
          <p className="text-sm text-neutral-600 italic">No content preview</p>
        )}
        {post.post_url && (
          <a
            href={post.post_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors truncate block mt-0.5"
          >
            {post.post_url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60)}
          </a>
        )}
      </div>

      {/* Dot indicator */}
      <div
        className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
          isOld ? 'bg-neutral-700' : 'bg-emerald-500'
        }`}
      />
    </div>
  )
}
