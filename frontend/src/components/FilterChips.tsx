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

interface GridSlot {
  key: string
  defaultLabel: string
  activeChip: Chip | null
  pendingChip: Chip | null
}

function formatVotes(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return String(n)
}

function yearLabel(f: FilterParams): string {
  if (f.year_min && f.year_max) return `${f.year_min}–${f.year_max}`
  if (f.year_min) return `From ${f.year_min}`
  if (f.year_max) return `Until ${f.year_max}`
  return ""
}


function buildGridSlots(active: FilterParams, pending: FilterParamsBody): GridSlot[] {
  const p = pending as FilterParams
  const slots: GridSlot[] = []

  const aOr = active.genres_or?.length ? active.genres_or : null
  const pOr = p.genres_or?.length ? p.genres_or : null
  if (aOr || pOr) slots.push({
    key: "genres_or", defaultLabel: "All genres",
    activeChip:  aOr ? { label: aOr.join(" or "),  clear: { ...active, genres_or: undefined } } : null,
    pendingChip: pOr ? { label: pOr.join(" or "),  clear: { ...p,      genres_or: undefined } } : null,
  })

  const aAnd = active.genres_and?.length ? active.genres_and : null
  const pAnd = p.genres_and?.length ? p.genres_and : null
  if (aAnd || pAnd) slots.push({
    key: "genres_and", defaultLabel: "All genres",
    activeChip:  aAnd ? { label: aAnd.join(" + "), clear: { ...active, genres_and: undefined } } : null,
    pendingChip: pAnd ? { label: pAnd.join(" + "), clear: { ...p,      genres_and: undefined } } : null,
  })

  const aYear = active.year_min || active.year_max
  const pYear = p.year_min || p.year_max
  if (aYear || pYear) slots.push({
    key: "year", defaultLabel: "Any year",
    activeChip:  aYear ? { label: yearLabel(active), clear: { ...active, year_min: undefined, year_max: undefined } } : null,
    pendingChip: pYear ? { label: yearLabel(p),      clear: { ...p,      year_min: undefined, year_max: undefined } } : null,
  })

  const aRating = active.rating_min ?? null
  const pRating = p.rating_min ?? null
  if (aRating || pRating) slots.push({
    key: "rating_min", defaultLabel: "Any rating",
    activeChip:  aRating ? { label: `Rating ≥ ${aRating.toFixed(1)}`, clear: { ...active, rating_min: undefined } } : null,
    pendingChip: pRating ? { label: `Rating ≥ ${pRating.toFixed(1)}`, clear: { ...p,      rating_min: undefined } } : null,
  })

  const aVotes = active.votes_min ?? null
  const pVotes = p.votes_min ?? null
  if (aVotes || pVotes) slots.push({
    key: "votes_min", defaultLabel: "Any votes",
    activeChip:  aVotes ? { label: `Votes ≥ ${formatVotes(aVotes)}`, clear: { ...active, votes_min: undefined } } : null,
    pendingChip: pVotes ? { label: `Votes ≥ ${formatVotes(pVotes)}`, clear: { ...p,      votes_min: undefined } } : null,
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
  const hasActiveFilters  = slots.some((s) => s.activeChip  !== null)
  const hasPendingFilters = slots.some((s) => s.pendingChip !== null)

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
            {slots.map((slot) => slot.pendingChip && (
              <span key={`p-${slot.key}`} className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {slot.pendingChip.label}
                <button type="button" onClick={() => onPendingChange(slot.pendingChip!.clear as FilterParamsBody)} className="rounded-full p-0.5 hover:bg-primary/20" aria-label={`Remove pending ${slot.pendingChip.label} filter`}>
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
          {slots.map((slot) => slot.activeChip && (
            <span key={`a-${slot.key}`} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
              {slot.activeChip.label}
              <button type="button" onClick={() => onChange(slot.activeChip!.clear)} className="rounded-full p-0.5 hover:bg-foreground/10" aria-label={`Remove ${slot.activeChip.label} filter`}>
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
              {slots.map((slot) =>
                slot.pendingChip ? (
                  <span key={`p-${slot.key}`} className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {slot.pendingChip.label}
                    <button type="button" onClick={() => onPendingChange(slot.pendingChip!.clear as FilterParamsBody)} className="rounded-full p-0.5 hover:bg-primary/20" aria-label={`Remove pending ${slot.pendingChip.label} filter`}>
                      <XIcon className="size-3" />
                    </button>
                  </span>
                ) : (
                  <span key={`p-${slot.key}`} className="text-xs italic text-muted-foreground">{slot.defaultLabel}</span>
                )
              )}
              <div className="flex justify-end gap-2">
                <Button size="sm" className="h-6 px-2 text-xs" onClick={onApply}>Apply filters</Button>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onDiscard}>Discard</Button>
              </div>
            </>
          )}

          {/* Active row */}
          {slots.map((slot) =>
            slot.activeChip ? (
              <span key={`a-${slot.key}`} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                {slot.activeChip.label}
                <button type="button" onClick={() => onChange(slot.activeChip!.clear)} className="rounded-full p-0.5 hover:bg-foreground/10" aria-label={`Remove ${slot.activeChip.label} filter`}>
                  <XIcon className="size-3" />
                </button>
              </span>
            ) : (
              <span key={`a-${slot.key}`} className="text-xs italic text-muted-foreground">{slot.defaultLabel}</span>
            )
          )}
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
