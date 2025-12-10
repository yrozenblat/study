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
    renderMcq(currentQuestions);
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

    const result = document.getElementById('result');
    if (result) result.textContent = '';
  }

  function checkQuiz() {
    if (!currentQuestions.length || !currentConfig) return;
    let correctCount = 0;
    let total = currentQuestions.length;

    currentQuestions.forEach(q => {
      const radios = document.querySelectorAll(`input[name="${q.id}"]`);
      let chosen = null;
      radios.forEach(r => {
        if (r.checked) chosen = r.value;
        r.disabled = true; // לנעול אחרי בדיקה
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

  return { init, checkQuiz };
})();

// לחשוף לפקדי HTML
window.checkQuiz = () => QuizCore.checkQuiz();
