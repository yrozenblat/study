const PROGRESS_KEY = 'progress';

function loadProgress() {
  const raw = localStorage.getItem(PROGRESS_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveProgress(data) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
}

function recordAnswer(progress, wordId, isCorrect) {
  if (!progress[wordId]) {
    progress[wordId] = { correct: 0, wrong: 0 };
  }
  if (isCorrect) {
    progress[wordId].correct++;
  } else {
    progress[wordId].wrong++;
  }
}

// איפוס מלא של הסטטיסטיקה
function clearProgress() {
  localStorage.removeItem(PROGRESS_KEY);
}
