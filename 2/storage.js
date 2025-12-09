
const STORAGE_PREFIX = 'progress:';

export function loadProgress(quizId) {
  const raw = localStorage.getItem(STORAGE_PREFIX + quizId);
  return raw ? JSON.parse(raw) : {};
}
export function saveProgress(quizId, data) {
  localStorage.setItem(STORAGE_PREFIX + quizId, JSON.stringify(data));
}
export function recordAnswer(progress, wordId, isCorrect) {
  if (!progress[wordId]) progress[wordId] = { correct: 0, wrong: 0 };
  isCorrect ? progress[wordId].correct++ : progress[wordId].wrong++;
}
export function clearProgress(quizId) {
  localStorage.removeItem(STORAGE_PREFIX + quizId);
}
