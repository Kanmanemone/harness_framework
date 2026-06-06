"use client";

import { useState } from "react";
import type { ApiKeys } from "@/types";

interface ApiKeySettingsProps {
  open: boolean;
  onToggle: () => void;
  onSave: (keys: ApiKeys) => void;
  onDelete: (type: "youtube" | "anthropic") => void;
  savedKeys: ApiKeys;
  storageAvailable: boolean;
}

function maskKey(key: string): string {
  if (key.length <= 10) return key;
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

export default function ApiKeySettings({
  open,
  onToggle: _onToggle,
  onSave,
  onDelete,
  savedKeys,
  storageAvailable,
}: ApiKeySettingsProps) {
  const [youtubeKey, setYoutubeKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");

  if (!open) return null;

  const handleSave = () => {
    onSave({
      youtube: youtubeKey || savedKeys.youtube,
      anthropic: anthropicKey || savedKeys.anthropic,
    });
    setYoutubeKey("");
    setAnthropicKey("");
  };

  return (
    <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-6 space-y-4">
      {/* YouTube API Key */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm text-neutral-400">YouTube API 키</label>
          {savedKeys.youtube ? (
            <div className="flex items-center gap-2">
              <svg className="text-emerald-400 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs text-neutral-500">{maskKey(savedKeys.youtube)}</span>
            </div>
          ) : (
            <span className="text-xs text-neutral-600">미설정</span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="password"
            value={youtubeKey}
            onChange={(e) => setYoutubeKey(e.target.value)}
            placeholder={savedKeys.youtube ? "새 키로 변경" : "API 키 입력"}
            className="flex-1 rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-3 text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none transition-colors text-sm"
          />
          {savedKeys.youtube && (
            <button
              onClick={() => onDelete("youtube")}
              className="text-neutral-500 hover:text-neutral-300 transition-colors text-sm"
            >
              삭제
            </button>
          )}
        </div>
        <p className="text-xs text-neutral-600">
          <a
            href="https://console.cloud.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-400 underline hover:text-neutral-200"
          >
            Google Cloud Console
          </a>
          에서 YouTube Data API v3를 활성화하고 API 키를 발급받으세요.
        </p>
      </div>

      {/* Anthropic API Key */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm text-neutral-400">Anthropic API 키</label>
          {savedKeys.anthropic ? (
            <div className="flex items-center gap-2">
              <svg className="text-emerald-400 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs text-neutral-500">{maskKey(savedKeys.anthropic)}</span>
            </div>
          ) : (
            <span className="text-xs text-neutral-600">미설정</span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="password"
            value={anthropicKey}
            onChange={(e) => setAnthropicKey(e.target.value)}
            placeholder={savedKeys.anthropic ? "새 키로 변경" : "API 키 입력"}
            className="flex-1 rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-3 text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none transition-colors text-sm"
          />
          {savedKeys.anthropic && (
            <button
              onClick={() => onDelete("anthropic")}
              className="text-neutral-500 hover:text-neutral-300 transition-colors text-sm"
            >
              삭제
            </button>
          )}
        </div>
        <p className="text-xs text-neutral-600">
          <a
            href="https://console.anthropic.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-400 underline hover:text-neutral-200"
          >
            Anthropic Console
          </a>
          에서 API 키를 발급받으세요.
        </p>
      </div>

      {!storageAvailable && (
        <p className="text-xs text-neutral-500">
          시크릿 모드에서는 API 키가 저장되지 않습니다.
        </p>
      )}

      <button
        onClick={handleSave}
        className="rounded-lg bg-white text-black font-medium px-4 py-2.5 hover:bg-neutral-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
      >
        저장
      </button>
    </div>
  );
}
