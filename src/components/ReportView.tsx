import type { AnalysisReport } from "@/types";
import ReportHeader from "./ReportHeader";
import SentimentChart from "./SentimentChart";
import InsightCard from "./InsightCard";
import CommentList from "./CommentList";

interface ReportViewProps {
  report: AnalysisReport;
  commentsMeta: { analyzed: number; total: number };
  onReset: () => void;
}

export default function ReportView({
  report,
  commentsMeta,
  onReset,
}: ReportViewProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <ReportHeader analyzed={commentsMeta.analyzed} total={commentsMeta.total} />
      <p className="text-base text-neutral-200 leading-relaxed">
        {report.summary}
      </p>
      <SentimentChart sentiment={report.sentiment} />
      <InsightCard
        title="잘하고 있는 점"
        items={report.strengths}
        variant="positive"
      />
      <InsightCard
        title="개선할 점"
        items={report.improvements}
        variant="negative"
      />
      <CommentList comments={report.representativeComments} />
      <div className="text-center pt-4">
        <button
          onClick={onReset}
          className="text-neutral-500 hover:text-neutral-300 transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
        >
          다른 영상 분석하기
        </button>
      </div>
    </div>
  );
}
