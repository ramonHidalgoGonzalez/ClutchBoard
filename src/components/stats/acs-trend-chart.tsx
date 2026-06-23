"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export type TrendDatum = {
  label: string
  acs: number
}

export function AcsTrendChart({ data }: { data: TrendDatum[] }) {
  return (
    <div className="h-56 w-full min-w-0">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="acsTrend" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
          <XAxis dataKey="label" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} width={40} />
          <Tooltip
            contentStyle={{
              background: "rgba(9,9,11,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              color: "#fff",
            }}
            labelStyle={{ color: "#a1a1aa" }}
            formatter={(value) => [String(value), "ACS"] as [string, string]}
          />
          <Area
            type="monotone"
            dataKey="acs"
            stroke="#f43f5e"
            strokeWidth={2}
            fill="url(#acsTrend)"
            dot={{ r: 2, fill: "#f43f5e" }}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
