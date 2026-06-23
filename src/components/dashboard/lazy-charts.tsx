"use client"

import dynamic from "next/dynamic"

import { ChartSkeleton, DonutSkeleton } from "@/components/charts/chart-skeleton"

// Recharts is heavy; keep it out of the dashboard's initial JS and stream it in.
export const LazyTrendChart = dynamic(
  () => import("@/components/dashboard/dashboard-trend-chart").then((m) => m.DashboardTrendChart),
  { ssr: false, loading: () => <ChartSkeleton height={240} /> },
)

export const LazyResultsDonut = dynamic(
  () => import("@/components/dashboard/results-donut").then((m) => m.ResultsDonut),
  { ssr: false, loading: () => <DonutSkeleton size={180} /> },
)
