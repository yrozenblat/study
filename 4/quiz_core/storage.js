const StudyStorage = (() => {
  const KEY = 'study_quiz_stats_v1';

  function _loadAll() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.error('StudyStorage load error', e);
      return {};
    }
  }

  function _saveAll(all) {
    try {
      localStorage.setItem(KEY, JSON.stringify(all));
    } catch (e) {
      console.error('StudyStorage save error', e);
    }
  }

  function getQuizStats(quizId) {
    const all = _loadAll();
    return all[quizId] || {};
  }

  function updateQuestion(quizId, questionId, isCorrect) {
    const all = _loadAll();
    const quizStats = all[quizId] || {};
    const q = quizStats[questionId] || { correct: 0, total: 0 };
    q.total += 1;
    if (isCorrect) q.correct += 1;
    quizStats[questionId] = q;
    all[quizId] = quizStats;
    _saveAll(all);
  }

  function resetQuiz(quizId) {
    const all = _loadAll();
    delete all[quizId];
    _saveAll(all);
  }

  return { getQuizStats, updateQuestion, resetQuiz };
})();
