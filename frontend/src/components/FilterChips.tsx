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
import { buildFilterSlots, isSlotPending, type FilterChipInfo, type FilterSlot } from "@/lib/filterSlots"
import type { FilterParamsBody } from "@/lib/types"
import { FilterChip } from "./FilterChip"
import { FilterPanel } from "./FilterPanel"
import { FilterRecap } from "./FilterRecap"
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
  const hasActiveFilters  = slots.some((slot) => slot.activeChip !== null)
  const mobileActiveSlots = slots.filter((slot): slot is FilterSlot & { activeChip: FilterChipInfo } => slot.activeChip != null)
  const pendingChangeCount = slots.filter(isSlotPending).length
  const filtersButtonLabel = pendingChangeCount > 0 ? `Filters (${pendingChangeCount} pendings)` : "Filters"

  return (
    <div className="flex flex-wrap items-center gap-2 lg:hidden">
      {mobileActiveSlots.map((slot) => (
        <FilterChip
          key={slot.key}
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
        <Sheet>
          <SheetTrigger render={<Button variant="outline" size="sm" className="h-7 gap-1.5" />}>
            <SlidersHorizontalIcon className="size-3.5" />
            {filtersButtonLabel}
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
            <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
            <div className="px-4 pt-2">
              <FilterRecap
                activeFilters={activeFilters}
                pendingFilters={pendingFilters}
                hasPendingChanges={hasPendingChanges}
                onPendingChange={onPendingChange}
                onClearAll={onClearAll}
                onApplyPendingFilters={onApplyPendingFilters}
                onDiscardPendingFilters={onDiscardPendingFilters}
                className="bg-popover"
              />
            </div>
            <div className="p-4 pt-2">
              <IntentInput contextFilters={pendingFilters} onPendingChange={onPendingChange} />
            </div>
            <div className="p-4 pt-2">
              <FilterPanel filters={pendingFilters} onPendingChange={onPendingChange} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
