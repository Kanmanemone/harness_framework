import type { SentimentRatio } from "@/types";

interface SentimentChartProps {
  sentiment: SentimentRatio;
}

export default function SentimentChart({ sentiment }: SentimentChartProps) {
  const segments = [
    { key: "positive", value: sentiment.positive, color: "bg-emerald-400", labelColor: "text-emerald-400", label: "긍정" },
    { key: "neutral", value: sentiment.neutral, color: "bg-neutral-500", labelColor: "text-neutral-400", label: "중립" },
    { key: "negative", value: sentiment.negative, color: "bg-red-400", labelColor: "text-red-400", label: "부정" },
  ] as const;

  return (
    <div className="space-y-2">
      <div className="flex w-full h-3 rounded-full overflow-hidden">
        {segments.map((seg) =>
          seg.value > 0 ? (
            <div
              key={seg.key}
              className={seg.color}
              style={{ width: `${Math.max(seg.value, 2)}%` }}
              data-testid={`bar-${seg.key}`}
            />
          ) : null
        )}
      </div>
      <div className="flex justify-between text-xs">
        {segments.map((seg) => (
          <span key={seg.key} className={seg.labelColor}>
            {seg.label} {seg.value}%
          </span>
        ))}
      </div>
    </div>
  );
}
