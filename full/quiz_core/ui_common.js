let QuizCore = (() => {
  let currentQuestions = [];
  let currentConfig = null;
  let hasChecked = false;

  function showLoadError(msg) {
    const container = document.getElementById('quiz-container');
    if (container) {
      container.innerHTML = '<div style="padding:12px;border:1px solid #f0c36d;background:#fff8e1;color:#333;">' +
        (msg || 'לא הצלחתי לטעון את השאלות. ודאו שאתם פותחים דרך שרת (ולא file://).') +
        '<br><br><div style="direction:ltr;unicode-bidi:isolate;font-family:monospace;">' +
        'Windows: py -m http.server 8000<br>Mac/Linux: python3 -m http.server 8000' +
        '</div><br>ואז גלשו ל: <span style="direction:ltr;unicode-bidi:isolate;">http://localhost:8000</span>' +
        '</div>';
    }
  }

  // Browser Text-to-Speech for English words/phrases.
  // Requires a user gesture (we call it on click), so it won't auto-play.
  function speakEnglish(text) {
    try {
      if (!('speechSynthesis' in window)) return;
      const t = String(text ?? '').trim();
      if (!t) return;

      // Stop any ongoing speech to avoid overlap.
      window.speechSynthesis.cancel();

      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'en-US';
      u.rate = 0.9;  // slightly slower for learners
      u.pitch = 1.0;
      window.speechSynthesis.speak(u);
    } catch (_) {
      // No-op: TTS is best-effort.
    }
  }

  
  function renderMathIfNeeded(rootEl) {
    try {
      if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
        const target = rootEl || document;
        window.MathJax.typesetPromise([target]);
      } else if (window.MathJax && typeof window.MathJax.typeset === 'function') {
        window.MathJax.typeset();
      }
    } catch (_) {
      // No-op
    }
  }

  
  function ensureMathStyles() {
    try {
      if (document.getElementById('math-unit-style')) return;
      const style = document.createElement('style');
      style.id = 'math-unit-style';
      style.textContent = `
        .question-row, .unit-header-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .math, .he-text {
          unicode-bidi: isolate;
        }
        .math { direction: ltr; }
        .he-text { direction: rtl; }

        .math mjx-container { font-size: 135%; }

        .unit-block {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 12px;
          margin: 0 0 14px;
          background: #fff;
        }
        .unit-title {
          font-weight: 700;
          margin-bottom: 8px;
        }
        .unit-data {
          margin-bottom: 10px;
        }
        .part-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          border-top: 1px dashed #eee;
        }
        .part-row:first-of-type { border-top: none; }
        .part-prompt {
          flex: 1 1 auto;
          min-width: 260px;
        }
        .part-input {
          width: 180px;
          max-width: 50vw;
        }
        .part-feedback {
          min-width: 180px;
        }
      `;
      document.head.appendChild(style);
    } catch (_) {
      // no-op
    }
  }

function buildQuestionHTML(idx, q) {
    const n = (idx + 1) + '. ';
    const hasTex = q && typeof q.tex === 'string' && q.tex.trim();
    const heText = (q && typeof q.heText === 'string') ? q.heText.trim() : '';
    if (hasTex) {
      // Force LTR for math to avoid RTL reordering in Hebrew UI.
      const tex = q.tex.trim();
      // Use \displaystyle so fractions and exponents are rendered in a more "book-like" way.
      const mathSpan = '<span class="math" dir="ltr" style="direction:ltr;unicode-bidi:isolate;">\\(\\displaystyle ' + tex + '\\)</span>';
      const heSpan = heText ? (' <span class="he-text" dir="rtl" style="direction:rtl;unicode-bidi:isolate;">' + heText + '</span>') : '';
      return n + mathSpan + heSpan;
    }
    const plain = (q?.text ?? q?.question ?? '');
    return n + String(plain);
  }

function setCheckButtonEnabled(enabled) {
    // Prefer an explicit ID if present, fallback to the inline-onclick button.
    const btn = document.getElementById('btn-check') || document.querySelector('button[onclick="checkQuiz()"]');
    if (btn) btn.disabled = !enabled;
  }

  function ensureQuizStyles() {
    if (document.getElementById('quiz-global-style')) return;
    const style = document.createElement('style');
    style.id = 'quiz-global-style';
    style.textContent = `
      :root {
        --q-accent: #4f7cff;
        --q-accent-dark: #3563e9;
        --q-success: #16a34a;
        --q-error: #dc2626;
        --q-bg: #f0f4f8;
        --q-card: #ffffff;
        --q-border: #dde3ed;
        --q-text: #1e293b;
        --q-muted: #64748b;
        --q-radius: 12px;
      }
      body {
        font-family: 'Segoe UI', Arial, sans-serif !important;
        background: var(--q-bg) !important;
        margin: 0 !important;
        padding: 20px 24px !important;
        color: var(--q-text);
        min-height: 100vh;
      }
      h2 {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--q-text);
        margin: 0 0 14px;
      }
      button {
        padding: 8px 18px;
        border-radius: 8px;
        border: none;
        font-size: 0.9rem;
        font-family: inherit;
        font-weight: 600;
        cursor: pointer;
        transition: filter 0.15s, transform 0.1s;
        margin-left: 6px;
      }
      button:hover:not(:disabled) { filter: brightness(1.08); }
      button:active:not(:disabled) { transform: scale(0.97); }
      button:disabled { opacity: 0.4; cursor: not-allowed; }
      button[onclick*="startQuiz"] { background: var(--q-accent); color: #fff; }
      #btn-check { background: #22c55e; color: #fff; }
      a[href="stats.html"] {
        display: inline-block;
        color: var(--q-muted);
        font-size: 0.85rem;
        text-decoration: none;
        padding: 7px 13px;
        border-radius: 8px;
        border: 1px solid var(--q-border);
        vertical-align: middle;
        transition: background 0.15s;
      }
      a[href="stats.html"]:hover { background: var(--q-border); }
      #quiz-container { margin-top: 14px; }
      .question {
        background: var(--q-card);
        border: 1px solid var(--q-border);
        border-radius: var(--q-radius);
        padding: 12px 16px;
        margin-bottom: 8px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .question-text {
        font-size: 1.05rem;
        font-weight: 500;
        flex: 1;
        min-width: 180px;
      }
      input.open-choice {
        height: 36px !important;
        min-width: 72px;
        border: 2px solid var(--q-border) !important;
        border-radius: 8px !important;
        font-size: 1rem !important;
        padding: 0 10px !important;
        background: #f8fafc;
        color: var(--q-text);
        transition: border-color 0.15s, background 0.15s;
        box-sizing: border-box;
      }
      input.open-choice:focus {
        outline: none !important;
        border-color: var(--q-accent) !important;
        background: #fff;
      }
      input.open-choice:disabled { background: #f1f5f9; color: #475569; }
      .feedback {
        font-size: 0.85rem;
        font-weight: 600;
        padding: 4px 12px;
        border-radius: 20px;
        white-space: nowrap;
      }
      .feedback.correct { background: #dcfce7 !important; color: var(--q-success) !important; }
      .feedback.wrong   { background: #fee2e2 !important; color: var(--q-error)   !important; }
      #result {
        margin-top: 18px;
        padding: 14px 22px;
        background: var(--q-card);
        border: 1px solid var(--q-border);
        border-radius: var(--q-radius);
        font-size: 1.15rem;
        font-weight: 700;
        text-align: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.07);
      }
      #daily-quiz-summary {
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        border-radius: 8px;
        padding: 8px 14px;
        font-size: 0.85rem;
        color: #1d4ed8;
        margin-bottom: 10px;
      }
    `;
    document.head.appendChild(style);
  }

  async function init(options) {
    ensureQuizStyles();
    const { configUrl, questionsUrl } = options;
    let config, questions;
    try {
      [config, questions] = await Promise.all([
        fetch(configUrl).then(r => {
          if (!r.ok) throw new Error('config fetch failed: ' + r.status);
          return r.json();
        }),
        fetch(questionsUrl).then(r => {
          if (!r.ok) throw new Error('questions fetch failed: ' + r.status);
          return r.json();
        })
      ]);
    } catch (e) {
      console.error(e);
      showLoadError('לא הצלחתי לטעון את קבצי ה־JSON של המבחן. זה קורה בדרך כלל כשפותחים את הקבצים ישירות (file://).');
      return;
    }
    currentConfig = config;
    const stats = StudyStorage.getQuizStats(config.quizId);
    if (config.renderer === 'unitParts') {
      currentQuestions = selectUnitParts(questions, stats, config);
    } else {
      currentQuestions = QuestionSelector.select(questions, stats, config);
    }

    if (config.renderer === 'drag') {
      renderVocabDrag(currentQuestions);
    } else if (config.renderer === 'text') {
      renderVocabText(currentQuestions, config);
    } else if (config.renderer === 'open') {
      renderOpenChoice(currentQuestions);
    } else if (config.renderer === 'unitParts') {
      renderUnitParts(currentQuestions, config);
    } else {
      renderMcq(currentQuestions);
    }

    const result = document.getElementById('result');
    if (result) result.textContent = '';

    // Allow checking again only after starting a new quiz.
    hasChecked = false;
    setCheckButtonEnabled(true);
    updateDailyQuizSummary();
  }

  function renderMcq(questions) {
    const container = document.getElementById('quiz-container');
    if (!container) return;
    container.innerHTML = '';

    // Some grammar quizzes prefer an inline dropdown inserted into the blank (_____) instead
    // of separate radio options below. Enabled via config.mcqInline.
    const useInlineDropdown = !!(currentConfig && currentConfig.mcqInline);

    questions.forEach((q, idx) => {
      const wrap = document.createElement('div');
      wrap.className = 'question';

      // Inline dropdown in the blank (e.g., "I _____ ten years old.")
      if (useInlineDropdown && typeof q.text === 'string' && q.text.includes('_____') && Array.isArray(q.options)) {
        const line = document.createElement('div');
        line.className = 'question-text';
        line.style.direction = 'ltr';

        const parts = q.text.split('_____');
        // Prefix with number
        const num = document.createElement('span');
        num.textContent = (idx + 1) + '. ';
        line.appendChild(num);
        line.appendChild(document.createTextNode(parts[0] || ''));

        const sel = document.createElement('select');
        sel.className = 'mcq-inline-select';
        sel.dataset.qid = q.id;
        sel.style.margin = '0 6px';
        sel.style.padding = '2px 6px';

        const ph = document.createElement('option');
        ph.value = '';
        ph.textContent = '—';
        sel.appendChild(ph);

        q.options.forEach(opt => {
          const o = document.createElement('option');
          o.value = opt;
          o.textContent = opt;
          sel.appendChild(o);
        });

        line.appendChild(sel);
        line.appendChild(document.createTextNode(parts.slice(1).join('_____') || ''));
        wrap.appendChild(line);
      } else {
        const textDiv = document.createElement('div');
        textDiv.className = 'question-text';
        textDiv.innerHTML = buildQuestionHTML(idx, q);
        renderMathIfNeeded(textDiv);
        wrap.appendChild(textDiv);

        const optsDiv = document.createElement('div');
        optsDiv.className = 'options';

        q.options.forEach(opt => {
          const label = document.createElement('label');
          label.className = 'option-label';

          const radio = document.createElement('input');
          radio.type = 'radio';
          radio.name = q.id;
          radio.value = opt;

          label.appendChild(radio);
          label.appendChild(document.createTextNode(' ' + opt));
          optsDiv.appendChild(label);
        });

        wrap.appendChild(optsDiv);
      }

      const fb = document.createElement('div');
      fb.className = 'feedback';
      fb.id = 'fb-' + q.id;
      wrap.appendChild(fb);
      container.appendChild(wrap);
    });
  }

  // Open (free text) answer for simple short choices (e.g. am/is/are).
  // Expects each question to have: { id, text, correct, rule? }
  function renderOpenChoice(questions) {
    const container = document.getElementById('quiz-container');
    if (!container) return;
    container.innerHTML = '';

    questions.forEach((q, idx) => {
      const wrap = document.createElement('div');
      wrap.className = 'question';

      // Prefer placing the input inside the sentence blank if the question uses "_____".
      if (typeof q.text === 'string' && q.text.includes('_____')) {
        const line = document.createElement('div');
        line.className = 'question-text';
        line.style.direction = 'ltr';

        const parts = q.text.split('_____');
        const num = document.createElement('span');
        num.textContent = (idx + 1) + '. ';
        line.appendChild(num);
        line.appendChild(document.createTextNode(parts[0] || ''));

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'open-choice';
        input.dataset.qid = q.quotient !== undefined ? q.id + '__q' : q.id;
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.placeholder = '';
        input.style.direction = 'ltr';
        input.style.textAlign = 'center';
        input.style.margin = '0 6px';
        input.style.padding = '2px 6px';
        input.style.width = '70px';
        line.appendChild(input);

        if (parts.length >= 3 && q.quotient !== undefined) {
          line.appendChild(document.createTextNode(parts[1] || ''));
          const input2 = document.createElement('input');
          input2.type = 'text';
          input2.className = 'open-choice';
          input2.dataset.qid = q.id + '__r';
          input2.autocomplete = 'off';
          input2.spellcheck = false;
          input2.style.direction = 'ltr';
          input2.style.textAlign = 'center';
          input2.style.margin = '0 6px';
          input2.style.padding = '2px 6px';
          input2.style.width = '50px';
          line.appendChild(input2);
          if (parts[2]) line.appendChild(document.createTextNode(parts[2]));
        } else {
          line.appendChild(document.createTextNode(parts.slice(1).join('_____') || ''));
        }
        wrap.appendChild(line);
      } else {
        const textDiv = document.createElement('div');
        textDiv.className = 'question-text';
        textDiv.innerHTML = buildQuestionHTML(idx, q);
        renderMathIfNeeded(textDiv);
        wrap.appendChild(textDiv);

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'open-choice';
        input.dataset.qid = q.id;
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.placeholder = 'הקלד/י תשובה (למשל: am)';
        input.style.direction = 'ltr';
        input.style.marginTop = '6px';
        input.style.padding = '6px 8px';
        input.style.minWidth = '120px';
        wrap.appendChild(input);
      }

      const fb = document.createElement('div');
      fb.className = 'feedback';
      fb.id = 'fb-' + q.id;
      wrap.appendChild(fb);

      container.appendChild(wrap);
    });
  }

  function shuffle(array) {
  const a = array.slice(); // לא הורס את המקור
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function renderVocabDrag(questions) {
  const container = document.getElementById('quiz-container');
  if (!container) return;
  container.innerHTML = '';

  const bank = document.createElement('div');
  bank.id = 'word-bank';

  const title = document.createElement('div');
  title.textContent = 'מחסן מילים – גרור למקום הנכון:';
  bank.appendChild(title);

  const bankInner = document.createElement('div');
  bankInner.className = 'bank-inner';

  // Allow dragging words back to the bank (return).
  bankInner.addEventListener('dragover', (e) => e.preventDefault());
  bankInner.addEventListener('drop', (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const wordEl = container.querySelector('.draggable-word[data-id="' + id + '"]');
    if (wordEl) {
      bankInner.appendChild(wordEl);
    }
  });

  // ⬅️ נקודת השינוי: משתמשים ברשימה מעורבבת למחסן
  const shuffledForBank = shuffle(questions);

  shuffledForBank.forEach(q => {
    const span = document.createElement('span');
    span.className = 'draggable-word';
    span.textContent = q.english;
    span.draggable = true;
    span.dataset.id = q.id;
    span.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', q.id);
    });
    bankInner.appendChild(span);
  });

  bank.appendChild(bankInner);
  container.appendChild(bank);

  // ⬅️ החלק הזה נשאר בדיוק לפי questions המקורי – סדר השאלות בעברית
  questions.forEach((q, idx) => {
    const row = document.createElement('div');
    row.className = 'vocab-row';

    const label = document.createElement('span');
    label.className = 'hebrew-label';
    label.textContent = (idx + 1) + '. ' + q.hebrew;
    row.appendChild(label);

    const drop = document.createElement('div');
    drop.className = 'dropzone';
    drop.dataset.qid = q.id;
    drop.addEventListener('dragover', (e) => e.preventDefault());
    drop.addEventListener('drop', (e) => {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain');
      const wordEl = container.querySelector('.draggable-word[data-id="' + id + '"]');
      if (wordEl) {
        // If the dropzone already contains a word, move it back to the bank (swap behavior).
        const existing = drop.querySelector('.draggable-word');
        if (existing && existing !== wordEl) {
          bankInner.appendChild(existing);
        }
        drop.innerHTML = '';
        drop.appendChild(wordEl);
      }
    });
    row.appendChild(drop);

    const fb = document.createElement('span');
    fb.className = 'feedback';
    fb.id = 'fb-' + q.id;
    row.appendChild(fb);

    container.appendChild(row);
  });
}

  function normalizeHebrewAnswer(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .trim()
      .replace(/[\u0591-\u05C7]/g, '') // Hebrew niqqud/cantillation
      .replace(/["'`”“]/g, '')
      .replace(/\s+/g, ' ');
  }

  function getExpectedAnswers(q) {
    // Support multiple quiz formats:
    // - single correct answer: q.correct / q.answer
    // - multiple valid answers: q.correct = [..] or q.answers = [..]
    if (!q) return [];

    if (Array.isArray(q.correct)) {
      return q.correct.map(a => String(a));
    }

    if (q.correct !== undefined && q.correct !== null && String(q.correct).length) {
      return [String(q.correct)];
    }

    if (Array.isArray(q.answers) && q.answers.length) {
      return q.answers.map(a => String(a));
    }

    if (q.answer !== undefined && q.answer !== null && String(q.answer).length) {
      return [String(q.answer)];
    }

    return [];
  }

  function getExpectedAnswer(q) {
    const answers = getExpectedAnswers(q);
    return answers.length ? answers[0] : '';
  }


  function renderVocabText(questions, config) {
    const container = document.getElementById('quiz-container');
    if (!container) return;
    container.innerHTML = '';

    const intro = document.createElement('div');
    intro.style.marginBottom = '10px';
    intro.textContent = 'כתוב/כתבי את התרגום בעברית בשדה החופשי:';
    container.appendChild(intro);

    questions.forEach((q, idx) => {
      const row = document.createElement('div');
      row.className = 'vocab-row';

      const label = document.createElement('span');
      label.className = 'arabic-label';
      label.textContent = (idx + 1) + '. ' + q.english;

      // Click-to-speak for English in VOCAB open/text mode.
      // We keep it lightweight: if the browser supports TTS, a click will speak.
      label.style.cursor = 'pointer';
      label.title = 'לחץ/י להשמעה';
      label.addEventListener('click', () => speakEnglish(q.english));

      row.appendChild(label);

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'text-answer';
      input.dataset.qid = q.id;
      input.placeholder = (currentConfig && currentConfig.answerPlaceholder) ? currentConfig.answerPlaceholder : 'תרגום בעברית';
      input.autocomplete = 'off';
      input.spellcheck = false;
      row.appendChild(input);

      const fb = document.createElement('span');
      fb.className = 'feedback';
      fb.id = 'fb-' + q.id;
      row.appendChild(fb);

      container.appendChild(row);
    });
  }


  function updateDailyQuizSummary() {
    if (!currentConfig || !currentConfig.quizId || typeof StudyStorage === 'undefined') return;
    let el = document.getElementById('daily-quiz-summary');
    if (!el) {
      el = document.createElement('div');
      el.id = 'daily-quiz-summary';
      el.style.margin = '8px 0 12px';
      el.style.color = '#444';
      const resultEl = document.getElementById('result');
      if (resultEl && resultEl.parentNode) resultEl.parentNode.insertBefore(el, resultEl);
      else document.body.appendChild(el);
    }
    const summary = StudyStorage.getTodayQuizSummary(currentConfig.quizId);
    const avg = (summary.averagePct === null || summary.averagePct === undefined) ? '—' : (Math.round(summary.averagePct) + '%');
    el.textContent = `היום בוצעו ${summary.attemptsCount} מבחנים. ממוצע הצלחה היום: ${avg}`;
  }

  function finalizeQuizResult(correctCount, total, prefix) {
    if (currentConfig && currentConfig.quizId && typeof StudyStorage !== 'undefined') {
      StudyStorage.recordQuizAttempt(currentConfig.quizId, { correct: correctCount, total: total });
    }
    const result = document.getElementById('result');
    if (result) result.textContent = `${prefix || 'ציון'}: ${correctCount} מתוך ${total}`;
    updateDailyQuizSummary();
  }

  function checkQuiz() {
    if (!currentQuestions.length || !currentConfig) return;

    // Prevent multiple submissions. After checking once, user must start a new quiz.
    if (hasChecked) return;
    hasChecked = true;
    setCheckButtonEnabled(false);

    if (currentConfig.renderer === 'drag') {
      return checkDrag();
    } else if (currentConfig.renderer === 'text') {
      return checkText();
    } else if (currentConfig.renderer === 'open') {
      return checkOpenChoice();
    } else if (currentConfig.renderer === 'unitParts') {
      return checkUnitPartsAll();
    } else {
      return checkMcq();
    }
  }

  function checkOpenChoice() {
    let correctCount = 0;
    let total = currentQuestions.length;

    const norm = (s) =>
      String(s ?? '')
        .trim()
        .toLowerCase()
        .replace(/[’]/g, "'")
        .replace(/\s+/g, ' ');

    currentQuestions.forEach(q => {
      const fb = document.getElementById('fb-' + q.id);

      const inputQ = document.querySelector('.open-choice[data-qid="' + q.id + '__q"]');
      const inputR = document.querySelector('.open-choice[data-qid="' + q.id + '__r"]');
      if (inputQ && inputR) {
        inputQ.disabled = true;
        inputR.disabled = true;
        const userQ = norm(inputQ.value);
        const userR = inputR.value.trim() === '' ? '0' : norm(inputR.value);
        const expQ = norm(String(q.quotient));
        const expR = norm(String(q.remainder));
        const isCorrect = userQ === expQ && userR === expR;
        if (isCorrect) correctCount++;
        StudyStorage.updateQuestion(currentConfig.quizId, Strength.baseId(q.id), isCorrect);
        if (fb) {
          fb.classList.remove('correct', 'wrong');
          if (!userQ && !userR) {
            fb.classList.add('wrong');
            fb.textContent = '✗ לא נכתבה תשובה. תשובה נכונה: ' + q.quotient + ' שארית ' + q.remainder;
          } else if (isCorrect) {
            fb.classList.add('correct');
            fb.textContent = '✓ נכון';
          } else {
            fb.classList.add('wrong');
            fb.textContent = '✗ שגוי. תשובה נכונה: ' + q.quotient + ' שארית ' + q.remainder;
          }
        }
        return;
      }

      const input = document.querySelector('.open-choice[data-qid="' + q.id + '"]');
      const raw = input ? input.value : '';
      if (input) input.disabled = true;

      const userAns = norm(raw);
      const expectedList = getExpectedAnswers(q).map(norm);
      const isCorrect = userAns.length > 0 && expectedList.includes(userAns);
      if (isCorrect) correctCount++;

      StudyStorage.updateQuestion(currentConfig.quizId, Strength.baseId(q.id), isCorrect);

      if (!fb) return;
      fb.classList.remove('correct', 'wrong');

      if (!userAns) {
        fb.classList.add('wrong');
        fb.textContent = '✗ לא נכתבה תשובה. תשובה נכונה: ' + getExpectedAnswer(q) + (q.rule ? ' – ' + q.rule : '');
      } else if (isCorrect) {
        fb.classList.add('correct');
        fb.textContent = '✓ נכון';
      } else {
        fb.classList.add('wrong');
        fb.textContent = '✗ שגוי. תשובה נכונה: ' + getExpectedAnswer(q) + (q.rule ? ' – ' + q.rule : '');
      }
    });

    finalizeQuizResult(correctCount, total, 'ציון');
  }

  function checkMcq() {
    let correctCount = 0;
    let total = currentQuestions.length;

    currentQuestions.forEach(q => {
      let chosen = null;

      // Inline dropdown variant
      const sel = document.querySelector(`select.mcq-inline-select[data-qid="${q.id}"]`);
      if (sel) {
        chosen = sel.value || null;
        sel.disabled = true;
      } else {
        const radios = document.querySelectorAll(`input[name="${q.id}"]`);
        radios.forEach(r => {
          if (r.checked) chosen = r.value;
          r.disabled = true;
        });
      }

      const isCorrect = (chosen === getExpectedAnswer(q));
      if (isCorrect) correctCount++;

      StudyStorage.updateQuestion(currentConfig.quizId, Strength.baseId(q.id), isCorrect);

      const fb = document.getElementById('fb-' + q.id);
      if (!fb) return;
      fb.classList.remove('correct', 'wrong');

      if (!chosen) {
        fb.classList.add('wrong');
        fb.textContent = '✗ לא נבחרה תשובה. תשובה נכונה: ' + getExpectedAnswer(q) + (q.rule ? ' – ' + q.rule : '');
      } else if (isCorrect) {
        fb.classList.add('correct');
        fb.textContent = '✓ נכון';
      } else {
        fb.classList.add('wrong');
        fb.textContent = '✗ שגוי. תשובה נכונה: ' + getExpectedAnswer(q) + (q.rule ? ' – ' + q.rule : '');
      }
    });

    finalizeQuizResult(correctCount, total, 'ציון');
  }

  function checkDrag() {
    let correctCount = 0;
    let total = currentQuestions.length;

    currentQuestions.forEach(q => {
      const drop = document.querySelector('.dropzone[data-qid="' + q.id + '"]');
      let chosenId = null;
      if (drop && drop.firstElementChild && drop.firstElementChild.classList.contains('draggable-word')) {
        chosenId = drop.firstElementChild.dataset.id;
      }

      const isCorrect = (Strength.baseId(chosenId) === Strength.baseId(q.id));
      if (isCorrect) correctCount++;

      StudyStorage.updateQuestion(currentConfig.quizId, Strength.baseId(q.id), isCorrect);

      const fb = document.getElementById('fb-' + q.id);
      if (!fb) return;
      fb.classList.remove('correct', 'wrong');

      if (!chosenId) {
        fb.classList.add('wrong');
        fb.textContent = '✗ לא נגררה מילה. המילה הנכונה: ' + q.english;
      } else if (isCorrect) {
        fb.classList.add('correct');
        fb.textContent = '✓ נכון';
      } else {
        fb.classList.add('wrong');
        fb.textContent = '✗ שגוי. המילה הנכונה: ' + q.english;
      }
    });

    const allWords = document.querySelectorAll('.draggable-word');
    allWords.forEach(w => {
      w.draggable = false;
      w.style.opacity = '0.7';
    });

    finalizeQuizResult(correctCount, total, 'ציון');
  }

  function checkText() {
    let correctCount = 0;
    let total = currentQuestions.length;

    currentQuestions.forEach(q => {
      const input = document.querySelector('.text-answer[data-qid="' + q.id + '"]');
      const raw = input ? input.value : '';
      if (input) input.disabled = true;

      const userAns = normalizeHebrewAnswer(raw);
      const answers = [];
      if (Array.isArray(q.answers)) {
        q.answers.forEach(a => answers.push(normalizeHebrewAnswer(a)));
      }
      answers.push(normalizeHebrewAnswer(q.hebrew));
      const isCorrect = userAns.length > 0 && answers.includes(userAns);

      if (isCorrect) correctCount++;
      StudyStorage.updateQuestion(currentConfig.quizId, Strength.baseId(q.id), isCorrect);

      const fb = document.getElementById('fb-' + q.id);
      if (!fb) return;
      fb.classList.remove('correct', 'wrong');

      if (!userAns) {
        fb.classList.add('wrong');
        fb.textContent = '✗ לא הוזנה תשובה. תשובה נכונה: ' + q.hebrew;
      } else if (isCorrect) {
        fb.classList.add('correct');
        fb.textContent = '✓ נכון';
      } else {
        fb.classList.add('wrong');
        fb.textContent = '✗ שגוי. תשובה נכונה: ' + q.hebrew;
      }
    });

    finalizeQuizResult(correctCount, total, 'ציון');
  }


  // ===== Unit + Parts renderer (for "multi-subquestions" units) =====

  function partKey(unitId, partId) {
    return String(unitId) + '::' + String(partId);
  }

  function weaknessScore(stat) {
    const total = stat ? (stat.total || 0) : 0;
    const correct = stat ? (stat.correct || 0) : 0;
    const wrong = Math.max(0, total - correct);
    // Smoothing: if unseen -> 1.0 weakness (highest priority)
    return (wrong + 1) / (total + 2);
  }

  function selectUnitParts(units, stats, config) {
    const unitsPerQuiz = Number(config.unitsPerQuiz || 3);

    const ranked = (units || []).map(u => {
      const unitId = u.unitId || u.id || '';
      const parts = Array.isArray(u.parts) ? u.parts : [];
      let maxW = -1;
      for (const p of parts) {
        const key = partKey(unitId, p.partId || p.id || '');
        const w = weaknessScore(stats[key]);
        if (w > maxW) maxW = w;
      }
      if (maxW < 0) maxW = 1.0;
      return { u, maxW };
    });

    // Sort by weakness, but DO NOT make it fully deterministic – we want variety.
    ranked.sort((a, b) => b.maxW - a.maxW);

    // Take a pool of top candidates, then sample without replacement weighted by weakness.
    const topM = Math.min(ranked.length, Math.max(unitsPerQuiz * 4, 8));
    const pool = ranked.slice(0, topM);

    function pickOne(list) {
      // weight = (maxW)^2 with small jitter so ties don't repeat forever
      const weights = list.map(x => Math.max(0.0001, (x.maxW * x.maxW) + (Math.random() * 0.0005)));
      const sum = weights.reduce((a, b) => a + b, 0);
      let r = Math.random() * sum;
      for (let i = 0; i < list.length; i++) {
        r -= weights[i];
        if (r <= 0) return i;
      }
      return list.length - 1;
    }

    const chosen = [];
    const tmp = pool.slice();
    while (chosen.length < unitsPerQuiz && tmp.length) {
      const idx = pickOne(tmp);
      chosen.push(tmp[idx].u);
      tmp.splice(idx, 1);
    }

    // Fallback: if not enough, fill deterministically from remaining
    if (chosen.length < unitsPerQuiz) {
      const remaining = ranked.map(x => x.u).filter(u => !chosen.includes(u));
      chosen.push(...remaining.slice(0, unitsPerQuiz - chosen.length));
    }

    return chosen;
  }

  function renderUnitParts(units, config) {
    ensureMathStyles();

    const container = document.getElementById('quiz-container');
    if (!container) return;
    container.innerHTML = '';

    const partsPerUnit = Number(config.partsPerUnit || 3);
    const stats = StudyStorage.getQuizStats(config.quizId);

    units.forEach((unit, uidx) => {
      const unitId = unit.unitId || unit.id || ('unit_' + (uidx + 1));
      const a1 = unit?.data?.a1;
      const d = unit?.data?.d;

      const card = document.createElement('div');
      card.style.border = '1px solid #ddd';
      card.style.borderRadius = '10px';
      card.style.padding = '12px';
      card.style.marginBottom = '14px';
      card.dataset.unitId = unitId;

      const title = document.createElement('div');
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '8px';
            const stemHe = unit.stemHe || 'נתונה סדרה חשבונית:';
      const stemTex = unit.stemTex || (`a_1=${a1},\\ d=${d}`);
      title.innerHTML =
        `<span class="he-text" dir="rtl">${stemHe}</span> ` +
        `<span class="math" dir="ltr">\\(\\displaystyle ${stemTex}\\)</span>`;
      card.appendChild(title);

      // pick weakest parts
      const parts = Array.isArray(unit.parts) ? unit.parts.slice() : [];
      const rankedParts = parts.map(p => {
        const pid = p.partId || p.id || '';
        const key = partKey(unitId, pid);
        return { p, w: weaknessScore(stats[key]) };
      }).sort((a, b) => b.w - a.w);

      // Always include the "formula" part if present (like a real test).
      const formulaPart = rankedParts.find(x => (x.p.task === 'formula') || ((x.p.partId || x.p.id || '') === 'formula'))?.p || null;

      const others = rankedParts.filter(x => x.p !== formulaPart);
      const need = Math.max(0, Math.min(partsPerUnit, rankedParts.length) - (formulaPart ? 1 : 0));
      const chosen = (formulaPart ? [formulaPart] : []).concat(others.slice(0, need).map(x => x.p));

      // display order: easy -> hard (difficulty asc, fallback by task)
      chosen.sort((p1, p2) => {
        const d1 = Number(p1.difficulty || 999);
        const d2 = Number(p2.difficulty || 999);
        if (d1 !== d2) return d1 - d2;
        return String(p1.partId || p1.id || '').localeCompare(String(p2.partId || p2.id || ''));
      });

      // Per-unit check button + unit result
      const unitControls = document.createElement('div');
      unitControls.style.display = 'flex';
      unitControls.style.gap = '8px';
      unitControls.style.alignItems = 'center';
      unitControls.style.margin = '8px 0 10px';

      const btnCheckUnit = document.createElement('button');
      btnCheckUnit.textContent = 'בדוק יחידה';
      btnCheckUnit.dataset.unitId = unitId;
      btnCheckUnit.onclick = (e) => checkOneUnit(unitId);
      unitControls.appendChild(btnCheckUnit);

      const unitSummary = document.createElement('div');
      unitSummary.className = 'unit-summary';
      unitSummary.style.fontWeight = 'bold';
      unitSummary.style.marginRight = '8px';
      unitControls.appendChild(unitSummary);

      card.appendChild(unitControls);

      // Parts UI
      chosen.forEach((part, pidx) => {
        const partId = part.partId || part.id || ('p' + (pidx + 1));
        const qid = partKey(unitId, partId);

        const row = document.createElement('div');
        row.className = 'vocab-row';
        row.style.margin = '8px 0';

        const label = document.createElement('div');
        label.style.flex = '1';
        label.style.minWidth = '220px';
        label.innerHTML = '<span dir="rtl">' + String.fromCharCode(0x05D0 + pidx) + '. ' + (part.prompt || part.heText || '') + '</span>';
        row.appendChild(label);

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'open-choice';
        input.dataset.qid = qid;
        input.placeholder = config.answerPlaceholder || 'תשובה';
        row.appendChild(input);

        const fb = document.createElement('div');
        fb.className = 'feedback';
        fb.dataset.qid = qid;
        fb.style.minWidth = '160px';
        row.appendChild(fb);

        card.appendChild(row);
      });

      container.appendChild(card);
    });

    typesetMath(container);
  }

  function normalizeMathAnswer(s) {
    if (s === null || s === undefined) return '';
    let t = String(s).trim().toLowerCase();

    // Remove all whitespace
    t = t.replace(/\s+/g, '');

    // Normalize unicode minus/dash to hyphen
    t = t.replace(/[−–—]/g, '-');

    // Normalize brackets to parentheses
    t = t.replace(/[\[\{]/g, '(').replace(/[\]\}]/g, ')');

    // Normalize multiplication symbols: · and × are always multiplication
    t = t.replace(/[·×]/g, '*');

    // Treat 'x' as multiplication only when it is clearly a multiplication operator:
    // 2x3, 2x(n-1), )x3, )x(n-1)  => replace the 'x' with '*'
    t = t.replace(/([0-9\)])x(?=[0-9\(])/g, '$1*');

    // Insert implicit multiplication:
    // 3(n-1) => 3*(n-1)
    t = t.replace(/(\d)\(/g, '$1*(');
    // )( => )*(
    t = t.replace(/\)\(/g, ')*(');
    // 2n => 2*n
    t = t.replace(/(\d)([a-z])/g, '$1*$2');
    // )n => )*n
    t = t.replace(/\)([a-z])/g, ')*$1');

    // Normalize yes/no in Hebrew and English
    if (t === 'כן' || t === 'ken' || t === 'yes' || t === 'y') return 'כן';
    if (t === 'לא' || t === 'lo' || t === 'no' || t === 'n') return 'לא';

    // Remove redundant leading '+'
    t = t.replace(/^\+/, '');

    // Collapse multiple '*'
    t = t.replace(/\*{2,}/g, '*');

    return t;
  }

  function answersListForPart(part) {
    if (part && Array.isArray(part.answers) && part.answers.length) return part.answers;
    if (part && part.correct !== undefined && part.correct !== null && String(part.correct).length) return [String(part.correct)];
    if (part && part.answer !== undefined && part.answer !== null && String(part.answer).length) return [String(part.answer)];
    return [];
  }

  function isPartCorrect(part, userRaw) {
    const userNorm = normalizeMathAnswer(userRaw);
    if (!userNorm) return false;

    const altsRaw = answersListForPart(part);
    const altsNorm = altsRaw.map(normalizeMathAnswer);

    // Exact normalized match
    if (altsNorm.includes(userNorm)) return true;

    // Also allow matching while ignoring explicit multiplication symbols
    const userNoMul = userNorm.replace(/\*/g, '');
    for (const a of altsNorm) {
      if (a.replace(/\*/g, '') === userNoMul) return true;
    }

    return false;
  }

  function checkOneUnit(unitId) {
    if (!currentConfig || currentConfig.renderer !== 'unitParts') return;

    const unitCard = document.querySelector('div[data-unit-id="' + unitId + '"]');
    const root = unitCard || document.getElementById('quiz-container');
    if (!root) return;

    // Find unit in currentQuestions
    const unit = (currentQuestions || []).find(u => (u.unitId || u.id) === unitId);
    if (!unit) return;

    const partsPerUnit = Number(currentConfig.partsPerUnit || 3);
    const stats = StudyStorage.getQuizStats(currentConfig.quizId);

    const parts = Array.isArray(unit.parts) ? unit.parts.slice() : [];
    const rankedParts = parts.map(p => {
      const pid = p.partId || p.id || '';
      const key = partKey(unitId, pid);
      return { p, w: weaknessScore(stats[key]) };
    }).sort((a, b) => b.w - a.w);

    const chosen = rankedParts.slice(0, Math.min(partsPerUnit, rankedParts.length)).map(x => x.p);
    chosen.sort((p1, p2) => Number(p1.difficulty || 999) - Number(p2.difficulty || 999));

    let correctCount = 0;
    let total = chosen.length;

    chosen.forEach((part, idx) => {
      const partId = part.partId || part.id || '';
      const qid = partKey(unitId, partId);
            const expectedRawList = answersListForPart(part);
      const expectedRaw = expectedRawList.length ? expectedRawList[0] : '';

      const input = document.querySelector('.open-choice[data-qid="' + qid + '"]');
      const fb = document.querySelector('.feedback[data-qid="' + qid + '"]');
            const gotRaw = input ? input.value : '';

      const isCorrect = isPartCorrect(part, gotRaw);
      if (isCorrect) correctCount += 1;

      StudyStorage.updateQuestion(currentConfig.quizId, qid, isCorrect);

      if (fb) {
                fb.textContent = isCorrect ? '✅ נכון' : ('❌ לא. תשובה: ' + expectedRaw);
        fb.className = 'feedback ' + (isCorrect ? 'correct' : 'wrong');
      }
      if (input) input.disabled = true;
    });

    const summary = (unitCard || root).querySelector('.unit-summary');
    if (summary) summary.textContent = `יחידה: ${correctCount}/${total}`;
  }

  function checkUnitPartsAll() {
    if (!currentQuestions.length || !currentConfig) return;

    // For full-check we behave like "check unit" for all units, and lock the global check.
    (currentQuestions || []).forEach(u => {
      const unitId = u.unitId || u.id;
      if (unitId) checkOneUnit(unitId);
    });

    // compute overall based on visible feedback
    const fbs = Array.from(document.querySelectorAll('.feedback.correct, .feedback.wrong'));
    const correct = fbs.filter(x => x.classList.contains('correct')).length;
    const total = fbs.length;
    finalizeQuizResult(correct, total, 'תוצאה');
  }
  return { init, checkQuiz };
})();

window.checkQuiz = () => QuizCore.checkQuiz();