# Plan: IMDb Look & Feel — Color Schema

## Context
The project is an IMDb movie explorer. Its current UI uses shadcn's default neutral gray palette with no accent color and defaults to light mode. The goal is to align the visual identity with IMDb's actual design: dark-first, with IMDb's signature gold (`#f5c518`) as the sole accent color.

A new `.imdb` CSS class is added as a self-contained theme — the existing `:root` (light) and `.dark` blocks are left completely untouched. The layout applies `dark imdb` on `<html>`: `dark` enables Tailwind's `dark:` variant (used internally by some shadcn components); `.imdb` provides all IMDb-specific token values and — coming after `.dark` in the file — wins on every variable overlap.

## IMDb Color Reference
| Role | Hex | oklch approx |
|---|---|---|
| Page background | `#121212` | `oklch(0.11 0 0)` |
| Card / surface | `#1f1f1f` | `oklch(0.155 0 0)` |
| Header (navbar) | `#000000` | pure black |
| Sidebar | `#0d0d0d` | `oklch(0.09 0 0)` |
| Border | `#3a3a3a` | `oklch(0.27 0 0)` |
| Primary text | `#ffffff` | `oklch(0.985 0 0)` |
| Muted text | `#a5a5a5` | `oklch(0.66 0 0)` |
| **IMDb gold** | `#f5c518` | `oklch(0.82 0.185 87)` |

## TODO

### TODO-1 — Add `.imdb` theme block (`globals.css`)
Append a new `.imdb { }` block at the end of `frontend/src/app/globals.css`, defining all shadcn CSS variables with IMDb values:
- `--background` → `oklch(0.11 0 0)`
- `--foreground` → `oklch(0.985 0 0)`
- `--card` / `--card-foreground` / `--popover` / `--popover-foreground` → dark surface + white text
- `--primary` → `oklch(0.82 0.185 87)` (IMDb gold)
- `--primary-foreground` → `oklch(0.11 0 0)` (dark text on gold)
- `--secondary` / `--muted` → `oklch(0.22 0 0)` (`#2c2c2c`)
- `--secondary-foreground` / `--accent-foreground` → `oklch(0.985 0 0)`
- `--muted-foreground` → `oklch(0.66 0 0)` (`#a5a5a5`)
- `--accent` → `oklch(0.82 0.185 87)` (gold hover states)
- `--border` / `--input` → `oklch(0.27 0 0)` (`#3a3a3a`)
- `--ring` → gold
- `--chart-1` → gold; charts 2–5 remain neutral grays
- `--sidebar` → `oklch(0.09 0 0)` (near-black)
- `--sidebar-foreground` → `oklch(0.985 0 0)`
- `--sidebar-primary` → gold; `--sidebar-primary-foreground` → dark
- `--sidebar-accent` / `--sidebar-border` / `--sidebar-ring` → matching dark values

### TODO-2 — Force IMDb mode (`layout.tsx`)
In `frontend/src/app/layout.tsx`, apply both `dark` and `imdb` classes to `<html>`:
```tsx
className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark imdb`}
```

### TODO-3 — Header background + histogram color (`page.tsx`)
In `frontend/src/app/page.tsx`:
- Header: add `bg-black` → `<header className="border-b bg-black px-4 py-3 lg:px-6">`
- MiniScoreBars: `bg-yellow-400/80` → `bg-primary/80` (uses the themed gold token)

### TODO-4 — Gold rating numbers (`MovieList.tsx`)
In `frontend/src/components/MovieList.tsx`, add `text-primary` to the rating `<span>`:
```tsx
<span className="shrink-0 font-bold tabular-nums text-primary">
```

## Verification
1. `pnpm dev` in `frontend/`
2. App opens dark with no light flash
3. Header is pure black; sidebar near-black; page background deep dark gray
4. Apply button, slider thumbs/tracks render in IMDb gold
5. Movie rating numbers render in gold
6. MiniScoreBars histogram bars are gold
7. Filter chips (secondary bg) and popovers (card bg) use dark surfaces
8. Existing `.dark` block in `globals.css` is unchanged (verify with git diff)
