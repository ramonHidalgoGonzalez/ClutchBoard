"use client"

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import type { RecentTrendPoint } from "@/server/valorant/analytics/comparisons"

export function ComparisonLineChart({ data }: { data: RecentTrendPoint[] }) {
  return (
    <div className="h-72 w-full min-w-0">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
          <XAxis dataKey="label" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis yAxisId="acs" stroke="#f43f5e" fontSize={11} tickLine={false} axisLine={false} width={40} />
          <YAxis
            yAxisId="kda"
            orientation="right"
            stroke="#a855f7"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={36}
            domain={[0, "auto"]}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(9,9,11,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
            }}
            labelStyle={{ color: "#a1a1aa" }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#d4d4d8" }} iconType="circle" />
          <Line yAxisId="acs" type="monotone" dataKey="acs" name="ACS" stroke="#f43f5e" strokeWidth={2.5} dot={false} />
          <Line yAxisId="kda" type="monotone" dataKey="kda" name="KDA" stroke="#a855f7" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
