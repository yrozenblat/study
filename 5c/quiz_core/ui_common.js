let QuizCore = (() => {
  let currentQuestions = [];
  let currentConfig = null;
  let hasChecked = false;

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

  function setCheckButtonEnabled(enabled) {
    // Prefer an explicit ID if present, fallback to the inline-onclick button.
    const btn = document.getElementById('btn-check') || document.querySelector('button[onclick="checkQuiz()"]');
    if (btn) btn.disabled = !enabled;
  }

  async function init(options) {
    const { configUrl, questionsUrl } = options;
    const [config, questions] = await Promise.all([
      fetch(configUrl).then(r => r.json()),
      fetch(questionsUrl).then(r => r.json())
    ]);
    currentConfig = config;
    const stats = StudyStorage.getQuizStats(config.quizId);
    currentQuestions = QuestionSelector.select(questions, stats, config);

    if (config.renderer === 'drag') {
      renderVocabDrag(currentQuestions);
    } else if (config.renderer === 'text') {
      renderVocabText(currentQuestions, config);
    } else {
      renderMcq(currentQuestions);
    }

    const result = document.getElementById('result');
    if (result) result.textContent = '';

    // Allow checking again only after starting a new quiz.
    hasChecked = false;
    setCheckButtonEnabled(true);
  }

  function renderMcq(questions) {
    const container = document.getElementById('quiz-container');
    if (!container) return;
    container.innerHTML = '';

    questions.forEach((q, idx) => {
      const wrap = document.createElement('div');
      wrap.className = 'question';

      const textDiv = document.createElement('div');
      textDiv.className = 'question-text';
      textDiv.textContent = (idx + 1) + '. ' + q.text;
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

      const fb = document.createElement('div');
      fb.className = 'feedback';
      fb.id = 'fb-' + q.id;

      wrap.appendChild(optsDiv);
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
      input.placeholder = 'תרגום בעברית';
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
    } else {
      return checkMcq();
    }
  }

  function checkMcq() {
    let correctCount = 0;
    let total = currentQuestions.length;

    currentQuestions.forEach(q => {
      const radios = document.querySelectorAll(`input[name="${q.id}"]`);
      let chosen = null;
      radios.forEach(r => {
        if (r.checked) chosen = r.value;
        r.disabled = true;
      });

      const isCorrect = (chosen === q.correct);
      if (isCorrect) correctCount++;

      StudyStorage.updateQuestion(currentConfig.quizId, Strength.baseId(q.id), isCorrect);

      const fb = document.getElementById('fb-' + q.id);
      if (!fb) return;
      fb.classList.remove('correct', 'wrong');

      if (!chosen) {
        fb.classList.add('wrong');
        fb.textContent = '✗ לא נבחרה תשובה. תשובה נכונה: ' + q.correct + (q.rule ? ' – ' + q.rule : '');
      } else if (isCorrect) {
        fb.classList.add('correct');
        fb.textContent = '✓ נכון';
      } else {
        fb.classList.add('wrong');
        fb.textContent = '✗ שגוי. תשובה נכונה: ' + q.correct + (q.rule ? ' – ' + q.rule : '');
      }
    });

    const result = document.getElementById('result');
    if (result) {
      result.textContent = `ציון: ${correctCount} מתוך ${total}`;
    }
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

    const result = document.getElementById('result');
    if (result) {
      result.textContent = `ציון: ${correctCount} מתוך ${total}`;
    }
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

    const result = document.getElementById('result');
    if (result) {
      result.textContent = `ציון: ${correctCount} מתוך ${total}`;
    }
  }

  return { init, checkQuiz };
})();

window.checkQuiz = () => QuizCore.checkQuiz();
