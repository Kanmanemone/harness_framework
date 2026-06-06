interface ReportHeaderProps {
  analyzed: number;
  total: number;
}

export default function ReportHeader({ analyzed, total }: ReportHeaderProps) {
  return (
    <p className="text-sm text-neutral-500">
      {analyzed.toLocaleString()}개 댓글 분석 (전체 {total.toLocaleString()}개 중)
    </p>
  );
}
