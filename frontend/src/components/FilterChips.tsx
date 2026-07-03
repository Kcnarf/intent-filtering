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
import { formatVotes } from "@/lib/utils"
import { FilterPanel } from "./FilterPanel"

interface Chip {
  label: string
  clear: FilterParams
}

interface GridSlot {
  key: string
  defaultLabel: string
  activeChip: Chip | null
  pendingChip: Chip | null
}

function yearLabel(filters: FilterParams): string {
  if (filters.year_min && filters.year_max) return `${filters.year_min}–${filters.year_max}`
  if (filters.year_min) return `From ${filters.year_min}`
  if (filters.year_max) return `Until ${filters.year_max}`
  return ""
}


function buildGridSlots(active: FilterParams, pending: FilterParamsBody): GridSlot[] {
  const pendingParams = pending as FilterParams
  const slots: GridSlot[] = []

  const aOr = active.genres_or?.length ? active.genres_or : null
  const pOr = pendingParams.genres_or?.length ? pendingParams.genres_or : null
  if (aOr || pOr) slots.push({
    key: "genres_or", defaultLabel: "All genres",
    activeChip:  aOr ? { label: aOr.join(" or "),  clear: { ...active,        genres_or: undefined } } : null,
    pendingChip: pOr ? { label: pOr.join(" or "),  clear: { ...pendingParams, genres_or: undefined } } : null,
  })

  const aAnd = active.genres_and?.length ? active.genres_and : null
  const pAnd = pendingParams.genres_and?.length ? pendingParams.genres_and : null
  if (aAnd || pAnd) slots.push({
    key: "genres_and", defaultLabel: "All genres",
    activeChip:  aAnd ? { label: aAnd.join(" + "), clear: { ...active,        genres_and: undefined } } : null,
    pendingChip: pAnd ? { label: pAnd.join(" + "), clear: { ...pendingParams, genres_and: undefined } } : null,
  })

  const aYear = active.year_min || active.year_max
  const pYear = pendingParams.year_min || pendingParams.year_max
  if (aYear || pYear) slots.push({
    key: "year", defaultLabel: "Any year",
    activeChip:  aYear ? { label: yearLabel(active),        clear: { ...active,        year_min: undefined, year_max: undefined } } : null,
    pendingChip: pYear ? { label: yearLabel(pendingParams), clear: { ...pendingParams, year_min: undefined, year_max: undefined } } : null,
  })

  const aRating = active.rating_min ?? null
  const pRating = pendingParams.rating_min ?? null
  if (aRating || pRating) slots.push({
    key: "rating_min", defaultLabel: "Any rating",
    activeChip:  aRating ? { label: `Rating ≥ ${aRating.toFixed(1)}`, clear: { ...active,        rating_min: undefined } } : null,
    pendingChip: pRating ? { label: `Rating ≥ ${pRating.toFixed(1)}`, clear: { ...pendingParams, rating_min: undefined } } : null,
  })

  const aVotes = active.votes_min ?? null
  const pVotes = pendingParams.votes_min ?? null
  if (aVotes || pVotes) slots.push({
    key: "votes_min", defaultLabel: "Any votes",
    activeChip:  aVotes ? { label: `Votes ≥ ${formatVotes(aVotes)}`, clear: { ...active,        votes_min: undefined } } : null,
    pendingChip: pVotes ? { label: `Votes ≥ ${formatVotes(pVotes)}`, clear: { ...pendingParams, votes_min: undefined } } : null,
  })

  return slots
}

interface FilterChipsProps {
  filters: FilterParams
  onChange: (filters: FilterParams) => void
  pendingFilters: FilterParamsBody
  onPendingChange: (filters: FilterParamsBody) => void
  onApply: () => void
  onDiscard: () => void
  hasPendingChanges: boolean
}

export function FilterChips({ filters, onChange, pendingFilters, onPendingChange, onApply, onDiscard, hasPendingChanges }: FilterChipsProps) {
  const slots = buildGridSlots(filters, pendingFilters)
  const hasActiveFilters  = slots.some((slot) => slot.activeChip  !== null)
  const hasPendingFilters = slots.some((slot) => slot.pendingChip !== null)

  const mobilePendingSlots = slots.filter((slot): slot is GridSlot & { pendingChip: Chip } => slot.pendingChip != null)
  const mobileActiveSlots  = slots.filter((slot): slot is GridSlot & { activeChip: Chip }  => slot.activeChip  != null)

  const filtersSheet = (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" size="sm" className="h-7 gap-1.5" />}>
        <SlidersHorizontalIcon className="size-3.5" />
        Filters
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
        <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
        <div className="p-4 pt-2">
          <FilterPanel filters={pendingFilters} onPendingChange={onPendingChange} />
        </div>
      </SheetContent>
    </Sheet>
  )

  return (
    <div className="flex flex-col gap-2">

      {/* ── Mobile layout (< lg) ─────────────────────────────── */}
      <div className="flex flex-col gap-2 lg:hidden">
        {hasPendingChanges && (
          <div className="flex flex-wrap items-center gap-2">
            {!hasPendingFilters && (
              <span className="text-xs italic text-muted-foreground">No filters</span>
            )}
            {mobilePendingSlots.map((slot) => (
              <span key={`p-${slot.key}`} className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {slot.pendingChip.label}
                <button type="button" onClick={() => onPendingChange(slot.pendingChip.clear as FilterParamsBody)} className="rounded-full p-0.5 hover:bg-primary/20" aria-label={`Remove pending ${slot.pendingChip.label} filter`}>
                  <XIcon className="size-3" />
                </button>
              </span>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" className="h-6 px-2 text-xs" onClick={onApply}>Apply filters</Button>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onDiscard}>Discard</Button>
              {filtersSheet}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {mobileActiveSlots.map((slot) => (
            <span key={`a-${slot.key}`} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
              {slot.activeChip.label}
              <button type="button" onClick={() => onChange(slot.activeChip.clear)} className="rounded-full p-0.5 hover:bg-foreground/10" aria-label={`Remove ${slot.activeChip.label} filter`}>
                <XIcon className="size-3" />
              </button>
            </span>
          ))}
          <div className="ml-auto flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => onPendingChange({})}>Clear all</Button>
            )}
            {!hasPendingChanges && filtersSheet}
          </div>
        </div>
      </div>

      {/* ── Desktop grid layout (≥ lg) ───────────────────────── */}
      {slots.length > 0 && (
        <div
          className="hidden lg:grid lg:items-center lg:gap-x-3 lg:gap-y-1.5"
          style={{ gridTemplateColumns: `repeat(${slots.length}, auto) 1fr` }}
        >
          {/* Pending row */}
          {hasPendingChanges && (
            <>
              {slots.map((slot) => {
                const pendingChip = slot.pendingChip
                return pendingChip ? (
                  <span key={`p-${slot.key}`} className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {pendingChip.label}
                    <button type="button" onClick={() => onPendingChange(pendingChip.clear as FilterParamsBody)} className="rounded-full p-0.5 hover:bg-primary/20" aria-label={`Remove pending ${pendingChip.label} filter`}>
                      <XIcon className="size-3" />
                    </button>
                  </span>
                ) : (
                  <span key={`p-${slot.key}`} className="text-xs italic text-muted-foreground">{slot.defaultLabel}</span>
                )
              })}
              <div className="flex justify-end gap-2">
                <Button size="sm" className="h-6 px-2 text-xs" onClick={onApply}>Apply filters</Button>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onDiscard}>Discard</Button>
              </div>
            </>
          )}

          {/* Active row */}
          {slots.map((slot) => {
            const activeChip = slot.activeChip
            return activeChip ? (
              <span key={`a-${slot.key}`} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                {activeChip.label}
                <button type="button" onClick={() => onChange(activeChip.clear)} className="rounded-full p-0.5 hover:bg-foreground/10" aria-label={`Remove ${activeChip.label} filter`}>
                  <XIcon className="size-3" />
                </button>
              </span>
            ) : (
              <span key={`a-${slot.key}`} className="text-xs italic text-muted-foreground">{slot.defaultLabel}</span>
            )
          })}
          <div className="flex justify-end gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => onPendingChange({})}>Clear all</Button>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
