
const QuizStorage = (function() {
  function key(quizId) {
    return 'quiz_stats_' + quizId;
  }

  function load(quizId) {
    const raw = localStorage.getItem(key(quizId));
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse stats for', quizId, e);
      return {};
    }
  }

  function save(quizId, stats) {
    localStorage.setItem(key(quizId), JSON.stringify(stats));
  }

  function recordResult(quizId, questionKey, correct) {
    const stats = load(quizId);
    if (!stats[questionKey]) {
      stats[questionKey] = { correct: 0, total: 0 };
    }
    stats[questionKey].total += 1;
    if (correct) stats[questionKey].correct += 1;
    save(quizId, stats);
  }

  function reset(quizId) {
    localStorage.removeItem(key(quizId));
  }

  return {
    load,
    save,
    recordResult,
    reset
  };
})();
