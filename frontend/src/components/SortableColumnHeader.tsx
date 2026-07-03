import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import type { SortDirection, SortField } from "@/lib/types"

interface SortableColumnHeaderProps {
  field: SortField
  label: string
  currentSortBy: SortField
  currentSortDirection: SortDirection
  onClick: (field: SortField) => void
  className?: string
}

export function SortableColumnHeader({
  field,
  label,
  currentSortBy,
  currentSortDirection,
  onClick,
  className,
}: SortableColumnHeaderProps) {
  const isActive = field === currentSortBy
  const SortIcon = isActive
    ? currentSortDirection === "asc" ? ArrowUp : ArrowDown
    : ArrowUpDown

  return (
    <button
      onClick={() => onClick(field)}
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
