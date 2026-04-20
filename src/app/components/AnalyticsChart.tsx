import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardActivityPoint } from "../types/medical";

interface AnalyticsChartProps {
  title: string;
  description: string;
  data: DashboardActivityPoint[];
}

export function AnalyticsChart({
  title,
  description,
  data,
}: AnalyticsChartProps) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="mb-1 text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="hidden items-center gap-4 md:flex">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-3 rounded-sm bg-chart-1" />
            Приемы
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-3 rounded-sm bg-chart-2" />
            Медкарты
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-3 rounded-sm bg-chart-3" />
            Пациенты
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} barGap={6}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid var(--color-border)",
              borderRadius: 16,
              fontSize: 12,
            }}
          />
          <Bar dataKey="appointments" fill="var(--color-chart-1)" radius={[8, 8, 0, 0]} />
          <Bar dataKey="records" fill="var(--color-chart-2)" radius={[8, 8, 0, 0]} />
          <Bar dataKey="patients" fill="var(--color-chart-3)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
