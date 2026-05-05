import type { Topic, TopicSummary } from '../types';

const topicModules = {
  'topic-introductions-small-talk': () =>
    import('./topic-introductions-small-talk.json').then((module) => module.default as Topic),
  'topic-telling-time': () => import('./topic-telling-time.json').then((module) => module.default as Topic),
} as const;

const topicSummaries: TopicSummary[] = [
  {
    id: 'topic-introductions-small-talk',
    name: 'Introductions and Small Talk',
    imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    taskCount: 10,
    taskIds: [
      'intro-small-talk-01',
      'intro-small-talk-02',
      'intro-small-talk-03',
      'intro-small-talk-04',
      'intro-small-talk-05',
      'intro-small-talk-06',
      'intro-small-talk-07',
      'intro-small-talk-08',
      'intro-small-talk-09',
      'intro-small-talk-10',
    ],
  },
  {
    id: 'topic-telling-time',
    name: 'Telling Time',
    imageUrl: 'https://images.unsplash.com/photo-1501139083538-0139583c060f?auto=format&fit=crop&w=1200&q=80',
    taskCount: 17,
    taskIds: [
      'telling-time-01',
      'telling-time-02',
      'telling-time-03',
      'telling-time-04',
      'telling-time-05',
      'telling-time-06',
      'telling-time-07',
      'telling-time-08',
      'telling-time-09',
      'telling-time-10',
      'telling-time-11',
      'telling-time-12',
      'telling-time-13',
      'telling-time-14',
      'telling-time-15',
      'telling-time-16',
      'telling-time-17',
    ],
  },
];

export const getTopicSummaries = async (): Promise<TopicSummary[]> => topicSummaries;

export const getTopicById = async (topicId: string): Promise<Topic | null> => {
  const loader = topicModules[topicId as keyof typeof topicModules];

  if (!loader) {
    return null;
  }

  return loader();
};
