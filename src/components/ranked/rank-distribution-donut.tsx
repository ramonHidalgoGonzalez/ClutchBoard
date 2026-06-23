"use client"

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"

import { tierStyle } from "@/lib/valorant-ranks"
import type { RankDistributionItem } from "@/server/valorant/analytics/ranked"

export function RankDistributionDonut({ items }: { items: RankDistributionItem[] }) {
  const total = items.reduce((s, i) => s + i.games, 0)
  return (
    <div className="flex items-center gap-5">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={items} dataKey="games" innerRadius={58} outerRadius={80} paddingAngle={2} stroke="none" startAngle={90} endAngle={-270}>
              {items.map((i) => (
                <Cell key={i.tierId} fill={tierStyle(i.tierId).from} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-white">{total}</span>
          <span className="text-xs text-zinc-400">Partidas</span>
        </div>
      </div>
      <ul className="flex-1 space-y-2 text-sm">
        {items.map((i) => (
          <li key={i.tierId} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: tierStyle(i.tierId).from }} />
            <span className="flex-1 text-zinc-300">{i.tierName}</span>
            <span className="font-semibold text-white">{i.games}</span>
            <span className="w-10 text-right text-zinc-500">{i.percent.toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
