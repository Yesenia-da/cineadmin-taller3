import type { LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/display'
import { formatNumber } from '@/lib/format'

interface StatCardProps {
  label: string
  value: number | undefined
  icon: LucideIcon
  loading?: boolean
  error?: boolean
  hint?: string
}

export function StatCard({ label, value, icon: Icon, loading, error, hint }: StatCardProps) {
  return (
    <div className="relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card p-5">
      <div className="absolute -top-8 -right-8 size-28 rounded-full bg-primary/5" aria-hidden="true" />
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-10 w-20" />
      ) : (
        <p className="font-display text-5xl leading-none tracking-wide text-foreground tabular-nums">
          {error || value === undefined ? '—' : formatNumber(value)}
        </p>
      )}
      {hint && <p className="text-xs text-muted-foreground">{error ? 'No disponible' : hint}</p>}
    </div>
  )
}
