"use client"

import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { formatVotes } from "@/lib/utils"
import type { FilterParamsBody } from "@/lib/types"
import { GenreMultiSelect } from "./GenreMultiSelect"

const YEAR_MIN = 1900
const YEAR_MAX = 2025
const RATING_MIN = 1
const RATING_MAX = 10

const VOTES_STOPS: { label: string; value: number | undefined }[] = [
  { label: "Any", value: undefined },
  { label: "1K",   value: 1_000 },
  { label: "5K",   value: 5_000 },
  { label: "10K",  value: 10_000 },
  { label: "50K",  value: 50_000 },
  { label: "100K", value: 100_000 },
  { label: "500K", value: 500_000 },
]
const VOTES_MAX_IDX = VOTES_STOPS.length - 1
const VOTES_SNAP_ZONE = 0.25

function extractSliderSingleValue(vals: number | readonly number[]): number {
  return typeof vals === "number" ? vals : vals[0]
}

// Map a slider position (0–VOTES_MAX_IDX) to a votes threshold.
// Positions < 0.5 map to "Any"; integer positions map to exact presets;
// fractional positions between presets use log interpolation.
function posToVotes(pos: number): number | undefined {
  if (pos < 0.5) return undefined
  const lo = Math.max(1, Math.floor(pos))
  const hi = Math.min(Math.ceil(pos), VOTES_MAX_IDX)
  if (lo === hi) return VOTES_STOPS[lo].value
  const t = pos - Math.floor(pos)
  const loValue = VOTES_STOPS[lo].value
  const hiValue = VOTES_STOPS[hi].value
  if (loValue == null || hiValue == null) return undefined
  return Math.round(
    Math.pow(10, Math.log10(loValue) * (1 - t) + Math.log10(hiValue) * t)
  )
}

// Map a votes threshold back to a slider position.
function votesToPos(votes: number | undefined): number {
  if (votes == null || votes === 0) return 0
  const idx = VOTES_STOPS.findIndex((stop) => stop.value === votes)
  if (idx >= 0) return idx
  for (let i = 1; i < VOTES_MAX_IDX; i++) {
    const loStop = VOTES_STOPS[i]
    const hiStop = VOTES_STOPS[i + 1]
    if (loStop.value == null || hiStop.value == null) continue
    if (votes > loStop.value && votes < hiStop.value) {
      const t = (Math.log10(votes) - Math.log10(loStop.value)) / (Math.log10(hiStop.value) - Math.log10(loStop.value))
      return i + t
    }
  }
  return VOTES_MAX_IDX
}

function formatVotesLabel(votes: number | undefined): string {
  return votes != null ? `≥ ${formatVotes(votes)}` : "Any"
}

interface FilterPanelProps {
  filters: FilterParamsBody
  onPendingChange: (filters: FilterParamsBody) => void
}

export function FilterPanel({ filters, onPendingChange }: FilterPanelProps) {
  // null = idle (slider reads from props); non-null = user is dragging (local visual feedback).
  // This avoids useEffect-based sync: when props change externally (e.g. Stage 3 intent update
  // or Clear all), dragRating is null so the slider immediately reflects the new prop value.
  const [dragRating, setDragRating] = useState<number | null>(null)
  const displayRating = dragRating ?? filters.rating_min ?? RATING_MIN

  const [dragYear, setDragYear] = useState<[number, number] | null>(null)
  const displayYear: [number, number] = dragYear ?? [
    filters.year_min ?? YEAR_MIN,
    filters.year_max ?? YEAR_MAX,
  ]

  const [dragVotesPos, setDragVotesPos] = useState<number | null>(null)
  const displayVotesPos = dragVotesPos ?? votesToPos(filters.votes_min)
  const displayVotes = posToVotes(displayVotesPos)

  return (
    <div className="flex flex-col gap-5">
      {/* Genres: any of */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Genres (any of)</label>
        <GenreMultiSelect
          selected={filters.genres_or ?? []}
          onChange={(genres) =>
            onPendingChange({ ...filters, genres_or: genres.length ? genres : undefined })
          }
        />
      </div>

      {/* Genres: all of */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Genres (all of)</label>
        <GenreMultiSelect
          selected={filters.genres_and ?? []}
          onChange={(genres) =>
            onPendingChange({ ...filters, genres_and: genres.length ? genres : undefined })
          }
        />
      </div>

      {/* Year range */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <label className="text-sm font-medium">Year range</label>
          <span className="text-sm text-muted-foreground tabular-nums">
            {displayYear[0]} – {displayYear[1]}
          </span>
        </div>
        <Slider
          min={YEAR_MIN}
          max={YEAR_MAX}
          step={1}
          value={displayYear}
          onValueChange={(vals) => setDragYear(vals as [number, number])}
          onValueCommitted={(vals) => {
            const [lo, hi] = vals as [number, number]
            setDragYear(null)
            onPendingChange({
              ...filters,
              year_min: lo > YEAR_MIN ? lo : undefined,
              year_max: hi < YEAR_MAX ? hi : undefined,
            })
          }}
        />
      </div>

      {/* Rating min */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <label className="text-sm font-medium">Min rating</label>
          <span className="text-sm text-muted-foreground tabular-nums">
            {displayRating > RATING_MIN ? `≥ ${displayRating.toFixed(1)}` : "Any"}
          </span>
        </div>
        <Slider
          min={RATING_MIN}
          max={RATING_MAX}
          step={0.1}
          value={[displayRating]}
          fillToMax
          onValueChange={(vals) => setDragRating(extractSliderSingleValue(vals))}
          onValueCommitted={(vals) => {
            const val = extractSliderSingleValue(vals)
            setDragRating(null)
            onPendingChange({ ...filters, rating_min: val > RATING_MIN ? val : undefined })
          }}
        />
      </div>

      {/* Votes min */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <label className="text-sm font-medium">Min votes</label>
          <span className="text-sm text-muted-foreground tabular-nums">
            {formatVotesLabel(displayVotes)}
          </span>
        </div>
        <div className="relative">
          <Slider
            min={0}
            max={VOTES_MAX_IDX}
            step={0.01}
            value={[displayVotesPos]}
            fillToMax
            onValueChange={(vals) => setDragVotesPos(extractSliderSingleValue(vals))}
            onValueCommitted={(vals) => {
              const pos = extractSliderSingleValue(vals)
              const rounded = Math.round(pos)
              const snapped = Math.abs(pos - rounded) <= VOTES_SNAP_ZONE ? rounded : pos
              setDragVotesPos(null)
              onPendingChange({ ...filters, votes_min: posToVotes(snapped) })
            }}
          />
          <div className="mx-[6px]">
            <div className="relative mt-1 h-1.5">
              {VOTES_STOPS.map((stop, i) => (
                <span
                  key={stop.label}
                  className={cn(
                    "absolute h-full w-px bg-muted-foreground/50",
                    i === 0 ? "" : i === VOTES_MAX_IDX ? "-translate-x-full" : "-translate-x-1/2"
                  )}
                  style={{ left: `${(i / VOTES_MAX_IDX) * 100}%` }}
                />
              ))}
            </div>
            <div className="relative h-4">
              {VOTES_STOPS.map((stop, i) => (
                <span
                  key={stop.label}
                  className={cn(
                    "absolute text-xs text-muted-foreground",
                    i > 0 && i < VOTES_MAX_IDX && "-translate-x-1/2"
                  )}
                  style={
                    i === 0
                      ? { left: "-6px" }
                      : i === VOTES_MAX_IDX
                        ? { right: "-6px" }
                        : { left: `${(i / VOTES_MAX_IDX) * 100}%` }
                  }
                >
                  {stop.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
