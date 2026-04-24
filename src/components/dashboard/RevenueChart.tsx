import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { REVENUE_7D } from "@/lib/mock-data";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export function RevenueChart() {
  return (
    <Card className="col-span-7 p-[18px]">
      <CardHeader>
        <CardTitle>
          CA · <span className="text-ember-soft">7 derniers jours</span>
        </CardTitle>
        <div className="flex gap-[14px] text-[11.5px] text-ink-3">
          <Legend color="var(--amber)" label="Déjeuner" />
          <Legend color="var(--ember)" label="Dîner" />
        </div>
      </CardHeader>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={REVENUE_7D} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="var(--line)" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: "var(--ink-3)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--ink-4)", fontSize: 10, fontFamily: "JetBrains Mono" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
            />
            <Tooltip
              contentStyle={{
                background: "var(--bg-2)",
                border: "1px solid var(--line-2)",
                borderRadius: 10,
                fontSize: 12,
              }}
              cursor={{ fill: "rgba(232,115,58,0.06)" }}
              labelStyle={{ color: "var(--ink-2)" }}
              itemStyle={{ color: "var(--ink-1)" }}
              formatter={(v) => `${Number(v).toLocaleString("fr-FR")} €`}
            />
            <Bar dataKey="lunch" name="Déjeuner" stackId="a" fill="var(--amber)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="dinner" name="Dîner" stackId="a" fill="var(--ember)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center">
      <span
        className="inline-block w-2 h-2 rounded-sm mr-[6px] align-middle"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
