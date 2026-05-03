type PlaceholderPanelProps = {
  title: string;
  body: string;
};

export const PlaceholderPanel = ({ title, body }: PlaceholderPanelProps) => (
  <div className="rounded-[1.75rem] border border-dashed border-ink-800/20 bg-sand-50 p-6">
    <h2 className="text-xl font-semibold text-ink-900">{title}</h2>
    <p className="mt-2 max-w-2xl text-sm text-ink-800/70">{body}</p>
  </div>
);
