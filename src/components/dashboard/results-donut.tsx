"use client"

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"

type ResultsDonutProps = {
  wins: number
  losses: number
  draws: number
}

const COLORS = {
  win: "#34d399",
  loss: "#f43f5e",
  draw: "#71717a",
}

export function ResultsDonut({ wins, losses, draws }: ResultsDonutProps) {
  const total = wins + losses + draws
  const data = [
    { key: "win", label: "Victorias", value: wins, color: COLORS.win },
    { key: "loss", label: "Derrotas", value: losses, color: COLORS.loss },
    { key: "draw", label: "Empates", value: draws, color: COLORS.draw },
  ]
  const pct = (value: number) => (total ? Math.round((value / total) * 100) : 0)

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data.filter((d) => d.value > 0)}
              dataKey="value"
              innerRadius={58}
              outerRadius={80}
              paddingAngle={2}
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              {data
                .filter((d) => d.value > 0)
                .map((d) => (
                  <Cell key={d.key} fill={d.color} />
                ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{total}</span>
          <span className="text-xs text-zinc-400">Partidas</span>
        </div>
      </div>

      <ul className="space-y-3 text-sm">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-zinc-300">{d.label}</span>
            <span className="font-semibold text-white">
              {d.value} ({pct(d.value)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
