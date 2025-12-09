// grammar_quiz.js - self contained version

// --- data ---
const GRAMMAR_QUESTIONS = {
  a_an: [
    { id: 'ga01', text: '_____ apple', options: ['a', 'an'], correct: 'an' },
    { id: 'ga02', text: '_____ banana', options: ['a', 'an'], correct: 'a' },
    { id: 'ga03', text: '_____ egg', options: ['a', 'an'], correct: 'an' },
    { id: 'ga04', text: '_____ orange', options: ['a', 'an'], correct: 'an' },
    { id: 'ga05', text: '_____ umbrella', options: ['a', 'an'], correct: 'an' },
    { id: 'ga06', text: '_____ mango', options: ['a', 'an'], correct: 'a' },
    { id: 'ga07', text: '_____ eraser', options: ['a', 'an'], correct: 'an' },
    { id: 'ga08', text: '_____ house', options: ['a', 'an'], correct: 'a' },
    { id: 'ga09', text: '_____ computer', options: ['a', 'an'], correct: 'a' },
    { id: 'ga10', text: '_____ eggplant', options: ['a', 'an'], correct: 'an' }
  ],
  am_is_are: [
    { id: 'gi01', text: 'I _____ ten years old.', options: ['am', 'is', 'are'], correct: 'am' },
    { id: 'gi02', text: 'She _____ my sister.', options: ['am', 'is', 'are'], correct: 'is' },
    { id: 'gi03', text: 'They _____ at school now.', options: ['am', 'is', 'are'], correct: 'are' },
    { id: 'gi04', text: 'We _____ in the park.', options: ['am', 'is', 'are'], correct: 'are' },
    { id: 'gi05', text: 'It _____ my bag.', options: ['am', 'is', 'are'], correct: 'is' },
    { id: 'gi06', text: 'You _____ a good friend.', options: ['am', 'is', 'are'], correct: 'are' },
    { id: 'gi07', text: 'My mother _____ at work.', options: ['am', 'is', 'are'], correct: 'is' },
    { id: 'gi08', text: 'The boys _____ happy.', options: ['am', 'is', 'are'], correct: 'are' }
  ],
  there_is_are: [
    { id: 'gt01', text: '_____ a computer on the desk.', options: ['There is', 'There are'], correct: 'There is' },
    { id: 'gt02', text: '_____ two chairs in the room.', options: ['There is', 'There are'], correct: 'There are' },
    { id: 'gt03', text: '_____ some books on the table.', options: ['There is', 'There are'], correct: 'There are' },
    { id: 'gt04', text: '_____ a bag under the chair.', options: ['There is', 'There are'], correct: 'There is' },
    { id: 'gt05', text: '_____ six cars in the street.', options: ['There is', 'There are'], correct: 'There are' },
    { id: 'gt06', text: '_____ an orange on the plate.', options: ['There is', 'There are'], correct: 'There is' }
  ]
};

const GRAMMAR_STATS_KEY = 'grammar_quiz_stats_v1';

let currentTopic = 'a_an';
let currentQuizQuestions = [];
let checked = false;

// --- helpers for stats in localStorage (using storage.js if exists) ---
function loadGrammarStats() {
  try {
    if (window.studyStorage) {
      return window.studyStorage.load(GRAMMAR_STATS_KEY, {});
    }
    const raw = localStorage.getItem(GRAMMAR_STATS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('loadGrammarStats', e);
    return {};
  }
}

function saveGrammarStats(stats) {
  try {
    if (window.studyStorage) {
      window.studyStorage.save(GRAMMAR_STATS_KEY, stats);
    } else {
      localStorage.setItem(GRAMMAR_STATS_KEY, JSON.stringify(stats));
    }
  } catch (e) {
    console.error('saveGrammarStats', e);
  }
}

// choose random subset
function pickRandomQuestions(topic, count = 6) {
  const all = GRAMMAR_QUESTIONS[topic] || [];
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, all.length));
}

// render quiz
function renderQuiz() {
  const container = document.getElementById('quizContainer');
  container.innerHTML = '';
  const topicQuestions = currentQuizQuestions;

  topicQuestions.forEach((q, index) => {
    const block = document.createElement('div');
    block.className = 'question-block';

    const qTextDiv = document.createElement('div');
    qTextDiv.className = 'question-text';
    qTextDiv.textContent = (index + 1) + '. ' + q.text;
    block.appendChild(qTextDiv);

    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'options';

    q.options.forEach(opt => {
      const label = document.createElement('label');
      label.className = 'option-label';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = q.id;
      radio.value = opt;
      label.appendChild(radio);
      label.appendChild(document.createTextNode(' ' + opt));
      optionsDiv.appendChild(label);
    });

    block.appendChild(optionsDiv);
    container.appendChild(block);
  });

  document.getElementById('resultSummary').textContent = '';
  document.getElementById('status').textContent = '';
  checked = false;
}

// check answers
function checkQuiz() {
  if (!currentQuizQuestions.length) return;

  let correctCount = 0;
  let total = currentQuizQuestions.length;

  const stats = loadGrammarStats();
  if (!stats[currentTopic]) {
    stats[currentTopic] = { total: 0, correct: 0 };
  }

  currentQuizQuestions.forEach(q => {
    const selected = document.querySelector(`input[name="${q.id}"]:checked`);
    const userAnswer = selected ? selected.value : null;
    if (userAnswer === q.correct) {
      correctCount++;
    }
  });

  // update stats only once per quiz
  stats[currentTopic].total += total;
  stats[currentTopic].correct += correctCount;
  saveGrammarStats(stats);

  document.getElementById('resultSummary').textContent =
    `ציון: ${correctCount} מתוך ${total}`;

  checked = true;

  // lock answers
  currentQuizQuestions.forEach(q => {
    const inputs = document.querySelectorAll(`input[name="${q.id}"]`);
    inputs.forEach(inp => inp.disabled = true);
  });

  updateStatsBox();
}

// show global stats
function updateStatsBox() {
  const box = document.getElementById('statsBox');
  const stats = loadGrammarStats();
  const topicStats = stats[currentTopic];

  if (!topicStats || topicStats.total === 0) {
    box.textContent = 'עדיין אין סטטיסטיקה לנושא זה.';
    return;
  }

  const percent = Math.round(100 * topicStats.correct / topicStats.total);
  let topicLabel = '';
  if (currentTopic === 'a_an') topicLabel = 'a/an';
  else if (currentTopic === 'am_is_are') topicLabel = 'am/is/are';
  else if (currentTopic === 'there_is_are') topicLabel = 'There is/There are';

  box.textContent =
    `סטטיסטיקה כוללת (${topicLabel}): ${topicStats.correct} נכונות מתוך ${topicStats.total} (${percent}%).`;
}

// new quiz
function newQuiz() {
  const container = document.getElementById('quizContainer');
  container.innerHTML = 'טוען...';
  currentTopic = document.getElementById('topicSelect').value;
  currentQuizQuestions = pickRandomQuestions(currentTopic, 6);
  setTimeout(renderQuiz, 0);
}

// init
window.addEventListener('DOMContentLoaded', () => {
  const topicSelect = document.getElementById('topicSelect');
  const newQuizBtn = document.getElementById('newQuizBtn');
  const checkBtn = document.getElementById('checkBtn');

  topicSelect.addEventListener('change', () => {
    newQuiz();
  });

  newQuizBtn.addEventListener('click', () => {
    newQuiz();
  });

  checkBtn.addEventListener('click', () => {
    checkQuiz();
  });

  // first quiz
  newQuiz();
  updateStatsBox();
});
