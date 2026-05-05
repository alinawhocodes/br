const COMBINING_MARKS_REGEX = /[\u0300-\u036f]/g;

export const normalizeAnswer = (value: string): string =>
  value.trim().toLocaleLowerCase().normalize('NFD').replace(COMBINING_MARKS_REGEX, '');

export const isAnswerMatch = (input: string, expected: string): boolean =>
  normalizeAnswer(input) === normalizeAnswer(expected);

export const isAnswerMatchAny = (input: string, expectedOptions: string[]): boolean => {
  const normalizedInput = normalizeAnswer(input);
  return expectedOptions.some((option) => normalizeAnswer(option) === normalizedInput);
};
