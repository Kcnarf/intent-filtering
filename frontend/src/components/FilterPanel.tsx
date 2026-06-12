"use client"

import { useState } from "react"
import { ChevronsUpDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
      {/* Genres: any of */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Genres (any of)</label>
        <GenreMultiSelect
          selected={filters.genres_or ?? []}
          onChange={(genres) =>
            onChange({ ...filters, genres_or: genres.length ? genres : undefined })
          }
        />
      </div>

      {/* Genres: all of */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Genres (all of)</label>
        <GenreMultiSelect
          selected={filters.genres_and ?? []}
          onChange={(genres) =>
            onChange({ ...filters, genres_and: genres.length ? genres : undefined })
          }
        />
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
