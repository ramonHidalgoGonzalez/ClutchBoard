"use client"

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { TrendPoint } from "@/types/domain"

export function DashboardTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-72 w-full min-w-0">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
          <XAxis dataKey="label" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis
            yAxisId="kda"
            stroke="#a855f7"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            domain={[0, "auto"]}
            width={36}
          />
          <YAxis
            yAxisId="wr"
            orientation="right"
            stroke="#34d399"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            width={40}
            tickFormatter={(value: number) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(9,9,11,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
            }}
            labelStyle={{ color: "#a1a1aa" }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ fontSize: 12, color: "#d4d4d8" }}
          />
          <Line
            yAxisId="kda"
            type="monotone"
            dataKey="kda"
            name="KDA"
            stroke="#a855f7"
            strokeWidth={2.5}
            dot={false}
          />
          <Line
            yAxisId="wr"
            type="monotone"
            dataKey="winRate"
            name="Winrate"
            stroke="#34d399"
            strokeWidth={2.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
