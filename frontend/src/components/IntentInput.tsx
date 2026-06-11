export function IntentInput() {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-muted-foreground">
        Intent filter{" "}
        <span className="text-xs font-normal">(coming in Stage 3)</span>
      </label>
      <textarea
        disabled
        placeholder='Describe what you want in plain text, e.g. "last year sci-fi with a high score (>4)"…'
        className="min-h-20 w-full resize-none rounded-lg border border-dashed border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground placeholder:text-muted-foreground/50 disabled:cursor-not-allowed"
      />
    </div>
  )
}
