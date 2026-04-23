"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import type { TrendPoint } from "@/types/domain"

export function FatigueChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-72 min-w-0 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="label" stroke="#71717a" />
          <YAxis stroke="#71717a" />
          <Tooltip
            contentStyle={{
              background: "rgba(9, 9, 11, 0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
            }}
          />
          <Line type="monotone" dataKey="fatigueScore" stroke="#f59e0b" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
