interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  onReset: () => void;
}

export default function ErrorState({ message, onRetry, onReset }: ErrorStateProps) {
  return (
    <div className="rounded-lg bg-red-400/5 border border-red-400/20 p-6">
      <div className="flex items-start gap-3">
        <svg
          className="text-red-400 w-5 h-5 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <div className="space-y-3">
          <p className="text-sm text-neutral-300">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onRetry}
              className="rounded-lg bg-white text-black font-medium px-4 py-2.5 hover:bg-neutral-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
            >
              다시 시도
            </button>
            <button
              onClick={onReset}
              className="text-neutral-500 hover:text-neutral-300 transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
            >
              다른 영상 분석하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
