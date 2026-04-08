import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Social Tracker',
  description: 'Post tracking dashboard for agency portfolios',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0a] text-neutral-200">
        <header className="border-b border-[#1e1e1e] px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-white tracking-tight">Social Tracker</span>
              <span className="text-xs text-neutral-500 bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-0.5 rounded-full">
                6 portfolios
              </span>
            </div>
            <span className="text-xs text-neutral-600">Scrapes every 6h via GitHub Actions</span>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
