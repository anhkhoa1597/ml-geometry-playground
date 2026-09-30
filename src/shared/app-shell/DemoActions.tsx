type Preset = {
  label: string;
  apply: () => void;
};

export function ResetControl({ onReset }: { onReset: () => void }) {
  return <button type="button" className="secondary-button" onClick={onReset}>Reset</button>;
}

export function PresetControl({ presets }: { presets: readonly Preset[] }) {
  return (
    <div className="preset-controls" aria-label="Ví dụ có sẵn">
      {presets.map((preset) => (
        <button key={preset.label} type="button" className="secondary-button" onClick={preset.apply}>
          {preset.label}
        </button>
      ))}
    </div>
  );
}
