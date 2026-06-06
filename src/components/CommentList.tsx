import type { AnalysisReport } from "@/types";

interface CommentListProps {
  comments: AnalysisReport["representativeComments"];
}

const groups = [
  { key: "positive" as const, label: "긍정", badgeClass: "bg-emerald-400/10 text-emerald-400" },
  { key: "neutral" as const, label: "중립", badgeClass: "bg-neutral-500/10 text-neutral-400" },
  { key: "negative" as const, label: "부정", badgeClass: "bg-red-400/10 text-red-400" },
];

export default function CommentList({ comments }: CommentListProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-base font-medium text-neutral-100">대표 댓글</h3>
      {groups.map((group) => {
        const list = comments[group.key];
        if (list.length === 0) return null;
        return (
          <div key={group.key} className="space-y-4">
            <span className={`text-xs px-2 py-0.5 rounded ${group.badgeClass}`}>
              {group.label}
            </span>
            {list.map((c, i) => (
              <div key={i} className="py-3 border-b border-neutral-800 last:border-0">
                <p className="text-sm text-neutral-300 italic leading-relaxed">{c.text}</p>
                <p className="text-xs text-neutral-600 mt-1">— {c.author}</p>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
