import type { FilterParams, FilterParamsBody, IntentOut, MovieOut, MoviesStatOut } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

function toQueryString(filters: FilterParams): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, String(v))
    } else {
      params.set(key, String(value))
    }
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

export async function fetchMoviesStat(filters: FilterParams): Promise<MoviesStatOut> {
  const res = await fetch(`${API_BASE_URL}/api/movies/stat${toQueryString(filters)}`)
  if (!res.ok) throw new Error(`fetchMoviesStat failed: ${res.status}`)
  return res.json()
}

export async function fetchMovies(filters: FilterParams): Promise<MovieOut[]> {
  const res = await fetch(`${API_BASE_URL}/api/movies${toQueryString(filters)}`)
  if (!res.ok) throw new Error(`fetchMovies failed: ${res.status}`)
  return res.json()
}

export async function fetchIntent(intentText: string, currentFilters: FilterParamsBody): Promise<IntentOut> {
  const params = new URLSearchParams()
  params.set("intent_text", intentText)
  for (const [key, value] of Object.entries(currentFilters)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, String(v))
    } else {
      params.set(key, String(value))
    }
  }
  const res = await fetch(`${API_BASE_URL}/api/intent?${params.toString()}`)
  if (!res.ok) throw new Error(`fetchIntent failed: ${res.status}`)
  return res.json()
}
