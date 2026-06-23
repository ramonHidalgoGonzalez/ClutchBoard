"use client"

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import type { RecentTrendLine } from "@/server/valorant/analytics/comparisons"

export function ComparisonLineChart({
  data,
  recentLabel,
  previousLabel,
}: {
  data: RecentTrendLine[]
  recentLabel: string
  previousLabel: string
}) {
  return (
    <div className="h-64 w-full min-w-0">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
          <XAxis dataKey="label" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} width={40} />
          <Tooltip
            contentStyle={{
              background: "rgba(9,9,11,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
            }}
            labelStyle={{ color: "#a1a1aa" }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#d4d4d8" }} iconType="circle" />
          <Line
            type="monotone"
            dataKey="recent"
            name={recentLabel}
            stroke="#34d399"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#34d399" }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="previous"
            name={previousLabel}
            stroke="#71717a"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#71717a" }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
