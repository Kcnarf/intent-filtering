"use client"

import { useEffect, useState } from "react"
import { fetchMovies, fetchMoviesStat } from "@/lib/api"
import { formatVotes } from "@/lib/utils"
import type { FilterParams, FilterParamsBody, MovieOut, MoviesStatOut } from "@/lib/types"
import { BigNumber } from "@/components/BigNumber"
import { FilterChips } from "@/components/FilterChips"
import { FilterPanel } from "@/components/FilterPanel"
import { IntentInput } from "@/components/IntentInput"
import { MiniScoreBars } from "@/components/MiniScoreBars"
import { MovieList } from "@/components/MovieList"

function byRatingDescending(a: MovieOut, b: MovieOut): number {
  return (b.average_rating ?? 0) - (a.average_rating ?? 0)
}

export default function Home() {
  const [activeFilters, setActiveFilters] = useState<FilterParams>({})
  const [pendingFilters, setPendingFilters] = useState<FilterParamsBody>({})
  const [pendingDirty, setPendingDirty] = useState(false)
  const [stat, setStat] = useState<MoviesStatOut | null>(null)
  const [movies, setMovies] = useState<MovieOut[]>([])
  const [loading, setLoading] = useState(true)

  const { limit: _limit, offset: _offset, ...activeFiltersBody } = activeFilters
  const displayFilters: FilterParamsBody = pendingDirty ? pendingFilters : activeFiltersBody

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchMoviesStat(activeFilters), fetchMovies(activeFilters)])
      .then(([moviesStat, fetchedMovies]) => {
        const sortedMovies = [...fetchedMovies].sort(byRatingDescending)
        setStat(moviesStat)
        setMovies(sortedMovies)
      })
      .finally(() => setLoading(false))
  }, [activeFilters])

  function updatePending(filters: FilterParamsBody) {
    setPendingFilters(filters)
    setPendingDirty(true)
  }

  function applyPending() {
    setActiveFilters({ ...pendingFilters })
    setPendingDirty(false)
  }

  function discardPending() {
    setPendingFilters(activeFiltersBody)
    setPendingDirty(false)
  }

  function handleActiveChipRemove(updated: FilterParams) {
    const { limit: _limit, offset: _offset, ...filtersBody } = updated
    updatePending(filtersBody)
  }

  const totalCountDisplay = loading ? "…" : (stat?.total_count.toLocaleString() ?? "—")
  const averageRatingDisplay = loading ? "…" : (stat?.average_rating?.toFixed(1) ?? "—")
  const totalVotesDisplay = loading ? "…" : (stat?.total_votes != null ? formatVotes(stat.total_votes) : "—")
  const scoreBars = !loading && stat != null ? <MiniScoreBars data={stat} /> : null

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-black px-4 py-3 lg:px-6">
        <h1 className="text-lg font-semibold tracking-tight">Intent Filtering</h1>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Sidebar — desktop only */}
        <aside className="hidden w-72 shrink-0 flex-col gap-6 border-r p-6 lg:flex">
          <IntentInput contextFilters={displayFilters} onPendingChange={updatePending} />
          <FilterPanel filters={displayFilters} onPendingChange={updatePending} />
        </aside>

        <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
          {/* IntentInput — mobile only */}
          <div className="lg:hidden">
            <IntentInput contextFilters={displayFilters} onPendingChange={updatePending} />
          </div>

          <FilterChips
            filters={activeFilters}
            onChange={handleActiveChipRemove}
            pendingFilters={pendingFilters}
            onPendingChange={updatePending}
            onApply={applyPending}
            onDiscard={discardPending}
            hasPendingChanges={pendingDirty}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <BigNumber type="total_count" value={totalCountDisplay} />
            <BigNumber type="average_rating" value={averageRatingDisplay}>
              {scoreBars}
            </BigNumber>
            <BigNumber type="total_votes" value={totalVotesDisplay} />
          </div>

          <MovieList movies={movies} loading={loading} />
        </main>
      </div>
    </div>
  )
}
