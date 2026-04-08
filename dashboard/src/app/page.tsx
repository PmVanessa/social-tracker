import { getAllPortfolios } from '@/lib/data'
import PortfolioCard from '@/components/PortfolioCard'
import { format } from 'date-fns'

export const revalidate = 300 // revalidate every 5 minutes

export default async function Home() {
  const portfolios = await getAllPortfolios()

  const totalPosts = portfolios.reduce((s, p) => s + p.totalPosts, 0)
  const activePlatforms = new Set(portfolios.flatMap((p) => p.activePlatforms)).size
  const lastScrape = portfolios
    .flatMap((p) => p.handles.map((h) => h.last_scraped_at))
    .filter(Boolean)
    .sort()
    .at(-1)

  return (
    <div>
      {/* Stats bar */}
      <div className="flex flex-wrap gap-6 mb-8">
        <Stat label="Portfolios" value={portfolios.length} />
        <Stat label="Total posts" value={totalPosts} />
        <Stat label="Active platforms" value={activePlatforms} />
        <Stat
          label="Last scraped"
          value={lastScrape ? format(new Date(lastScrape), 'MMM d, HH:mm') : 'Never'}
          mono
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {portfolios.map((portfolio) => (
          <PortfolioCard key={portfolio.id} portfolio={portfolio} />
        ))}
      </div>

      {portfolios.length === 0 && (
        <div className="text-center py-24 text-neutral-600">
          <p className="text-lg">No data yet</p>
          <p className="text-sm mt-2">
            Run the scraper to start populating posts, or check your Supabase connection.
          </p>
        </div>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string | number
  mono?: boolean
}) {
  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-lg px-4 py-3 min-w-[110px]">
      <p className="text-[10px] uppercase tracking-widest text-neutral-600 mb-1">{label}</p>
      <p className={`text-xl font-semibold text-white ${mono ? 'font-mono text-base' : ''}`}>
        {value}
      </p>
    </div>
  )
}
