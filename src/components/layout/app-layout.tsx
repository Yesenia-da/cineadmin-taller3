import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { BarChart3, Clapperboard, Film, Heart, LayoutDashboard, Menu, Sparkles, Users, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useHealth } from '@/hooks/use-api'
import { API_URL } from '@/lib/config'
import { cn } from '@/lib/utils'

export const NAV_ITEMS: { to: string; label: string; icon: LucideIcon; description: string }[] = [
  { to: '/', label: 'Panel principal', icon: LayoutDashboard, description: 'Resumen general' },
  { to: '/peliculas', label: 'Películas', icon: Film, description: 'Catálogo y gestión' },
  { to: '/usuarios', label: 'Usuarios', icon: Users, description: 'Altas, bajas y edición' },
  { to: '/favoritos', label: 'Favoritos', icon: Heart, description: 'Marcar y consultar' },
  { to: '/reportes', label: 'Reportes', icon: BarChart3, description: 'Estadísticas y gráficas' },
  { to: '/recomendaciones', label: 'Recomendaciones', icon: Sparkles, description: 'Sugerencias por usuario' },
]

function ApiStatus() {
  const { data, error, isLoading } = useHealth()
  const ok = !!data && !error
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-sidebar-foreground">
        <span
          className={cn(
            'size-2 rounded-full',
            isLoading ? 'animate-pulse bg-muted-foreground' : ok ? 'bg-success' : 'bg-destructive',
          )}
          aria-hidden="true"
        />
        {isLoading ? 'Verificando API…' : ok ? 'API conectada' : 'API sin conexión'}
      </div>
      <p className="truncate font-mono text-[0.7rem] text-muted-foreground" title={API_URL}>
        {API_URL}
      </p>
    </div>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center gap-2.5 px-2 pt-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Clapperboard className="size-5" aria-hidden="true" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-display text-2xl tracking-wider text-sidebar-foreground">CineAdmin</span>
          <span className="text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">Plataforma</span>
        </div>
      </div>
      <nav aria-label="Navegación principal" className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('size-4', isActive && 'text-primary')} aria-hidden="true" />
                {label}
                {isActive && <span className="ml-auto h-4 w-1 rounded-full bg-primary" aria-hidden="true" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <ApiStatus />
    </div>
  )
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const current = NAV_ITEMS.find((item) => (item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)))

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú de navegación">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          />
          <aside className="relative h-full w-72 max-w-[85vw] border-r border-sidebar-border bg-sidebar animate-in slide-in-from-left">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              aria-label="Cerrar menú"
            >
              <X className="size-4" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Abrir menú"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <Clapperboard className="size-5 text-primary" aria-hidden="true" />
            <span className="font-display text-xl tracking-wider">CineAdmin</span>
          </div>
          {current && <span className="ml-auto truncate text-xs text-muted-foreground">{current.label}</span>}
        </header>
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-6 md:px-8 md:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
