import { useId } from 'react'
import { Select } from '@/components/ui/form-controls'
import { useActiveUser } from '@/hooks/use-active-user'
import { useUsuarios } from '@/hooks/use-api'
import { cn } from '@/lib/utils'

interface UserSelectProps {
  className?: string
  label?: string
  hideLabel?: boolean
}

export function UserSelect({ className, label = 'Usuario activo', hideLabel }: UserSelectProps) {
  const id = useId()
  const { activeUserId, setActiveUserId } = useActiveUser()
  const { data, isLoading, error } = useUsuarios()

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className={cn('text-xs font-medium text-muted-foreground', hideLabel && 'sr-only')}>
        {label}
      </label>
      <Select
        id={id}
        value={activeUserId ?? ''}
        disabled={isLoading || !!error}
        onChange={(event) => setActiveUserId(event.target.value ? Number(event.target.value) : null)}
      >
        <option value="">
          {isLoading ? 'Cargando usuarios…' : error ? 'Error al cargar usuarios' : 'Selecciona un usuario'}
        </option>
        {data?.map((usuario) => (
          <option key={usuario.id} value={usuario.id}>
            {usuario.nombre} — {usuario.correo}
          </option>
        ))}
      </Select>
    </div>
  )
}
