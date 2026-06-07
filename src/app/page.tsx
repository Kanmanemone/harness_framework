"use client";

import { useState, useEffect, useRef } from "react";
import type { AppPhase, AnalysisReport, LoadingStep } from "@/types";
import { extractVideoId } from "@/lib/youtube";
import {
  getApiKeys,
  saveApiKeys,
  deleteApiKey,
  isStorageAvailable,
} from "@/lib/storage";
import { mapErrorMessage, isApiKeyError } from "@/lib/constants";
import { fetchComments } from "@/services/youtubeService";
import { analyzeComments } from "@/services/analyzeService";
import ApiKeySettings from "@/components/ApiKeySettings";
import UrlInput from "@/components/UrlInput";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import ReportView from "@/components/ReportView";

const INITIAL_LOADING_STEPS: LoadingStep[] = [
  { label: "댓글을 수집하고 있습니다...", status: "pending" },
  { label: "AI가 댓글을 분석하고 있습니다...", status: "pending" },
  { label: "리포트를 생성하고 있습니다...", status: "pending" },
];

export default function Home() {
  const [phase, setPhase] = useState<AppPhase>("idle");
  const [url, setUrl] = useState("");
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commentsMeta, setCommentsMeta] = useState<{
    analyzed: number;
    total: number;
  } | null>(null);

  const [savedKeys, setSavedKeys] = useState({ youtube: "", gemini: "" });
  const [storageAvail, setStorageAvail] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const keys = getApiKeys();
    setSavedKeys(keys);
    setStorageAvail(isStorageAvailable());
    if (!keys.youtube || !keys.gemini) {
      setSettingsOpen(true);
    }
  }, []);

  const updateStep = (index: number, status: LoadingStep["status"]) => {
    setLoadingSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, status } : s))
    );
  };

  const handleAnalyze = async () => {
    const trimmedUrl = url.trim();

    const videoId = extractVideoId(trimmedUrl);
    if (!videoId) {
      setInlineError(
        "유효한 YouTube URL을 입력해 주세요. (예: https://www.youtube.com/watch?v=...)"
      );
      return;
    }

    const keys = getApiKeys();
    if (!keys.youtube || !keys.gemini) {
      setInlineError("API 키를 먼저 설정해 주세요.");
      setSettingsOpen(true);
      return;
    }

    setPhase("loading");
    const steps = INITIAL_LOADING_STEPS.map((s, i) => ({
      ...s,
      status: (i === 0 ? "active" : "pending") as LoadingStep["status"],
    }));
    setLoadingSteps(steps);
    setReport(null);
    setError(null);
    setInlineError(null);

    try {
      const { comments, totalResults } = await fetchComments(
        videoId,
        keys.youtube
      );

      if (comments.length === 0) {
        setError("이 영상에 댓글이 없습니다.");
        setPhase("error");
        return;
      }

      setCommentsMeta({ analyzed: comments.length, total: totalResults });
      updateStep(0, "done");
      updateStep(1, "active");

      const result = await analyzeComments(comments, keys.gemini);

      // sentiment 정규화
      const sum =
        result.sentiment.positive +
        result.sentiment.neutral +
        result.sentiment.negative;
      if (sum !== 100 && sum > 0) {
        result.sentiment.positive = Math.round(
          (result.sentiment.positive / sum) * 100
        );
        result.sentiment.negative = Math.round(
          (result.sentiment.negative / sum) * 100
        );
        result.sentiment.neutral =
          100 - result.sentiment.positive - result.sentiment.negative;
      }

      setReport(result);
      updateStep(1, "done");
      updateStep(2, "active");

      // brief delay not needed — just mark done
      updateStep(2, "done");
      setPhase("report");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "예기치 않은 오류가 발생했습니다";
      setError(mapErrorMessage(message));
      setPhase("error");

      if (isApiKeyError(message)) {
        setSettingsOpen(true);
      }
    }
  };

  const handleRetry = () => {
    handleAnalyze();
  };

  const handleReset = () => {
    setUrl("");
    setReport(null);
    setError(null);
    setInlineError(null);
    setPhase("idle");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setInlineError(null);
  };

  const handleSaveKeys = (keys: { youtube: string; gemini: string }) => {
    saveApiKeys(keys);
    setSavedKeys(keys);
    setSettingsOpen(false);
  };

  const handleDeleteKey = (type: "youtube" | "gemini") => {
    deleteApiKey(type);
    setSavedKeys((prev) => ({ ...prev, [type]: "" }));
  };

  return (
    <main className="min-h-screen bg-neutral-950">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold text-neutral-100">
            YouTube Comment Analyzer
          </h1>
          <button
            onClick={() => setSettingsOpen((o) => !o)}
            className="text-neutral-500 hover:text-neutral-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
            aria-label="설정"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>

        {/* API Key Settings */}
        <ApiKeySettings
          open={settingsOpen}
          onToggle={() => setSettingsOpen((o) => !o)}
          onSave={handleSaveKeys}
          onDelete={handleDeleteKey}
          savedKeys={savedKeys}
          storageAvailable={storageAvail}
        />

        {/* URL Input */}
        <UrlInput
          value={url}
          onChange={handleUrlChange}
          onSubmit={handleAnalyze}
          disabled={phase === "loading"}
          error={inlineError}
        />

        {/* Content Area */}
        {phase === "idle" && <EmptyState />}
        {phase === "loading" && <LoadingState steps={loadingSteps} />}
        {phase === "error" && error && (
          <ErrorState
            message={error}
            onRetry={handleRetry}
            onReset={handleReset}
          />
        )}
        {phase === "report" && report && commentsMeta && (
          <ReportView
            report={report}
            commentsMeta={commentsMeta}
            onReset={handleReset}
          />
        )}
      </div>
    </main>
  );
}
