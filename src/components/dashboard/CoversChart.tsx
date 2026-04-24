import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { COVERS_BY_SLOT } from "@/lib/mock-data";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export function CoversChart() {
  return (
    <Card className="col-span-5 p-[18px]">
      <CardHeader>
        <CardTitle>
          Couverts · <span className="text-ember-soft">par créneau</span>
        </CardTitle>
        <span className="text-[11.5px] text-ink-3 mono">14 créneaux</span>
      </CardHeader>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={COVERS_BY_SLOT} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="cov-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--ember)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--ember)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--line)" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="t"
              tick={{ fill: "var(--ink-4)", fontSize: 10, fontFamily: "JetBrains Mono" }}
              axisLine={false}
              tickLine={false}
              interval={1}
            />
            <YAxis
              tick={{ fill: "var(--ink-4)", fontSize: 10, fontFamily: "JetBrains Mono" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "var(--bg-2)",
                border: "1px solid var(--line-2)",
                borderRadius: 10,
                fontSize: 12,
              }}
              cursor={{ stroke: "var(--ember-deep)", strokeWidth: 1, strokeDasharray: "3 3" }}
              labelStyle={{ color: "var(--ink-2)" }}
              itemStyle={{ color: "var(--ember-soft)" }}
              formatter={(v) => [`${v} cv`, "Couverts"]}
            />
            <Area
              type="monotone"
              dataKey="v"
              stroke="var(--ember)"
              strokeWidth={2}
              fill="url(#cov-grad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
