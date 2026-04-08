import type { Platform } from '@/lib/types'

const CONFIG: Record<Platform, { label: string; color: string; bg: string; icon: string }> = {
  instagram: {
    label: 'Instagram',
    color: 'text-pink-400',
    bg: 'bg-pink-400/10 border-pink-400/20',
    icon: '◈',
  },
  tiktok: {
    label: 'TikTok',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10 border-cyan-400/20',
    icon: '▷',
  },
  x: {
    label: 'X',
    color: 'text-neutral-300',
    bg: 'bg-neutral-300/10 border-neutral-300/20',
    icon: '✕',
  },
  linkedin: {
    label: 'LinkedIn',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10 border-blue-400/20',
    icon: 'in',
  },
  facebook: {
    label: 'Facebook',
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/10 border-indigo-400/20',
    icon: 'f',
  },
}

interface Props {
  platform: Platform
  count?: number
  size?: 'sm' | 'md'
  unavailable?: boolean
}

export default function PlatformBadge({ platform, count, size = 'md', unavailable = false }: Props) {
  const { label, color, bg, icon } = CONFIG[platform]

  if (size === 'sm') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
          unavailable ? 'opacity-30 grayscale' : ''
        } ${bg} ${color}`}
        title={unavailable ? `${label} — login required` : label}
      >
        <span className="font-mono text-[10px]">{icon}</span>
        {label}
        {count !== undefined && (
          <span className="opacity-70 font-mono">{count}</span>
        )}
      </span>
    )
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-opacity ${
        unavailable ? 'opacity-30 grayscale' : ''
      } ${bg} ${color}`}
    >
      <span className="font-mono text-xs w-4 text-center">{icon}</span>
      <span>{label}</span>
      {count !== undefined && (
        <span className="ml-auto font-mono text-xs opacity-70">{count}</span>
      )}
    </div>
  )
}
