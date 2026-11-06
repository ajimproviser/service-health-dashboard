// Import only the pieces of ECharts that are used so the bundle stays small.
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { useEffect, useRef } from 'react'
import type { SeriesPoint } from '../types'

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

interface TimeSeriesChartProps {
  points: SeriesPoint[]
  unit: string
  color?: string
}

export function TimeSeriesChart({ points, unit, color = '#2563eb' }: TimeSeriesChartProps) {
  const container = useRef<HTMLDivElement>(null)
  const chart = useRef<echarts.ECharts | null>(null)

  // Create the chart once and keep it sized with its container.
  useEffect(() => {
    if (!container.current) return
    const instance = echarts.init(container.current)
    chart.current = instance
    const observer = new ResizeObserver(() => instance.resize())
    observer.observe(container.current)
    return () => {
      observer.disconnect()
      instance.dispose()
      chart.current = null
    }
  }, [])

  // Update the data whenever the series changes.
  useEffect(() => {
    chart.current?.setOption({
      grid: { left: 48, right: 16, top: 16, bottom: 28 },
      tooltip: { trigger: 'axis', valueFormatter: (value: unknown) => `${String(value)} ${unit}` },
      xAxis: {
        type: 'category',
        data: points.map((point) =>
          new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ),
      },
      yAxis: { type: 'value', axisLabel: { formatter: `{value} ${unit}` } },
      series: [
        {
          type: 'line',
          smooth: true,
          showSymbol: false,
          areaStyle: { opacity: 0.12 },
          lineStyle: { color },
          itemStyle: { color },
          data: points.map((point) => point.value),
        },
      ],
    })
  }, [points, unit, color])

  return <div className="chart" ref={container} role="img" aria-label={`Time series chart in ${unit}`} />
}
