type SortMode = 'sequential' | 'worst-first';

type SortToggleProps = {
  value: SortMode;
  onChange: (value: SortMode) => void;
};

const options: Array<{ label: string; value: SortMode }> = [
  { label: 'Sequential', value: 'sequential' },
  { label: 'Worst First', value: 'worst-first' },
];

export const SortToggle = ({ value, onChange }: SortToggleProps) => (
  <div className="inline-flex rounded-full border border-ink-800/10 bg-sand-50 p-1">
    {options.map((option) => (
      <button
        key={option.value}
        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
          value === option.value ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-800/70'
        }`}
        onClick={() => onChange(option.value)}
        type="button"
      >
        {option.label}
      </button>
    ))}
  </div>
);
