export interface FilterParamsBody {
  genres_or?: string[]
  genres_and?: string[]
  year_min?: number
  year_max?: number
  rating_min?: number
  votes_min?: number
}

export interface FilterParams extends FilterParamsBody {
  limit?: number
  offset?: number
}

export interface RatingBucketOut {
  label: string
  count: number
}

export interface MoviesStatOut {
  total_count: number
  average_rating: number | null
  total_votes: number | null
  rating_distribution: RatingBucketOut[]
}

export interface MovieOut {
  id: string
  primary_title: string
  original_title: string
  start_year: number | null
  runtime_minutes: number | null
  genres: string | null
  average_rating: number | null
  num_votes: number | null
}

export interface IntentOut {
  filters: FilterParamsBody
  message?: string
}
