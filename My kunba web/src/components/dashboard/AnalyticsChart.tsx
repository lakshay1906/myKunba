'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export type ChartDataPoint = { date: string; fullDate: string; views: number }

export default function AnalyticsChart({ data }: { data: ChartDataPoint[] }) {
  if (data.length === 0) return null

  return (
    <div className="h-[280px] w-full text-muted-foreground">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: 'currentColor' }}
            stroke="hsl(var(--border))"
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'currentColor' }}
            stroke="hsl(var(--border))"
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
          />
          <Tooltip
            cursor={{ stroke: 'hsl(var(--border))' }}
            content={({ active, payload }) =>
              active && payload?.[0] ? (
                <div className="rounded-md border bg-background px-3 py-2 text-sm shadow-md">
                  <p className="font-medium text-foreground">{payload[0].payload.fullDate}</p>
                  <p className="text-muted-foreground tabular-nums">
                    {Number(payload[0].value).toLocaleString()} views
                  </p>
                </div>
              ) : null
            }
          />
          <Area
            type="monotone"
            dataKey="views"
            stroke="hsl(var(--primary))"
            fill="url(#viewsGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
