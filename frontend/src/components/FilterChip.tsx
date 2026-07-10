import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface FilterChipProps {
  label: string
  onRemove: () => void
  variant: "active" | "pending"
  ariaLabel: string
}

export function FilterChip({ label, onRemove, variant, ariaLabel }: FilterChipProps) {
  const isPending = variant === "pending"
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
      isPending
        ? "border-border bg-secondary text-secondary-foreground"
        : "border-primary bg-primary/10 text-primary"
    )}>
      {label}
      <button
        type="button"
        onClick={onRemove}
        className={cn("rounded-full p-0.5", isPending ? "hover:bg-foreground/10" : "hover:bg-primary/20")}
        aria-label={ariaLabel}
      >
        <XIcon className="size-3" />
      </button>
    </span>
  )
}
