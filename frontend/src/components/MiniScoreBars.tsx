import type { MoviesStatOut, RatingBucketOut } from "@/lib/types"

interface MiniScoreBarsProps {
  data: MoviesStatOut
}

export function MiniScoreBars({ data }: MiniScoreBarsProps) {
  const ratingBuckets: RatingBucketOut[] = data.rating_distribution
  const maxMoviesCount = Math.max(...ratingBuckets.map((bucket) => bucket.count), 1)
  return (
    <div className="mt-2 flex h-8 items-end gap-0.5">
      {ratingBuckets.map((bucket) => {
        const heightPercent = (bucket.count / maxMoviesCount) * 100
        const percentage = ((bucket.count / data.total_count) * 100).toFixed(1)
        const barTitle = `${bucket.label}: ${bucket.count.toLocaleString()} movies (${percentage}% of ${data.total_count.toLocaleString()})`
        return (
          <div
            key={bucket.label}
            title={barTitle}
            style={{ height: `${heightPercent}%` }}
            className="flex-1 rounded-sm bg-primary/80"
          />
        )
      })}
    </div>
  )
}
