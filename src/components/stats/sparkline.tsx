type SparklineProps = {
  values: number[]
  color?: string
  className?: string
  height?: number
  strokeWidth?: number
}

/**
 * Minimal dependency-free sparkline. Server-renderable (no hooks), draws a
 * normalized polyline across a 100x32 viewBox that scales to its container.
 */
export function Sparkline({
  values,
  color = "#f43f5e",
  className,
  height = 32,
  strokeWidth = 2,
}: SparklineProps) {
  const series = values.filter((value) => Number.isFinite(value))
  if (series.length < 2) {
    return <div className={className} style={{ height }} aria-hidden="true" />
  }

  const min = Math.min(...series)
  const max = Math.max(...series)
  const span = max - min || 1
  const stepX = 100 / (series.length - 1)

  const points = series.map((value, index) => {
    const x = index * stepX
    // Leave 4px of vertical padding inside the 32-unit box.
    const y = 28 - ((value - min) / span) * 24 + 2
    return `${x.toFixed(2)},${y.toFixed(2)}`
  })

  return (
    <svg
      className={className}
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      style={{ height, width: "100%" }}
      aria-hidden="true"
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
