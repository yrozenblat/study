const StudyStorage = (() => {
  const BASE_KEY = 'study_quiz_stats_v1';

  // Allow Unicode letters/numbers + '_' + '-'
  function _sanitizeName(raw) {
    if (!raw) return '';
    const s = String(raw).trim();
    // Normalize for consistent storage (helps with different Unicode forms)
    const norm = s.normalize ? s.normalize('NFKC') : s;

    // Keep letters (any language), numbers, underscore, hyphen
    // Uses Unicode property escapes (supported in modern browsers).
    const cleaned = norm.replace(/[^\p{L}\p{N}_-]+/gu, '');

    // For Latin-only names, lower-case to avoid case-sensitive file naming issues.
    if (/^[A-Za-z0-9_-]+$/.test(cleaned)) return cleaned.toLowerCase();

    return cleaned;
  }

  function _getNamespaceFromUrl() {
    try {
      const params = new URLSearchParams(window.location.search);
      return _sanitizeName(params.get('name'));
    } catch (e) {
      return '';
    }
  }

  function _getKey() {
    const ns = _getNamespaceFromUrl();
    return ns ? `${BASE_KEY}::${ns}` : BASE_KEY;
  }

  function _loadAll() {
    const KEY = _getKey();
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.error('StudyStorage load error', e);
      return {};
    }
  }

  function _saveAll(all) {
    const KEY = _getKey();
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
