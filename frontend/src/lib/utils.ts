import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatVotes(voteCount: number): string {
  if (voteCount >= 1_000_000_000) return `${(voteCount / 1_000_000_000).toFixed(1)}B`
  if (voteCount >= 1_000_000) return `${(voteCount / 1_000_000).toFixed(1)}M`
  if (voteCount >= 1_000) return `${Math.round(voteCount / 1_000)}K`
  return voteCount.toLocaleString()
}
