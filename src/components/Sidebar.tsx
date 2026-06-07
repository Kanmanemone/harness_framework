import type { HistoryEntry } from "@/types";

interface SidebarProps {
  history: HistoryEntry[];
  activeId: string | null;
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  const months = Math.floor(days / 30);
  return `${months}개월 전`;
}

export default function Sidebar({
  history,
  activeId,
  onSelect,
  onDelete,
  onClearAll,
}: SidebarProps) {
  return (
    <aside className="w-64 shrink-0 hidden md:flex md:flex-col bg-neutral-900 border-r border-neutral-800 h-screen sticky top-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-800">
        <h2 className="text-sm font-semibold text-neutral-300">분석 기록</h2>
        {history.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            전체 삭제
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <p className="text-xs text-neutral-600 text-center py-8 px-4">
            아직 분석 기록이 없습니다
          </p>
        ) : (
          <ul className="py-1">
            {history.map((entry) => (
              <li key={entry.id} className="relative group">
                <button
                  onClick={() => onSelect(entry)}
                  className={`w-full text-left px-4 py-3 pr-8 transition-colors ${
                    activeId === entry.id
                      ? "bg-neutral-800 border-l-2 border-blue-500"
                      : "hover:bg-neutral-800/50 border-l-2 border-transparent"
                  }`}
                >
                  <p className="text-sm text-neutral-200 truncate">
                    {entry.title}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {formatRelativeTime(entry.analyzedAt)}
                  </p>
                </button>
                <button
                  aria-label="삭제"
                  onClick={() => onDelete(entry.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-neutral-600 hover:text-neutral-300 transition-opacity p-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
