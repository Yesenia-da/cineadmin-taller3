import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  page: number
  hasNext: boolean
  totalPages?: number
  onChange: (page: number) => void
  summary?: string
}

export function Pagination({ page, hasNext, totalPages, onChange, summary }: PaginationProps) {
  if (page === 1 && !hasNext) return summary ? <p className="text-center text-xs text-muted-foreground">{summary}</p> : null
  return (
    <nav aria-label="Paginación" className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-muted-foreground">{summary}</p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="lg" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft />
          Anterior
        </Button>
        <span className="min-w-24 text-center text-sm text-muted-foreground" aria-current="page">
          Página {page}
          {totalPages ? ` de ${totalPages}` : ''}
        </span>
        <Button variant="outline" size="lg" disabled={!hasNext} onClick={() => onChange(page + 1)}>
          Siguiente
          <ChevronRight />
        </Button>
      </div>
    </nav>
  )
}
