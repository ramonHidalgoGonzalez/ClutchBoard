"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export function AgentWinrateLine({ data }: { data: Array<{ label: string; winRate: number }> }) {
  return (
    <div className="h-40 w-full min-w-0">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -22 }}>
          <defs>
            <linearGradient id="wrEvo" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="label" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} width={40} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            contentStyle={{ background: "rgba(9,9,11,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
            labelStyle={{ color: "#a1a1aa" }}
            formatter={(v) => [`${v}%`, "Winrate"] as [string, string]}
          />
          <Area type="monotone" dataKey="winRate" stroke="#34d399" strokeWidth={2.5} fill="url(#wrEvo)" dot={{ r: 2, fill: "#34d399" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
