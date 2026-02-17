/**
 * ElevationChart Component
 *
 * Displays route elevation profile as a simple SVG line chart
 * Shows elevation gain/loss over distance
 */

import { useMemo } from 'react'

interface ElevationChartProps {
  elevationData: number[]
  distanceKm: number
  height?: string
}

export function ElevationChart({
  elevationData,
  distanceKm,
  height = '120px'
}: ElevationChartProps) {
  const chartData = useMemo(() => {
    if (!elevationData || elevationData.length === 0) {
      return null
    }

    const values = elevationData
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1

    // Calculate points for SVG polyline
    const width = 100  // percentage
    const step = width / (values.length - 1)

    const points = values
      .map((val, i) => {
        const x = i * step
        // Invert y (SVG coords) and normalize to 0-100 range
        const y = 100 - ((val - min) / range) * 80 - 10  // 80% height, 10% padding
        return `${x},${y}`
      })
      .join(' ')

    // Calculate gradient line positions
    const mid = (min + max) / 2

    return {
      points,
      min,
      max,
      mid,
      range
    }
  }, [elevationData])

  if (!chartData) {
    return (
      <div
        style={{
          width: '100%',
          height,
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          暂无高程数据
        </span>
      </div>
    )
  }

  const { points, min, max, mid } = chartData

  return (
    <div
      style={{
        width: '100%',
        height,
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        border: '1px solid var(--border-subtle)',
        position: 'relative'
      }}
    >
      {/* Grid lines */}
      <svg
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none'
        }}
        preserveAspectRatio="none"
      >
        {/* Max elevation line */}
        <line
          x1="0"
          y1="10"
          x2="100"
          y2="10"
          stroke="var(--border-subtle)"
          strokeWidth="0.5"
          strokeDasharray="4 4"
        />
        {/* Mid elevation line */}
        <line
          x1="0"
          y1="50"
          x2="100"
          y2="50"
          stroke="var(--border-subtle)"
          strokeWidth="0.5"
          strokeDasharray="4 4"
        />
        {/* Min elevation line */}
        <line
          x1="0"
          y1="90"
          x2="100"
          y2="90"
          stroke="var(--border-subtle)"
          strokeWidth="0.5"
          strokeDasharray="4 4"
        />
      </svg>

      {/* Elevation profile */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--accent-orange)" stopOpacity="0.8" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Fill area under curve */}
        <polygon
          points={`0,100 ${points} 100,100`}
          fill="url(#elevationGradient)"
          fillOpacity="0.2"
        />

        {/* Elevation line */}
        <polyline
          points={points}
          fill="none"
          stroke="url(#elevationGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
        />
      </svg>

      {/* Labels */}
      <div
        style={{
          position: 'absolute',
          left: '8px',
          fontSize: '10px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          pointerEvents: 'none'
        }}
      >
        <div style={{ top: '6px', position: 'absolute' }}>{Math.round(max)}m</div>
        <div style={{ top: '46px', position: 'absolute' }}>{Math.round(mid)}m</div>
        <div style={{ top: '86px', position: 'absolute' }}>{Math.round(min)}m</div>
      </div>

      {/* Distance label */}
      <div
        style={{
          position: 'absolute',
          right: '12px',
          bottom: '8px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)'
        }}
      >
        {distanceKm}km
      </div>
    </div>
  )
}
