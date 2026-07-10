"use client"

import { SlidersHorizontalIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { buildFilterSlots, type FilterChipInfo, type FilterSlot } from "@/lib/filterSlots"
import type { FilterParamsBody } from "@/lib/types"
import { FilterChip } from "./FilterChip"
import { FilterPanel } from "./FilterPanel"
import { IntentInput } from "./IntentInput"

interface FilterChipsProps {
  activeFilters: FilterParamsBody
  pendingFilters: FilterParamsBody
  hasPendingChanges: boolean
  onPendingChange: (delta: Partial<FilterParamsBody>) => void
  onClearAll: () => void
  onApplyPendingFilters: () => void
  onDiscardPendingFilters: () => void
}

export function FilterChips({ activeFilters, pendingFilters, hasPendingChanges, onPendingChange, onClearAll, onApplyPendingFilters, onDiscardPendingFilters }: FilterChipsProps) {
  const slots = buildFilterSlots(activeFilters, pendingFilters)
  const hasActiveFilters  = slots.some((slot) => slot.activeChip  !== null)
  const hasPendingFilters = slots.some((slot) => slot.pendingChip !== null)

  const mobilePendingSlots = slots.filter((slot): slot is FilterSlot & { pendingChip: FilterChipInfo } => slot.pendingChip != null)
  const mobileActiveSlots  = slots.filter((slot): slot is FilterSlot & { activeChip: FilterChipInfo }  => slot.activeChip  != null)

  const filtersSheet = (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" size="sm" className="h-7 gap-1.5" />}>
        <SlidersHorizontalIcon className="size-3.5" />
        Filters
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
        <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
        <div className="p-4 pt-2">
          <IntentInput contextFilters={pendingFilters} onPendingChange={onPendingChange} />
        </div>
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
              <FilterChip
                key={`p-${slot.key}`}
                label={slot.pendingChip.label}
                onRemove={() => onPendingChange(slot.pendingChip.clear)}
                variant="pending"
                ariaLabel={`Remove pending ${slot.pendingChip.label} filter`}
              />
            ))}
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" className="h-6 px-2 text-xs" onClick={onApplyPendingFilters}>Apply filters</Button>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onDiscardPendingFilters}>Discard</Button>
              {filtersSheet}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {mobileActiveSlots.map((slot) => (
            <FilterChip
              key={`a-${slot.key}`}
              label={slot.activeChip.label}
              onRemove={() => onPendingChange(slot.activeChip.clear)}
              variant="active"
              ariaLabel={`Remove ${slot.activeChip.label} filter`}
            />
          ))}
          <div className="ml-auto flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onClearAll}>Clear all</Button>
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
                  <FilterChip
                    key={`p-${slot.key}`}
                    label={pendingChip.label}
                    onRemove={() => onPendingChange(pendingChip.clear)}
                    variant="pending"
                    ariaLabel={`Remove pending ${pendingChip.label} filter`}
                  />
                ) : (
                  <span key={`p-${slot.key}`} className="text-xs italic text-muted-foreground">{slot.defaultLabel}</span>
                )
              })}
              <div className="flex justify-end gap-2">
                <Button size="sm" className="h-6 px-2 text-xs" onClick={onApplyPendingFilters}>Apply filters</Button>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onDiscardPendingFilters}>Discard</Button>
              </div>
            </>
          )}

          {/* Active row */}
          {slots.map((slot) => {
            const activeChip = slot.activeChip
            return activeChip ? (
              <FilterChip
                key={`a-${slot.key}`}
                label={activeChip.label}
                onRemove={() => onPendingChange(activeChip.clear)}
                variant="active"
                ariaLabel={`Remove ${activeChip.label} filter`}
              />
            ) : (
              <span key={`a-${slot.key}`} className="text-xs italic text-muted-foreground">{slot.defaultLabel}</span>
            )
          })}
          <div className="flex justify-end gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onClearAll}>Clear all</Button>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
