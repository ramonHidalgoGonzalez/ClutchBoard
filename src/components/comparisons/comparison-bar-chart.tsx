"use client"

import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export type BarDatum = { metric: string; a: number; b: number }

export function ComparisonBarChart({
  data,
  aLabel,
  bLabel,
}: {
  data: BarDatum[]
  aLabel: string
  bLabel: string
}) {
  return (
    <div className="h-72 w-full min-w-0">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }} barGap={4}>
          <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
          <XAxis dataKey="metric" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} width={40} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              background: "rgba(9,9,11,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
            }}
            labelStyle={{ color: "#a1a1aa" }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#d4d4d8" }} iconType="circle" />
          <Bar dataKey="a" name={aLabel} radius={[6, 6, 0, 0]}>
            {data.map((d) => (
              <Cell key={`a-${d.metric}`} fill="#f43f5e" />
            ))}
          </Bar>
          <Bar dataKey="b" name={bLabel} radius={[6, 6, 0, 0]}>
            {data.map((d) => (
              <Cell key={`b-${d.metric}`} fill="#22d3ee" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
