import { Film } from 'lucide-react'
import { hashString } from '@/lib/format'
import { cn } from '@/lib/utils'

const PALETTES = [
  ['oklch(0.42 0.14 25)', 'oklch(0.18 0.05 300)'],
  ['oklch(0.45 0.12 230)', 'oklch(0.17 0.04 265)'],
  ['oklch(0.55 0.14 75)', 'oklch(0.2 0.05 30)'],
  ['oklch(0.42 0.11 155)', 'oklch(0.16 0.03 200)'],
  ['oklch(0.4 0.15 300)', 'oklch(0.16 0.04 265)'],
  ['oklch(0.5 0.13 50)', 'oklch(0.18 0.03 265)'],
  ['oklch(0.38 0.1 200)', 'oklch(0.15 0.02 265)'],
]

interface MoviePosterProps {
  titulo: string
  año?: number
  genero?: string
  className?: string
  compact?: boolean
}

/** API movies have no image field, so posters are generated deterministically from the title. */
export function MoviePoster({ titulo, año, genero, className, compact }: MoviePosterProps) {
  const hash = hashString(titulo)
  const [from, to] = PALETTES[hash % PALETTES.length]
  const angle = 120 + (hash % 120)

  return (
    <div
      className={cn('relative isolate flex aspect-[2/3] flex-col justify-end overflow-hidden rounded-lg', className)}
      style={{ background: `linear-gradient(${angle}deg, ${from}, ${to})` }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,oklch(1_0_0/18%),transparent_55%)]" />
      <Film className="absolute top-3 right-3 size-4 text-white/40" />
      <div className={cn('flex flex-col gap-1 bg-gradient-to-t from-black/80 via-black/40 to-transparent', compact ? 'p-2' : 'p-3 pt-10')}>
        {genero && !compact && (
          <span className="text-[0.6rem] font-semibold tracking-[0.18em] text-white/70 uppercase">{genero}</span>
        )}
        <span
          className={cn(
            'font-display leading-[0.95] tracking-wide text-balance text-white',
            compact ? 'line-clamp-2 text-base' : 'line-clamp-3 text-2xl',
          )}
        >
          {titulo}
        </span>
        {año && !compact && <span className="text-xs text-white/60">{año}</span>}
      </div>
    </div>
  )
}
