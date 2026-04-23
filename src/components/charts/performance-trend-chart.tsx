"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import type { TrendPoint } from "@/types/domain"

export function PerformanceTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-80 min-w-0 w-full">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="winRate" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#ff4655" stopOpacity={0.75} />
              <stop offset="100%" stopColor="#ff4655" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="acs" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.7} />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="label" stroke="#71717a" />
          <YAxis stroke="#71717a" />
          <Tooltip
            contentStyle={{
              background: "rgba(9, 9, 11, 0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
            }}
          />
          <Area type="monotone" dataKey="winRate" stroke="#ff4655" fill="url(#winRate)" strokeWidth={2} />
          <Area type="monotone" dataKey="avgAcs" stroke="#14b8a6" fill="url(#acs)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
