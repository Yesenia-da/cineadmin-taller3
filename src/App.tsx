import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { SWRConfig } from 'swr'
import { AppLayout } from '@/components/layout/app-layout'
import { EmptyState } from '@/components/shared/states'
import { ActiveUserProvider } from '@/hooks/use-active-user'
import { DashboardPage } from '@/pages/dashboard-page'
import { FavoritosPage } from '@/pages/favoritos-page'
import { PeliculasPage } from '@/pages/peliculas-page'
import { RecomendacionesPage } from '@/pages/recomendaciones-page'
import { ReportesPage } from '@/pages/reportes-page'
import { UsuariosPage } from '@/pages/usuarios-page'
import { ApiError } from '@/services/http'

function NotFound() {
  return (
    <EmptyState
      title="Página no encontrada"
      description="La ruta que buscas no existe."
      action={
        <Link
          to="/"
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Volver al panel
        </Link>
      }
    />
  )
}

export default function App() {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        dedupingInterval: 5_000,
        errorRetryCount: 2,
        onErrorRetry: (error, _key, config, revalidate, { retryCount }) => {
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) return
          if (retryCount >= (config.errorRetryCount ?? 2)) return
          setTimeout(() => revalidate({ retryCount }), 2_000)
        },
      }}
    >
      <ActiveUserProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="peliculas" element={<PeliculasPage />} />
              <Route path="usuarios" element={<UsuariosPage />} />
              <Route path="favoritos" element={<FavoritosPage />} />
              <Route path="reportes" element={<ReportesPage />} />
              <Route path="recomendaciones" element={<RecomendacionesPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster theme="dark" position="top-right" richColors closeButton />
      </ActiveUserProvider>
    </SWRConfig>
  )
}
