import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/display'
import { formatDate, formatNumber, humanizeKey } from '@/lib/format'
import { cn } from '@/lib/utils'

type Row = Record<string, unknown>

const isPlainObject = (v: unknown): v is Row => !!v && typeof v === 'object' && !Array.isArray(v)
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T|$)/

function formatScalar(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'number') return formatNumber(value)
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (typeof value === 'string') return ISO_DATE.test(value) ? formatDate(value, value.includes('T')) : value
  if (Array.isArray(value)) return value.map(formatScalar).join(', ')
  if (isPlainObject(value)) {
    const label = value.titulo ?? value.nombre ?? value.correo
    if (typeof label === 'string') return label
    return Object.entries(value)
      .map(([k, v]) => `${humanizeKey(k)}: ${formatScalar(v)}`)
      .join(' · ')
  }
  return String(value)
}

/** Flattens one level of nested objects (e.g. { pelicula: {...}, total: 3 }) so rows can be tabulated and charted. */
function flattenRow(row: Row): Row {
  const out: Row = {}
  for (const [key, value] of Object.entries(row)) {
    if (isPlainObject(value)) {
      for (const [k, v] of Object.entries(value)) {
        if (!isPlainObject(v) && !Array.isArray(v)) out[`${key}.${k}`] = v
      }
    } else {
      out[key] = value
    }
  }
  return out
}

function columnLabel(key: string) {
  return key
    .split('.')
    .map((part) => humanizeKey(part))
    .join(' › ')
}

const LABEL_HINTS = ['titulo', 'nombre', 'genero', 'clasificacion', 'director', 'correo']
const ID_LIKE = /(^|\.|_)id($|_)|^id_|año|year/i

function pickChartKeys(rows: Row[]) {
  const keys = Object.keys(rows[0] ?? {})
  const numericKeys = keys.filter((k) => !ID_LIKE.test(k) && rows.every((r) => typeof r[k] === 'number'))
  const stringKeys = keys.filter((k) => rows.every((r) => typeof r[k] === 'string'))
  const labelKey =
    LABEL_HINTS.map((hint) => stringKeys.find((k) => k.split('.').pop() === hint)).find(Boolean) ?? stringKeys[0]
  return labelKey && numericKeys.length ? { labelKey, valueKey: numericKeys[0] } : null
}

export function DataBarChart({
  data,
  labelKey,
  valueKey,
  height = 260,
}: {
  data: Row[]
  labelKey: string
  valueKey: string
  height?: number
}) {
  const chartData = data.slice(0, 12).map((row) => ({
    label: String(row[labelKey]),
    value: Number(row[valueKey]),
  }))
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
          <CartesianGrid horizontal={false} stroke="var(--border)" />
          <XAxis type="number" allowDecimals={false} stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="label"
            width={120}
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: string) => (v.length > 18 ? `${v.slice(0, 17)}…` : v)}
          />
          <Tooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
            contentStyle={{
              background: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--popover-foreground)',
              fontSize: 12,
            }}
            labelStyle={{ color: 'var(--foreground)' }}
            formatter={(v) => [formatNumber(Number(v)), columnLabel(valueKey)]}
          />
          <Bar dataKey="value" fill="var(--chart-1)" radius={[0, 4, 4, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function DataTable({ rows }: { rows: Row[] }) {
  const columns = Array.from(new Set(rows.flatMap((r) => Object.keys(r))))
  return (
    <div className="scrollbar-thin overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col" className="px-3 py-2 font-medium whitespace-nowrap">
                {columnLabel(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-muted/20">
              {columns.map((c) => (
                <td key={c} className={cn('px-3 py-2 whitespace-nowrap', typeof row[c] === 'number' && 'tabular-nums')}>
                  {formatScalar(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ArraySection({ title, items }: { title: string; items: unknown[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sin datos.</p>
        </CardContent>
      </Card>
    )
  }
  const objectItems = items.every(isPlainObject)
  const rows = objectItems ? (items as Row[]).map(flattenRow) : []
  const chart = objectItems ? pickChartKeys(rows) : null

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <span className="text-xs text-muted-foreground">{items.length} registros</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {chart && <DataBarChart data={rows} labelKey={chart.labelKey} valueKey={chart.valueKey} />}
        {objectItems ? (
          <DataTable rows={rows} />
        ) : (
          <ul className="flex flex-wrap gap-2">
            {items.map((item, i) => (
              <li key={i} className="rounded-md border border-border bg-muted/30 px-2.5 py-1 text-sm">
                {formatScalar(item)}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

/** Key/value map of numbers, e.g. { "Drama": 4, "Acción": 2 } — renders as a chart. */
function isNumericMap(value: unknown): value is Record<string, number> {
  return isPlainObject(value) && Object.keys(value).length > 1 && Object.values(value).every((v) => typeof v === 'number')
}

/**
 * Renders a response whose schema the API does not document. It only shows the
 * keys and values that the server actually returned.
 */
export function DynamicData({ data, className }: { data: unknown; className?: string }) {
  if (data === null || data === undefined || (isPlainObject(data) && Object.keys(data).length === 0)) {
    return <p className="text-sm text-muted-foreground">El servidor no devolvió datos.</p>
  }
  if (Array.isArray(data)) {
    return (
      <div className={cn('grid gap-4', className)}>
        <ArraySection title="Resultados" items={data} />
      </div>
    )
  }
  if (!isPlainObject(data)) {
    return <p className="text-sm text-foreground">{formatScalar(data)}</p>
  }

  const scalars = Object.entries(data).filter(([, v]) => !isPlainObject(v) && !Array.isArray(v))
  const arrays = Object.entries(data).filter(([, v]) => Array.isArray(v)) as [string, unknown[]][]
  const objects = Object.entries(data).filter(([, v]) => isPlainObject(v)) as [string, Row][]

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {scalars.length > 0 && (
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {scalars.map(([key, value]) => (
            <div key={key} className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
              <dt className="text-xs text-muted-foreground">{humanizeKey(key)}</dt>
              <dd
                className={cn(
                  'truncate font-semibold text-foreground',
                  typeof value === 'number' ? 'font-display text-3xl tracking-wide tabular-nums' : 'text-base',
                )}
                title={formatScalar(value)}
              >
                {formatScalar(value)}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {(arrays.length > 0 || objects.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {objects.map(([key, value]) =>
            isNumericMap(value) ? (
              <Card key={key} className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>{humanizeKey(key)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataBarChart
                    data={Object.entries(value).map(([label, n]) => ({ label, value: n }))}
                    labelKey="label"
                    valueKey="value"
                  />
                </CardContent>
              </Card>
            ) : (
              <Card key={key}>
                <CardHeader>
                  <CardTitle>{humanizeKey(key)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <DynamicData data={value} />
                </CardContent>
              </Card>
            ),
          )}
          {arrays.map(([key, value]) => (
            <ArraySection key={key} title={humanizeKey(key)} items={value} />
          ))}
        </div>
      )}
    </div>
  )
}
