"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import type { MapBreakdown } from "@/types/domain"

export function MapPerformanceChart({ data }: { data: MapBreakdown[] }) {
  return (
    <div className="h-80 min-w-0 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="mapName" stroke="#71717a" />
          <YAxis stroke="#71717a" />
          <Tooltip
            contentStyle={{
              background: "rgba(9, 9, 11, 0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
            }}
          />
          <Bar dataKey="winRate" radius={[12, 12, 0, 0]} fill="#ff4655" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
