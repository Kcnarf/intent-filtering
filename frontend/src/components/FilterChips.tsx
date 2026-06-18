"use client"

import { XIcon, SlidersHorizontalIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { FilterParams, FilterParamsBody } from "@/lib/types"
import { FilterPanel } from "./FilterPanel"

interface Chip {
  label: string
  clear: FilterParams
}

function formatVotes(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return String(n)
}

function buildChips(filters: FilterParams): Chip[] {
  const chips: Chip[] = []

  if (filters.genres_or?.length) {
    chips.push({
      label: filters.genres_or.join(" or "),
      clear: { ...filters, genres_or: undefined },
    })
  }

  if (filters.genres_and?.length) {
    chips.push({
      label: filters.genres_and.join(" + "),
      clear: { ...filters, genres_and: undefined },
    })
  }

  if (filters.year_min || filters.year_max) {
    const label =
      filters.year_min && filters.year_max
        ? `${filters.year_min}–${filters.year_max}`
        : filters.year_min
          ? `From ${filters.year_min}`
          : `Until ${filters.year_max}`
    chips.push({
      label,
      clear: { ...filters, year_min: undefined, year_max: undefined },
    })
  }

  if (filters.rating_min) {
    chips.push({
      label: `Rating ≥ ${filters.rating_min.toFixed(1)}`,
      clear: { ...filters, rating_min: undefined },
    })
  }

  if (filters.votes_min) {
    chips.push({
      label: `Votes ≥ ${formatVotes(filters.votes_min)}`,
      clear: { ...filters, votes_min: undefined },
    })
  }

  return chips
}

interface FilterChipsProps {
  filters: FilterParams
  onChange: (filters: FilterParams) => void
  pendingFilters: FilterParamsBody
  onPendingChange: (filters: FilterParamsBody) => void
  onApply: () => void
}

export function FilterChips({ filters, onChange, pendingFilters, onPendingChange, onApply }: FilterChipsProps) {
  const chips = buildChips(filters)

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <span
          key={chip.label}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
        >
          {chip.label}
          <button
            type="button"
            onClick={() => onChange(chip.clear)}
            className="rounded-full p-0.5 hover:bg-foreground/10"
            aria-label={`Remove ${chip.label} filter`}
          >
            <XIcon className="size-3" />
          </button>
        </span>
      ))}

      {chips.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => { onChange({}); onPendingChange({}) }}
        >
          Clear all
        </Button>
      )}

      {/* Mobile-only: opens FilterPanel in a bottom sheet */}
      <Sheet>
        <SheetTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="ml-auto h-7 gap-1.5 lg:hidden"
            />
          }
        >
          <SlidersHorizontalIcon className="size-3.5" />
          Filters
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="p-4 pt-2">
            <FilterPanel filters={pendingFilters} onPendingChange={onPendingChange} onApply={onApply} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
