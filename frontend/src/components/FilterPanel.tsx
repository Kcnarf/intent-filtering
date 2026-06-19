"use client"

import { useState } from "react"
import { ChevronsUpDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import type { FilterParamsBody } from "@/lib/types"

const GENRES = [
  "Action", "Adventure", "Animation", "Biography", "Comedy", "Crime",
  "Documentary", "Drama", "Family", "Fantasy", "Film-Noir", "History",
  "Horror", "Music", "Musical", "Mystery", "Romance", "Sci-Fi",
  "Sport", "Thriller", "War", "Western",
]

const YEAR_MIN = 1900
const YEAR_MAX = 2025

const VOTES_STOPS: { label: string; value: number | undefined }[] = [
  { label: "Any", value: undefined },
  { label: "1K",   value: 1_000 },
  { label: "5K",   value: 5_000 },
  { label: "10K",  value: 10_000 },
  { label: "50K",  value: 50_000 },
  { label: "100K", value: 100_000 },
  { label: "500K", value: 500_000 },
]
const VOTES_MAX_IDX = VOTES_STOPS.length - 1  // 6
const VOTES_SNAP_ZONE = 0.25

// Map a slider position (0–VOTES_MAX_IDX) to a votes threshold.
// Positions < 0.5 map to "Any"; integer positions map to exact presets;
// fractional positions between presets use log interpolation.
function posToVotes(pos: number): number | undefined {
  if (pos < 0.5) return undefined
  const lo = Math.max(1, Math.floor(pos))
  const hi = Math.min(Math.ceil(pos), VOTES_MAX_IDX)
  if (lo === hi) return VOTES_STOPS[lo].value
  const t = pos - Math.floor(pos)
  return Math.round(
    Math.pow(10, Math.log10(VOTES_STOPS[lo].value!) * (1 - t) + Math.log10(VOTES_STOPS[hi].value!) * t)
  )
}

// Map a votes threshold back to a slider position.
function votesToPos(votes: number | undefined): number {
  if (!votes) return 0
  const idx = VOTES_STOPS.findIndex((s) => s.value === votes)
  if (idx >= 0) return idx
  for (let i = 1; i < VOTES_MAX_IDX; i++) {
    const lo = VOTES_STOPS[i].value!
    const hi = VOTES_STOPS[i + 1].value!
    if (votes > lo && votes < hi) {
      const t = (Math.log10(votes) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))
      return i + t
    }
  }
  return VOTES_MAX_IDX
}

function formatVotesLabel(votes: number | undefined): string {
  if (!votes) return "Any"
  if (votes >= 1_000_000) return `≥ ${(votes / 1_000_000).toFixed(1)}M`
  if (votes >= 1_000) return `≥ ${Math.round(votes / 1_000)}K`
  return `≥ ${votes}`
}

function GenreMultiSelect({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (genres: string[]) => void
}) {
  const [open, setOpen] = useState(false)

  const triggerLabel =
    selected.length === 0
      ? "All genres"
      : selected.length <= 2
        ? selected.join(", ")
        : `${selected.slice(0, 2).join(", ")} +${selected.length - 2}`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="outline" className="w-full justify-between font-normal" />}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2">
        <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
          {GENRES.map((g) => {
            const checked = selected.includes(g)
            return (
              <label
                key={g}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-accent"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) =>
                    onChange(v ? [...selected, g] : selected.filter((x) => x !== g))
                  }
                />
                <span className="text-sm">{g}</span>
              </label>
            )
          })}
        </div>
        {selected.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 w-full text-xs"
            onClick={() => onChange([])}
          >
            Clear
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}

interface FilterPanelProps {
  filters: FilterParamsBody
  onPendingChange: (filters: FilterParamsBody) => void
  onApply: () => void
}

export function FilterPanel({ filters, onPendingChange, onApply }: FilterPanelProps) {
  // null = idle (slider reads from props); non-null = user is dragging (local visual feedback).
  // This avoids useEffect-based sync: when props change externally (e.g. Stage 3 intent update
  // or Clear all), dragRating is null so the slider immediately reflects the new prop value.
  const [dragRating, setDragRating] = useState<number | null>(null)
  const displayRating = dragRating ?? filters.rating_min ?? 1

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
            {displayRating > 1 ? `≥ ${displayRating.toFixed(1)}` : "Any"}
          </span>
        </div>
        <Slider
          min={1}
          max={10}
          step={0.1}
          value={[displayRating]}
          fillToMax
          onValueChange={(vals) => {
            const val = typeof vals === "number" ? vals : vals[0]
            setDragRating(val)
          }}
          onValueCommitted={(vals) => {
            const val = typeof vals === "number" ? vals : vals[0]
            setDragRating(null)
            onPendingChange({ ...filters, rating_min: val > 1 ? val : undefined })
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
            onValueChange={(vals) => {
              const pos = typeof vals === "number" ? vals : vals[0]
              setDragVotesPos(pos)
            }}
            onValueCommitted={(vals) => {
              const pos = typeof vals === "number" ? vals : vals[0]
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

      <Button variant="default" onClick={onApply}>Apply</Button>
    </div>
  )
}
