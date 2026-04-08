'use client'

import type { FrequencyGrid } from '@/lib/types'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

interface Props {
  grid: FrequencyGrid
  title?: string
}

export default function FrequencyHeatmap({ grid, title = 'Posting Frequency' }: Props) {
  const max = Math.max(...grid.flatMap((row) => row), 1)

  function cellColor(count: number): string {
    if (count === 0) return 'bg-[#1a1a1a]'
    const intensity = count / max
    if (intensity < 0.2) return 'bg-emerald-900/60'
    if (intensity < 0.4) return 'bg-emerald-700/70'
    if (intensity < 0.6) return 'bg-emerald-600/80'
    if (intensity < 0.8) return 'bg-emerald-500'
    return 'bg-emerald-400'
  }

  const totalPosts = grid.flatMap((row) => row).reduce((a, b) => a + b, 0)

  // Best posting window: hour with most posts
  const hourTotals = HOURS.map((h) => grid.reduce((sum, day) => sum + day[h], 0))
  const bestHour = hourTotals.indexOf(Math.max(...hourTotals))
  const bestDay = DAYS[grid.map((row) => row.reduce((a, b) => a + b, 0)).indexOf(
    Math.max(...grid.map((row) => row.reduce((a, b) => a + b, 0)))
  )]

  if (totalPosts === 0) {
    return (
      <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5">
        <h3 className="text-sm font-medium text-neutral-400 mb-3">{title}</h3>
        <p className="text-xs text-neutral-600 italic">No posts with timestamps yet</p>
      </div>
    )
  }

  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-neutral-300">{title}</h3>
        <div className="flex gap-3 text-xs text-neutral-600">
          <span>Best day: <span className="text-emerald-400">{bestDay}</span></span>
          <span>Best hour: <span className="text-emerald-400">{bestHour}:00</span></span>
        </div>
      </div>

      {/* Hour labels */}
      <div className="flex mb-1">
        <div className="w-9 shrink-0" />
        <div className="flex flex-1 gap-px">
          {HOURS.map((h) => (
            <div
              key={h}
              className="flex-1 text-center text-[8px] text-neutral-700 font-mono"
            >
              {h % 6 === 0 ? `${h}h` : ''}
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="space-y-px">
        {DAYS.map((day, d) => (
          <div key={day} className="flex gap-px items-center">
            <div className="w-9 text-[10px] text-neutral-600 text-right pr-2 font-mono shrink-0">
              {day}
            </div>
            <div className="flex flex-1 gap-px">
              {HOURS.map((h) => {
                const count = grid[d][h]
                return (
                  <div
                    key={h}
                    className={`flex-1 rounded-[2px] cursor-default transition-opacity hover:opacity-80 ${cellColor(count)}`}
                    style={{ aspectRatio: '1' }}
                    title={`${day} ${h}:00 — ${count} post${count !== 1 ? 's' : ''}`}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-[10px] text-neutral-700">Less</span>
        {['bg-[#1a1a1a]', 'bg-emerald-900/60', 'bg-emerald-700/70', 'bg-emerald-500', 'bg-emerald-400'].map((c, i) => (
          <div key={i} className={`w-3 h-3 rounded-[2px] ${c}`} />
        ))}
        <span className="text-[10px] text-neutral-700">More</span>
      </div>
    </div>
  )
}
