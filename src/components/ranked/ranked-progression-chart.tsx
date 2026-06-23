"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { tierName } from "@/lib/valorant-ranks"
import type { RankedProgressionPoint } from "@/server/valorant/analytics/ranked"

export function RankedProgressionChart({
  points,
  mode,
}: {
  points: RankedProgressionPoint[]
  mode: "index" | "date"
}) {
  const tiers = points.map((p) => p.tierId)
  const min = Math.max(0, Math.min(...tiers) - 1)
  const max = Math.max(...tiers) + 1
  const ticks: number[] = []
  for (let t = min; t <= max; t += 1) ticks.push(t)
  const data = points.map((p) => ({ x: mode === "index" ? `${p.index}` : p.label, tier: p.tierId, name: p.tierName }))

  return (
    <div className="h-72 w-full min-w-0">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 14 }}>
          <defs>
            <linearGradient id="rankProg" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="x" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={92}
            domain={[min, max]}
            ticks={ticks}
            tickFormatter={(v: number) => tierName(v) ?? ""}
          />
          <Tooltip
            contentStyle={{ background: "rgba(9,9,11,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
            labelStyle={{ color: "#a1a1aa" }}
            formatter={(v) => [tierName(Number(v)) ?? "—", "Rango"] as [string, string]}
          />
          <Area type="stepAfter" dataKey="tier" stroke="#c084fc" strokeWidth={2.5} fill="url(#rankProg)" dot={{ r: 3, fill: "#c084fc" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
