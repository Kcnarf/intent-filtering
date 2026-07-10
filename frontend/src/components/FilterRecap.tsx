import { ArrowRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { buildFilterSlots } from "@/lib/filterSlots"
import { cn } from "@/lib/utils"
import type { FilterParamsBody } from "@/lib/types"
import { FilterChip } from "./FilterChip"

interface FilterRecapProps {
  activeFilters: FilterParamsBody
  pendingFilters: FilterParamsBody
  hasPendingChanges: boolean
  onPendingChange: (delta: Partial<FilterParamsBody>) => void
  onClearAll: () => void
  onApplyPendingFilters: () => void
  onDiscardPendingFilters: () => void
  className?: string
}

export function FilterRecap({ activeFilters, pendingFilters, hasPendingChanges, onPendingChange, onClearAll, onApplyPendingFilters, onDiscardPendingFilters, className }: FilterRecapProps) {
  const slots = buildFilterSlots(activeFilters, pendingFilters)
  const hasActiveFilters = slots.some((slot) => slot.activeChip !== null)

  if (slots.length === 0) return null

  return (
    <div className={cn("sticky top-0 z-10 flex flex-col gap-2 bg-background pb-3", className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        {slots.map((slot) => {
          const activeChip = slot.activeChip
          const pendingChip = slot.pendingChip
          const isSlotPending = (activeChip?.label ?? null) !== (pendingChip?.label ?? null)
          return (
            <span key={slot.key} className="inline-flex items-center gap-1.5">
              {activeChip ? (
                <FilterChip
                  label={activeChip.label}
                  onRemove={() => onPendingChange(activeChip.clear)}
                  variant="active"
                  ariaLabel={`Remove ${activeChip.label} filter`}
                />
              ) : (
                <span className="text-xs italic text-muted-foreground">{slot.defaultLabel}</span>
              )}
              {isSlotPending && (
                <>
                  <ArrowRightIcon className="size-3 text-muted-foreground" />
                  {pendingChip ? (
                    <FilterChip
                      label={pendingChip.label}
                      onRemove={() => onPendingChange(pendingChip.clear)}
                      variant="pending"
                      ariaLabel={`Remove pending ${pendingChip.label} filter`}
                    />
                  ) : (
                    <span className="text-xs italic text-muted-foreground">{slot.defaultLabel}</span>
                  )}
                </>
              )}
            </span>
          )
        })}
      </div>

      {(hasPendingChanges || hasActiveFilters) && (
        <div className="flex items-center gap-2">
          {hasPendingChanges && (
            <>
              <Button size="sm" className="h-6 px-2 text-xs" onClick={onApplyPendingFilters}>Apply filters</Button>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onDiscardPendingFilters}>Discard</Button>
            </>
          )}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="ml-auto h-6 px-2 text-xs" onClick={onClearAll}>Clear all</Button>
          )}
        </div>
      )}
    </div>
  )
}
