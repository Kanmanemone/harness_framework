interface InsightCardProps {
  title: string;
  items: string[];
  variant: "positive" | "negative";
}

export default function InsightCard({ title, items, variant }: InsightCardProps) {
  if (items.length === 0) return null;

  const titleColor = variant === "positive" ? "text-emerald-400" : "text-red-400";

  return (
    <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-6 space-y-3">
      <h3 className={`text-sm font-medium ${titleColor}`}>{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-neutral-600">·</span>
            <span className="text-sm text-neutral-300">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
