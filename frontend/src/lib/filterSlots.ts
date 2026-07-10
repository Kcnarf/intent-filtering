import type { FilterParamsBody } from "@/lib/types"
import { formatVotes } from "@/lib/utils"

export interface FilterChipInfo {
  label: string
  clear: Partial<FilterParamsBody>
}

export interface FilterSlot {
  key: string
  defaultLabel: string
  activeChip: FilterChipInfo | null
  pendingChip: FilterChipInfo | null
}

function yearLabel(filters: FilterParamsBody): string {
  if (filters.year_min && filters.year_max) return `${filters.year_min}–${filters.year_max}`
  if (filters.year_min) return `From ${filters.year_min}`
  if (filters.year_max) return `Until ${filters.year_max}`
  return ""
}

export function buildFilterSlots(activeFilters: FilterParamsBody, pendingFilters: FilterParamsBody): FilterSlot[] {
  const slots: FilterSlot[] = []

  const activeGenresOr = activeFilters.genres_or?.length ? activeFilters.genres_or : null
  const pendingGenresOr = pendingFilters.genres_or?.length ? pendingFilters.genres_or : null
  if (activeGenresOr || pendingGenresOr) slots.push({
    key: "genres_or", defaultLabel: "All genres",
    activeChip:  activeGenresOr ? { label: activeGenresOr.join(" or "),  clear: { genres_or: undefined } } : null,
    pendingChip: pendingGenresOr ? { label: pendingGenresOr.join(" or "),  clear: { genres_or: undefined } } : null,
  })

  const activeGenresAnd = activeFilters.genres_and?.length ? activeFilters.genres_and : null
  const pendingGenresAnd = pendingFilters.genres_and?.length ? pendingFilters.genres_and : null
  if (activeGenresAnd || pendingGenresAnd) slots.push({
    key: "genres_and", defaultLabel: "All genres",
    activeChip:  activeGenresAnd ? { label: activeGenresAnd.join(" + "), clear: { genres_and: undefined } } : null,
    pendingChip: pendingGenresAnd ? { label: pendingGenresAnd.join(" + "), clear: { genres_and: undefined } } : null,
  })

  const hasActiveYear = activeFilters.year_min || activeFilters.year_max
  const hasPendingYear = pendingFilters.year_min || pendingFilters.year_max
  if (hasActiveYear || hasPendingYear) slots.push({
    key: "year", defaultLabel: "Any year",
    activeChip:  hasActiveYear ? { label: yearLabel(activeFilters),  clear: { year_min: undefined, year_max: undefined } } : null,
    pendingChip: hasPendingYear ? { label: yearLabel(pendingFilters), clear: { year_min: undefined, year_max: undefined } } : null,
  })

  const activeRating = activeFilters.rating_min ?? null
  const pendingRating = pendingFilters.rating_min ?? null
  if (activeRating || pendingRating) slots.push({
    key: "rating_min", defaultLabel: "Any rating",
    activeChip:  activeRating ? { label: `Rating ≥ ${activeRating.toFixed(1)}`, clear: { rating_min: undefined } } : null,
    pendingChip: pendingRating ? { label: `Rating ≥ ${pendingRating.toFixed(1)}`, clear: { rating_min: undefined } } : null,
  })

  const activeVotes = activeFilters.votes_min ?? null
  const pendingVotes = pendingFilters.votes_min ?? null
  if (activeVotes || pendingVotes) slots.push({
    key: "votes_min", defaultLabel: "Any votes",
    activeChip:  activeVotes ? { label: `Votes ≥ ${formatVotes(activeVotes)}`, clear: { votes_min: undefined } } : null,
    pendingChip: pendingVotes ? { label: `Votes ≥ ${formatVotes(pendingVotes)}`, clear: { votes_min: undefined } } : null,
  })

  return slots
}
