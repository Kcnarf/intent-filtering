"use client"

import { useState } from "react"
import { fetchIntent } from "@/lib/api"
import type { FilterParamsBody } from "@/lib/types"

interface IntentInputProps {
  contextFilters: FilterParamsBody
  onPendingChange: (filters: FilterParamsBody) => void
}

export function IntentInput({ contextFilters, onPendingChange }: IntentInputProps) {
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit() {
    if (!text.trim() || loading) return
    setLoading(true)
    try {
      const result = await fetchIntent(text.trim(), contextFilters)
      onPendingChange(result.filters)
      setMessage(result.message ?? null)
    } catch {
      setMessage("Failed to process intent. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">Intent filter</label>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          if (message) setMessage(null)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
          }
        }}
        placeholder='Describe what you want, e.g. "sci-fi from the 90s with a high score"…'
        className="min-h-20 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {loading && <p className="text-sm text-muted-foreground">Processing…</p>}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  )
}
