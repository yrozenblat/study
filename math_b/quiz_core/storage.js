const StudyStorage = (() => {
  const BASE_KEY = 'study_quiz_stats_v1';
  const META_KEY = '__meta';

  function _todayKeyFromTs(ts) {
    try {
      const d = ts ? new Date(ts) : new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    } catch (e) {
      return '';
    }
  }

  function _sanitizeName(raw) {
    if (!raw) return '';
    const s = String(raw).trim();
    const norm = s.normalize ? s.normalize('NFKC') : s;
    const cleaned = norm.replace(/[^\p{L}\p{N}_-]+/gu, '');
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

  function _ensureQuizBucket(all, quizId) {
    const bucket = all[quizId] || {};
    if (!bucket[META_KEY] || typeof bucket[META_KEY] !== 'object') bucket[META_KEY] = { attempts: [] };
    if (!Array.isArray(bucket[META_KEY].attempts)) bucket[META_KEY].attempts = [];
    all[quizId] = bucket;
    return bucket;
  }

  function getQuizStats(quizId) {
    const all = _loadAll();
    return all[quizId] || {};
  }

  function updateQuestion(quizId, questionId, isCorrect) {
    const all = _loadAll();
    const quizStats = _ensureQuizBucket(all, quizId);
    const q = quizStats[questionId] || { correct: 0, total: 0 };
    q.total += 1;
    if (isCorrect) q.correct += 1;
    quizStats[questionId] = q;
    all[quizId] = quizStats;
    _saveAll(all);
  }

  function recordQuizAttempt(quizId, summary) {
    const all = _loadAll();
    const quizStats = _ensureQuizBucket(all, quizId);
    const ts = summary && summary.timestamp ? summary.timestamp : Date.now();
    quizStats[META_KEY].attempts.push({
      timestamp: ts,
      day: _todayKeyFromTs(ts),
      correct: Number((summary && summary.correct) || 0),
      total: Number((summary && summary.total) || 0)
    });
    all[quizId] = quizStats;
    _saveAll(all);
  }

  function getQuizAttemptSummary(quizId) {
    const all = _loadAll();
    const quizStats = all[quizId] || {};
    const attempts = quizStats[META_KEY] && Array.isArray(quizStats[META_KEY].attempts) ? quizStats[META_KEY].attempts : [];
    let totalCorrect = 0;
    let totalQuestions = 0;
    attempts.forEach(a => {
      totalCorrect += Number(a.correct || 0);
      totalQuestions += Number(a.total || 0);
    });
    return {
      attemptsCount: attempts.length,
      totalCorrect,
      totalQuestions,
      averagePct: totalQuestions ? (totalCorrect / totalQuestions) * 100 : null
    };
  }

  function getTodayQuizSummary(quizId) {
    const all = _loadAll();
    const quizStats = all[quizId] || {};
    const attempts = quizStats[META_KEY] && Array.isArray(quizStats[META_KEY].attempts) ? quizStats[META_KEY].attempts : [];
    const today = _todayKeyFromTs(Date.now());
    const todays = attempts.filter(a => a && a.day === today);
    let totalCorrect = 0;
    let totalQuestions = 0;
    todays.forEach(a => {
      totalCorrect += Number(a.correct || 0);
      totalQuestions += Number(a.total || 0);
    });
    return {
      day: today,
      attemptsCount: todays.length,
      totalCorrect,
      totalQuestions,
      averagePct: totalQuestions ? (totalCorrect / totalQuestions) * 100 : null
    };
  }

  function resetQuiz(quizId) {
    const all = _loadAll();
    delete all[quizId];
    _saveAll(all);
  }

  return { getQuizStats, updateQuestion, resetQuiz, recordQuizAttempt, getQuizAttemptSummary, getTodayQuizSummary, sanitizeName: _sanitizeName };
})();

const StudyUI = (() => {
  function getConfiguredPassword() {
    try {
      const cfg = window.STUDY_AUTH_CONFIG || {};
      return String(cfg.password != null ? cfg.password : '3333');
    } catch (e) {
      return '3333';
    }
  }

  function isValidPassword(value) {
    return String(value == null ? '' : value) === getConfiguredPassword();
  }

  function ensureStyles() {
    if (document.getElementById('study-ui-password-style')) return;
    const style = document.createElement('style');
    style.id = 'study-ui-password-style';
    style.textContent = `
      .study-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; z-index:99999; }
      .study-modal { width:min(92vw, 360px); background:#fff; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.2); padding:16px; direction:rtl; font-family:Arial,sans-serif; }
      .study-modal-title { font-weight:700; margin-bottom:10px; }
      .study-modal-input { width:100%; box-sizing:border-box; padding:10px 12px; font-size:16px; border:1px solid #bbb; border-radius:8px; }
      .study-modal-actions { display:flex; gap:8px; justify-content:flex-start; margin-top:12px; }
      .study-modal-actions button { padding:7px 12px; cursor:pointer; }
    `;
    document.head.appendChild(style);
  }

  function promptPassword(message) {
    ensureStyles();
    return new Promise((resolve) => {
      const backdrop = document.createElement('div');
      backdrop.className = 'study-modal-backdrop';
      const modal = document.createElement('div');
      modal.className = 'study-modal';
      modal.innerHTML = `
        <div class="study-modal-title">${String(message || 'הכנס סיסמה:')}</div>
        <input type="password" class="study-modal-input" autocomplete="off" />
        <div class="study-modal-actions">
          <button type="button" data-action="ok">אישור</button>
          <button type="button" data-action="cancel">ביטול</button>
        </div>
      `;
      backdrop.appendChild(modal);
      document.body.appendChild(backdrop);
      const input = modal.querySelector('input');
      let done = false;
      const cleanup = (value) => {
        if (done) return;
        done = true;
        backdrop.remove();
        resolve(value);
      };
      modal.querySelector('[data-action="ok"]').addEventListener('click', () => cleanup(input.value));
      modal.querySelector('[data-action="cancel"]').addEventListener('click', () => cleanup(null));
      backdrop.addEventListener('click', (e) => { if (e.target === backdrop) cleanup(null); });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') cleanup(input.value);
        if (e.key === 'Escape') cleanup(null);
      });
      setTimeout(() => { try { input.focus(); } catch (_) {} }, 0);
    });
  }

  async function protectLinkWithPassword(linkEl, expectedPassword, message) {
    if (!linkEl) return;
    linkEl.addEventListener('click', async (e) => {
      e.preventDefault();
      const pass = await promptPassword(message || 'סיסמה לצפייה בסטטיסטיקה:');
      if (pass === null) return;
      const expected = expectedPassword != null ? String(expectedPassword) : getConfiguredPassword();
      if (String(pass) !== expected) {
        alert('סיסמה שגויה');
        return;
      }
      window.open(linkEl.href, linkEl.target || '_blank');
    });
  }

  return { promptPassword, protectLinkWithPassword, getConfiguredPassword, isValidPassword };
})();
