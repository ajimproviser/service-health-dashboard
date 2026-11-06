interface StatCardProps {
  title: string
  value: string
  hint: string
}

export function StatCard({ title, value, hint }: StatCardProps) {
  return (
    <article className="card">
      <div className="card__title">{title}</div>
      <div className="card__value">{value}</div>
      <div className="card__hint">{hint}</div>
    </article>
  )
}
