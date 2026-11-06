export const TIME_RANGES = [
  { minutes: 5, label: 'Last 5 minutes' },
  { minutes: 15, label: 'Last 15 minutes' },
  { minutes: 30, label: 'Last 30 minutes' },
  { minutes: 60, label: 'Last 1 hour' },
  { minutes: 360, label: 'Last 6 hours' },
  { minutes: 1440, label: 'Last 24 hours' },
] as const

interface TimeRangeSelectorProps {
  value: number
  onChange: (minutes: number) => void
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <label className="range">
      <span className="range__label">Time range</span>
      <select value={value} onChange={(event) => onChange(Number(event.target.value))}>
        {TIME_RANGES.map((range) => (
          <option key={range.minutes} value={range.minutes}>
            {range.label}
          </option>
        ))}
      </select>
    </label>
  )
}
