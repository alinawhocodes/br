import type { TopicSummary } from '../types';

type TopicCardProps = {
  topic: TopicSummary;
  successRate: number | null;
  onOpen: () => void;
};

export const TopicCard = ({ topic, successRate, onOpen }: TopicCardProps) => (
  <article
    className="group cursor-pointer overflow-hidden rounded-[1.75rem] border border-ink-800/10 bg-white shadow-card transition hover:-translate-y-0.5"
    onClick={onOpen}
    onKeyDown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onOpen();
      }
    }}
    role="button"
    tabIndex={0}
  >
    <div className="relative h-40 overflow-hidden">
      <img className="h-full w-full object-cover transition duration-500 group-hover:scale-105" src={topic.imageUrl} alt={topic.name} />
    </div>
    <div className="block w-full px-5 py-5 text-left">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-ink-900">{topic.name}</h2>
          <p className="mt-1 text-sm text-ink-800/70">{topic.taskCount} tasks</p>
        </div>
        <div className="rounded-2xl bg-sand-50 px-3 py-2 text-right">
          <p className="text-sm font-semibold text-forest-700">
            {successRate === null ? 'No data yet' : `${Math.round(successRate * 100)}% success`}
          </p>
        </div>
      </div>
    </div>
  </article>
);
