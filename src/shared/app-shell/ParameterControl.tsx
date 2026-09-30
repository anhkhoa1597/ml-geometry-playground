import { useEffect, useId, useRef, useState } from 'react';

type ParameterControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  sliderStep?: number;
  resetKey?: string | number;
  onChange: (value: number) => void;
};

function parseScalar(draft: string): number | null {
  const trimmed = draft.trim();
  if (trimmed === '' || trimmed === '-' || trimmed === '+') return null;
  if ((trimmed.match(/[.,]/g) ?? []).length > 1) return null;
  if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(trimmed)) return null;
  const parsed = Number(trimmed.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

export function ParameterControl({
  label,
  value,
  min,
  max,
  sliderStep = 0.1,
  resetKey = 0,
  onChange,
}: ParameterControlProps) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  const [showError, setShowError] = useState(false);
  const previousValue = useRef(value);
  const previousResetKey = useRef(resetKey);
  const parsed = parseScalar(draft);
  const isValid = parsed !== null && parsed >= min && parsed <= max;
  const isPending = draft.trim() === '' || draft.trim() === '-' || draft.trim() === '+';

  useEffect(() => {
    if (previousValue.current !== value || previousResetKey.current !== resetKey) {
      previousValue.current = value;
      previousResetKey.current = resetKey;
      setDraft(String(value));
      setShowError(false);
    }
  }, [resetKey, value]);

  function updateDraft(nextDraft: string) {
    setDraft(nextDraft);
    setShowError(false);
    const nextValue = parseScalar(nextDraft);
    if (nextValue !== null && nextValue >= min && nextValue <= max) onChange(nextValue);
  }

  function validateDraft() {
    if (!isValid) setShowError(true);
  }

  function restoreCommitted() {
    setDraft(String(value));
    setShowError(false);
  }

  function updateFromSlider(nextValue: string) {
    const parsedValue = Number(nextValue);
    setDraft(nextValue);
    setShowError(false);
    onChange(parsedValue);
  }

  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div className="parameter-control">
      <div className="parameter-control__heading">
        <label htmlFor={`${id}-number`}>{label}</label>
        <input
          id={`${id}-number`}
          className="parameter-control__number"
          type="text"
          inputMode="decimal"
          value={draft}
          aria-invalid={showError}
          aria-describedby={`${hintId}${showError ? ` ${errorId}` : ''}`}
          onChange={(event) => updateDraft(event.target.value)}
          onBlur={validateDraft}
          onKeyDown={(event) => {
            if (event.key === 'Enter') validateDraft();
            if (event.key === 'Escape') restoreCommitted();
          }}
        />
      </div>
      <input
        className="parameter-control__slider"
        type="range"
        min={min}
        max={max}
        step={sliderStep}
        value={Math.min(max, Math.max(min, value))}
        aria-label={`${label} slider`}
        onChange={(event) => updateFromSlider(event.target.value)}
      />
      <p className="sr-only" id={hintId}>
        Từ {min} đến {max}. Slider bước {sliderStep}; ô số nhận giá trị thập phân khác.
      </p>
      {showError && (
        <p className="parameter-control__error" id={errorId} role="alert">
          {isPending ? 'Hãy nhập một số.' : `Giá trị phải là số hữu hạn từ ${min} đến ${max}.`} Giá trị này chưa được áp dụng.
        </p>
      )}
    </div>
  );
}

export function ParameterHint({ min = -5, max = 5 }: { min?: number; max?: number }) {
  return <p className="parameter-control__hint">Từ {min} đến {max} · slider bước 0.1.<br />Ô số nhận thập phân bất kỳ trong khoảng này.</p>;
}
