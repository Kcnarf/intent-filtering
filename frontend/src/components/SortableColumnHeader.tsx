import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import type { SortDirection, SortField } from "@/lib/types"

interface SortableColumnHeaderProps {
  field: SortField
  label: string
  sortBy: SortField
  sortDirection: SortDirection
  onUpdateSortBy: (field: SortField) => void
  className?: string
}

export function SortableColumnHeader({
  field,
  label,
  sortBy,
  sortDirection,
  onUpdateSortBy,
  className,
}: SortableColumnHeaderProps) {
  const isActive = field === sortBy
  const SortIcon = isActive
    ? sortDirection === "asc" ? ArrowUp : ArrowDown
    : ArrowUpDown

  return (
    <button
      onClick={() => onUpdateSortBy(field)}
      className={cn(
        "flex items-center justify-end gap-1 text-xs font-medium hover:text-foreground",
        isActive ? "text-foreground" : "text-muted-foreground",
        className,
      )}
    >
      {label}
      <SortIcon className="h-3 w-3 shrink-0" />
    </button>
  )
}
