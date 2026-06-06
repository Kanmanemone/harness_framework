import type { LoadingStep } from "@/types";

interface LoadingStateProps {
  steps: LoadingStep[];
}

function Spinner() {
  return (
    <svg
      className="animate-spin text-neutral-100 w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function Checkmark() {
  return (
    <svg
      className="text-emerald-400 w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function EmptyCircle() {
  return (
    <svg
      className="text-neutral-700 w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

const textStyles: Record<LoadingStep["status"], string> = {
  active: "text-sm text-neutral-100",
  done: "text-sm text-neutral-500",
  pending: "text-sm text-neutral-700",
};

export default function LoadingState({ steps }: LoadingStateProps) {
  return (
    <div className="space-y-3 py-8">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-3">
          {step.status === "active" && <Spinner />}
          {step.status === "done" && <Checkmark />}
          {step.status === "pending" && <EmptyCircle />}
          <span className={textStyles[step.status]}>{step.label}</span>
        </div>
      ))}
    </div>
  );
}
