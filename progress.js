
const PROGRESS_KEY = 'vocabProgress';

function loadProgress() {
  const raw = localStorage.getItem(PROGRESS_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveProgress(progress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

function recordAnswer(progress, wordId, isCorrect) {
  if (!progress[wordId]) {
    progress[wordId] = { correct: 0, wrong: 0, streak: 0, lastSeen: null };
  }
  const rec = progress[wordId];
  if (isCorrect) {
    rec.correct++;
    rec.streak++;
  } else {
    rec.wrong++;
    rec.streak = 0;
  }
  rec.lastSeen = new Date().toISOString().slice(0,10);
}
