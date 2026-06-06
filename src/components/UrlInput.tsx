interface UrlInputProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  error: string | null;
}

export default function UrlInput({
  value,
  onChange,
  onSubmit,
  disabled,
  error,
}: UrlInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !disabled && value.trim() !== "") {
      onSubmit();
    }
  };

  const isButtonDisabled = disabled || value.trim() === "";

  return (
    <div>
      <div className="flex gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="YouTube 영상 URL을 붙여넣으세요"
          className={`flex-1 rounded-lg bg-neutral-900 border px-4 py-3 text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none transition-colors ${
            error ? "border-red-400/50" : "border-neutral-700"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        />
        <button
          onClick={onSubmit}
          disabled={isButtonDisabled}
          className={`rounded-lg bg-white text-black font-medium px-5 py-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 ${
            isButtonDisabled
              ? "opacity-30 cursor-not-allowed"
              : "hover:bg-neutral-200"
          }`}
        >
          분석
        </button>
      </div>
      {error && <p className="text-sm text-red-400 mt-1.5">{error}</p>}
    </div>
  );
}
