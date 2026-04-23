"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

import type { AgentBreakdown } from "@/types/domain"

const COLORS = ["#ff4655", "#0ea5e9", "#14b8a6", "#f59e0b", "#8b5cf6", "#22c55e"]

export function AgentDistributionChart({ data }: { data: AgentBreakdown[] }) {
  return (
    <div className="h-72 min-w-0 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="matches" nameKey="agentName" innerRadius={52} outerRadius={86}>
            {data.map((entry, index) => (
              <Cell key={entry.agentName} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "rgba(9, 9, 11, 0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
