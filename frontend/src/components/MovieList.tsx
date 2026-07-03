import type { MovieOut } from "@/lib/types"
import { formatVotes } from "@/lib/utils"

interface MovieListProps {
  movies: MovieOut[]
  loading: boolean
}

export function MovieList({ movies, loading }: MovieListProps) {
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
    <ol className="divide-y divide-border text-sm">
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
              {movie.start_year && (
                <span className="ml-1.5 font-normal text-muted-foreground">
                  ({movie.start_year})
                </span>
              )}
            </span>
            <span className="shrink-0 font-bold tabular-nums text-primary">
              {ratingDisplay}
            </span>
            <span className="w-12 shrink-0 text-right text-muted-foreground tabular-nums">
              {votesDisplay}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
