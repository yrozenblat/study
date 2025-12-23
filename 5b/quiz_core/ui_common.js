let QuizCore = (() => {
  let currentQuestions = [];
  let currentConfig = null;

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
    } else {
      renderMcq(currentQuestions);
    }

    const result = document.getElementById('result');
    if (result) result.textContent = '';
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

  function checkQuiz() {
    if (!currentQuestions.length || !currentConfig) return;

    if (currentConfig.renderer === 'drag') {
      return checkDrag();
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

      StudyStorage.updateQuestion(currentConfig.quizId, q.id, isCorrect);

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

      const isCorrect = (chosenId === q.id);
      if (isCorrect) correctCount++;

      StudyStorage.updateQuestion(currentConfig.quizId, q.id, isCorrect);

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

  return { init, checkQuiz };
})();

window.checkQuiz = () => QuizCore.checkQuiz();
