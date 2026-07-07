"use client"

import { useEffect, useState } from "react"
import { fetchMovies, fetchMoviesStat } from "@/lib/api"
import { formatVotes } from "@/lib/utils"
import type { FilterParams, FilterParamsBody, MovieOut, MoviesStatOut, SortDirection, SortField } from "@/lib/types"
import { BigNumber } from "@/components/BigNumber"
import { FilterChips } from "@/components/FilterChips"
import { FilterPanel } from "@/components/FilterPanel"
import { IntentInput } from "@/components/IntentInput"
import { MiniScoreBars } from "@/components/MiniScoreBars"
import { MovieList } from "@/components/MovieList"

function computeHasPendingFilters(pFilters: FilterParamsBody, aFilters: FilterParamsBody): boolean {
  const equality = new Set(aFilters.genres_or).symmetricDifference(new Set(pFilters.genres_or)).size === 0 &&
         new Set(pFilters.genres_and).symmetricDifference(new Set(aFilters.genres_and)).size === 0 &&
         pFilters.year_min === aFilters.year_min &&
         pFilters.year_max === aFilters.year_max &&
         pFilters.rating_min === aFilters.rating_min &&
         pFilters.votes_min === aFilters.votes_min
  return !equality
}

export default function Home() {
  const [activeFilters, setActiveFilters] = useState<FilterParams>({})
  const [pendingFilters, setPendingFilters] = useState<FilterParamsBody>({})
  const [hasPendingChanges, setHasPendingChanges] = useState(false)
  const [stat, setStat] = useState<MoviesStatOut | null>(null)
  const [movies, setMovies] = useState<MovieOut[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortField>("average_rating")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const { limit: _limit, offset: _offset, ...activeFiltersBody } = activeFilters
  const displayFilters: FilterParamsBody = hasPendingChanges ? pendingFilters : activeFiltersBody

  useEffect(() => {
    setLoading(true)
    const movieParams: FilterParams = { ...activeFilters, sort_by: sortBy, sort_direction: sortDirection }
    Promise.all([fetchMoviesStat(activeFilters), fetchMovies(movieParams)])
      .then(([fetchedMoviesStat, fetchedMovies]) => {
        setStat(fetchedMoviesStat)
        setMovies(fetchedMovies)
      })
      .finally(() => setLoading(false))
  }, [activeFilters, sortBy, sortDirection])

  function updatePending(delta: Partial<FilterParamsBody>) {
    const newPending = { ...pendingFilters, ...delta }
    setPendingFilters(newPending)
    setHasPendingChanges(computeHasPendingFilters(newPending, activeFiltersBody))
  }

  function applyPendingFilters() {
    setActiveFilters({ ...pendingFilters })
    setHasPendingChanges(false)
  }

  function handleSortChange(field: SortField, direction: SortDirection) {
    setSortBy(field)
    setSortDirection(direction)
  }

  function discardPendingFilters() {
    setPendingFilters(activeFiltersBody)
    setHasPendingChanges(false)
  }

  function clearAll() {
    const newPending: FilterParamsBody = {}
    setPendingFilters(newPending)
    setHasPendingChanges(computeHasPendingFilters(newPending, activeFiltersBody))
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
            activeFilters={activeFilters}
            pendingFilters={pendingFilters}
            hasPendingChanges={hasPendingChanges}
            onPendingChange={updatePending}
            onClearAll={clearAll}
            onApplyPendingFilters={applyPendingFilters}
            onDiscardPendingFilters={discardPendingFilters}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <BigNumber type="total_count" value={totalCountDisplay} />
            <BigNumber type="average_rating" value={averageRatingDisplay}>
              {scoreBars}
            </BigNumber>
            <BigNumber type="total_votes" value={totalVotesDisplay} />
          </div>

          <MovieList
            movies={movies}
            loading={loading}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
          />
        </main>
      </div>
    </div>
  )
}
