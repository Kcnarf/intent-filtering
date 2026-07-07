import type { MovieOut, SortDirection, SortField } from "@/lib/types"
import { formatVotes } from "@/lib/utils"
import { SortableColumnHeader } from "@/components/SortableColumnHeader"

interface MovieListProps {
  movies: MovieOut[]
  loading: boolean
  sortBy: SortField
  sortDirection: SortDirection
  onUpdateSortBy: (field: SortField) => void
}

export function MovieList({ movies, loading, sortBy, sortDirection, onUpdateSortBy }: MovieListProps) {
  if (loading) {
    return <p className="text-muted-foreground text-sm py-4">Loading…</p>
  }

  if (movies.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-4">
        No films match these filters.
      </p>
    )
  }

  return (
    <div className="text-sm">
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <span className="w-6 shrink-0" />
        <span className="min-w-0 flex-1 text-xs font-medium text-muted-foreground">Film</span>
        <SortableColumnHeader
          field="start_year"
          label="Year"
          sortBy={sortBy}
          sortDirection={sortDirection}
          onUpdateSortBy={onUpdateSortBy}
          className="w-12 shrink-0"
        />
        <SortableColumnHeader
          field="average_rating"
          label="Rating"
          sortBy={sortBy}
          sortDirection={sortDirection}
          onUpdateSortBy={onUpdateSortBy}
          className="w-14 shrink-0"
        />
        <SortableColumnHeader
          field="num_votes"
          label="Votes"
          sortBy={sortBy}
          sortDirection={sortDirection}
          onUpdateSortBy={onUpdateSortBy}
          className="w-14 shrink-0"
        />
      </div>
      <ol className="divide-y divide-border">
        {movies.map((movie, index) => {
          const ratingDisplay = movie.average_rating?.toFixed(1) ?? "—"
          const votesDisplay = movie.num_votes != null ? formatVotes(movie.num_votes) : "—"
          return (
            <li key={movie.id} className="flex items-center gap-3 py-2.5">
              <span className="w-6 shrink-0 text-right text-muted-foreground tabular-nums">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">
                {movie.primary_title}
              </span>
              <span className="w-12 shrink-0 text-right text-muted-foreground tabular-nums">
                {movie.start_year ?? "—"}
              </span>
              <span className="w-14 shrink-0 text-right font-bold tabular-nums text-primary">
                {ratingDisplay}
              </span>
              <span className="w-14 shrink-0 text-right text-muted-foreground tabular-nums">
                {votesDisplay}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
