"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import type { FilterParams } from "@/lib/types"

const GENRES = [
  "Action", "Adventure", "Animation", "Biography", "Comedy", "Crime",
  "Documentary", "Drama", "Family", "Fantasy", "Film-Noir", "History",
  "Horror", "Music", "Musical", "Mystery", "Romance", "Sci-Fi",
  "Sport", "Thriller", "War", "Western",
]

const VOTES_PRESETS = [
  { label: "Any", value: "" },
  { label: "≥ 1K", value: "1000" },
  { label: "≥ 5K", value: "5000" },
  { label: "≥ 10K", value: "10000" },
  { label: "≥ 50K", value: "50000" },
  { label: "≥ 100K", value: "100000" },
  { label: "≥ 500K", value: "500000" },
]

interface FilterPanelProps {
  filters: FilterParams
  onChange: (filters: FilterParams) => void
}

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  // null = idle (slider reads from props); non-null = user is dragging (local visual feedback).
  // This avoids useEffect-based sync: when props change externally (e.g. Stage 3 intent update
  // or Clear all), dragRating is null so the slider immediately reflects the new prop value.
  const [dragRating, setDragRating] = useState<number | null>(null)
  const displayRating = dragRating ?? filters.rating_min ?? 1

  return (
    <div className="flex flex-col gap-5">
      {/* Genre */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Genre</label>
        <Select
          value={filters.genre ?? ""}
          onValueChange={(val) =>
            onChange({ ...filters, genre: val || undefined })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All genres" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All genres</SelectItem>
            {GENRES.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Year range */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Year range</label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="From"
            value={filters.year_min ?? ""}
            max={filters.year_max}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : undefined
              onChange({
                ...filters,
                year_min: val,
                // clamp year_max up if it would fall below the new min
                year_max:
                  val !== undefined && filters.year_max !== undefined && filters.year_max < val
                    ? val
                    : filters.year_max,
              })
            }}
            className="w-24"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            placeholder="To"
            value={filters.year_max ?? ""}
            min={filters.year_min}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : undefined
              onChange({
                ...filters,
                year_max: val,
                // clamp year_min down if it would exceed the new max
                year_min:
                  val !== undefined && filters.year_min !== undefined && filters.year_min > val
                    ? val
                    : filters.year_min,
              })
            }}
            className="w-24"
          />
        </div>
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
          onValueChange={(vals) => {
            const val = typeof vals === "number" ? vals : vals[0]
            setDragRating(val)
          }}
          onValueCommitted={(vals) => {
            const val = typeof vals === "number" ? vals : vals[0]
            setDragRating(null)
            onChange({ ...filters, rating_min: val > 1 ? val : undefined })
          }}
        />
      </div>

      {/* Votes min */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Min votes</label>
        <Select
          value={filters.votes_min != null ? String(filters.votes_min) : ""}
          onValueChange={(val) =>
            onChange({ ...filters, votes_min: val ? Number(val) : undefined })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            {VOTES_PRESETS.map((p) => (
              <SelectItem key={p.label} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
