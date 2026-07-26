import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { formatCompactCurrency, formatCurrency } from '@/lib/format'
import { useResults } from '@/store/simulator'

export function ProjectionChart() {
  const { projection, growth } = useResults()
  const data = projection.map((mrr, month) => ({ month, mrr }))

  return (
    <Card className="p-5">
      <p className="text-sm font-medium">36-month projection</p>

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="month"
              tickFormatter={(month: number) => `M${month}`}
              stroke="var(--muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval={5}
            />
            <YAxis
              tickFormatter={formatCompactCurrency}
              stroke="var(--muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={64}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value)), 'MRR']}
              labelFormatter={(month) => `Month ${month}`}
              contentStyle={{
                background: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                color: 'var(--popover-foreground)',
                fontSize: 12,
              }}
            />
            {growth.mrrCeiling !== null && (
              <ReferenceLine
                y={growth.mrrCeiling}
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
                label={{
                  value: `Ceiling ${formatCurrency(growth.mrrCeiling)}`,
                  position: 'insideTopLeft',
                  fill: 'var(--muted-foreground)',
                  fontSize: 11,
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="mrr"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {growth.mrrCeiling !== null
          ? `At constant churn and acquisition, MRR converges to ${formatCurrency(growth.mrrCeiling)}. Raising that ceiling takes less churn or more acquisition.`
          : 'No ceiling: expansion outpaces churn, the base compounds on its own.'}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Assumption: constant acquisition pace over the whole period.
      </p>
    </Card>
  )
}
