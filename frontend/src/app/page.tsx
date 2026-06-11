"use client"

import { useEffect, useState } from "react"
import { fetchMovies, fetchMoviesStat } from "@/lib/api"
import type { FilterParams, MovieOut, MoviesStatOut, RatingBucketOut } from "@/lib/types"
import { BigNumber } from "@/components/BigNumber"
import { FilterChips } from "@/components/FilterChips"
import { FilterPanel } from "@/components/FilterPanel"
import { IntentInput } from "@/components/IntentInput"
import { MovieList } from "@/components/MovieList"

function formatVotes(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return n.toLocaleString()
}

function MiniScoreBars({ data }: { data: MoviesStatOut }) {
  const ratingBuckets:RatingBucketOut[] = data.rating_distribution
  const maxMoviesCount = Math.max(...ratingBuckets.map((b) => b.count), 1)
  return (
    <div className="mt-2 flex h-8 items-end gap-0.5">
      {ratingBuckets.map((b) => (
        <div
          key={b.label}
          title={`${b.label}: ${b.count.toLocaleString()} movies (${((b.count / data.total_count) * 100).toFixed(1)}% of ${data.total_count.toLocaleString()})`}
          style={{ height: `${(b.count / maxMoviesCount) * 100}%` }}
          className="flex-1 rounded-sm bg-yellow-400/80"
        />
      ))}
    </div>
  )
}

export default function Home() {
  const [filters, setFilters] = useState<FilterParams>({})
  const [stat, setStat] = useState<MoviesStatOut | null>(null)
  const [movies, setMovies] = useState<MovieOut[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchMoviesStat(filters), fetchMovies(filters)])
      .then(([s, m]) => {
        setStat(s)
        setMovies(
          [...m].sort((a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0))
        )
      })
      .finally(() => setLoading(false))
  }, [filters])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b px-4 py-3 lg:px-6">
        <h1 className="text-lg font-semibold tracking-tight">Intent Filtering</h1>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Sidebar — desktop only */}
        <aside className="hidden w-72 shrink-0 flex-col gap-6 border-r p-6 lg:flex">
          <IntentInput />
          <FilterPanel filters={filters} onChange={setFilters} />
        </aside>

        <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
          {/* IntentInput — mobile only */}
          <div className="lg:hidden">
            <IntentInput />
          </div>

          {/* Active filter chips (always visible; Sheet trigger hidden on lg+) */}
          <FilterChips filters={filters} onChange={setFilters} />

          {/* Big Numbers */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <BigNumber
              type="total_count"
              value={loading ? "…" : (stat?.total_count.toLocaleString() ?? "—")}
            />
            <BigNumber
              type="average_rating"
              value={loading ? "…" : (stat?.average_rating?.toFixed(1) ?? "—")}
            >
              {!loading && stat && <MiniScoreBars data={stat} />}
            </BigNumber>
            <BigNumber
              type="total_votes"
              value={loading ? "…" : formatVotes(stat?.total_votes ?? 0)}
            />
          </div>

          {/* Movie list */}
          <MovieList movies={movies} loading={loading} />
        </main>
      </div>
    </div>
  )
}
