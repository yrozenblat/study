// grammar_quiz.js
// מבחן דקדוק: a/an, am/is/are, there is/there are
// שומר סטטיסטיקה ב-localStorage (לכל שאלה לפי id ולפי נושא)

const GRAMMAR_STORAGE_KEY = "grammar_stats_v1";
const QUESTIONS_PER_QUIZ = 6;

// --------------------------------------------------------
// מאגר שאלות
// --------------------------------------------------------
const grammarBank = {
  a_an: {
    label: "a / an",
    topicId: "a_an",
    questions: [
      {
        id: "aa01",
        text: "apple _____",
        options: ["a", "an"],
        correctIndex: 1,
        rule: "משתמשים ב-an לפני צליל תנועה (a, e, i, o, u)."
      },
      {
        id: "aa02",
        text: "banana _____",
        options: ["a", "an"],
        correctIndex: 0,
        rule: "banana לא מתחיל בצליל תנועה, לכן משתמשים ב-a."
      },
      {
        id: "aa03",
        text: "orange _____",
        options: ["a", "an"],
        correctIndex: 1,
        rule: "orange מתחיל בצליל תנועה, לכן an."
      },
      {
        id: "aa04",
        text: "umbrella _____",
        options: ["a", "an"],
        correctIndex: 1,
        rule: "umbrella מתחיל בצליל תנועה (u נהגה כמו ‘א-’), לכן an."
      },
      {
        id: "aa05",
        text: "mango _____",
        options: ["a", "an"],
        correctIndex: 0,
        rule: "mango מתחיל בעיצור m, לכן a."
      },
      {
        id: "aa06",
        text: "egg _____",
        options: ["a", "an"],
        correctIndex: 1,
        rule: "egg מתחיל בצליל תנועה, לכן an."
      },
      {
        id: "aa07",
        text: "box _____",
        options: ["a", "an"],
        correctIndex: 0,
        rule: "box מתחיל בעיצור b, לכן a."
      },
      {
        id: "aa08",
        text: "eraser _____",
        options: ["a", "an"],
        correctIndex: 1,
        rule: "eraser מתחיל בצליל תנועה, לכן an."
      },
      {
        id: "aa09",
        text: "house _____",
        options: ["a", "an"],
        correctIndex: 0,
        rule: "house מתחיל בעיצור h (נהגה), לכן a."
      },
      {
        id: "aa10",
        text: "avocado _____",
        options: ["a", "an"],
        correctIndex: 1,
        rule: "avocado מתחיל בצליל תנועה, לכן an."
      }
    ]
  },

  be_verb: {
    label: "am / is / are",
    topicId: "be_verb",
    questions: [
      {
        id: "be01",
        text: "I _____ ten years old.",
        options: ["am", "is", "are"],
        correctIndex: 0,
        rule: "עם I משתמשים ב-am."
      },
      {
        id: "be02",
        text: "She _____ my sister.",
        options: ["am", "is", "are"],
        correctIndex: 1,
        rule: "עם he / she / it משתמשים ב-is."
      },
      {
        id: "be03",
        text: "They _____ at school.",
        options: ["am", "is", "are"],
        correctIndex: 2,
        rule: "עם we / you / they משתמשים ב-are."
      },
      {
        id: "be04",
        text: "We _____ happy.",
        options: ["am", "is", "are"],
        correctIndex: 2,
        rule: "עם we / you / they משתמשים ב-are."
      },
      {
        id: "be05",
        text: "It _____ hot today.",
        options: ["am", "is", "are"],
        correctIndex: 1,
        rule: "עם he / she / it משתמשים ב-is."
      },
      {
        id: "be06",
        text: "My mother _____ at the supermarket.",
        options: ["am", "is", "are"],
        correctIndex: 1,
        rule: "My mother = she → is."
      },
      {
        id: "be07",
        text: "Tim and Dan _____ friends.",
        options: ["am", "is", "are"],
        correctIndex: 2,
        rule: "Tim and Dan = they → are."
      },
      {
        id: "be08",
        text: "You _____ a good pupil.",
        options: ["am", "is", "are"],
        correctIndex: 2,
        rule: "עם you משתמשים ב-are."
      }
    ]
  },

  there_is_are: {
    label: "there is / there are",
    topicId: "there_is_are",
    questions: [
      {
        id: "th01",
        text: "_____ a computer on the table.",
        options: ["There is", "There are"],
        correctIndex: 0,
        rule: "there is עם שם עצם יחיד."
      },
      {
        id: "th02",
        text: "_____ two pencils in the box.",
        options: ["There is", "There are"],
        correctIndex: 1,
        rule: "there are עם שם עצם ברבים (two pencils)."
      },
      {
        id: "th03",
        text: "_____ some markers on the desk.",
        options: ["There is", "There are"],
        correctIndex: 1,
        rule: "some markers → רבים, לכן there are."
      },
      {
        id: "th04",
        text: "_____ a bag under the chair.",
        options: ["There is", "There are"],
        correctIndex: 0,
        rule: "a bag → יחיד, לכן there is."
      },
      {
        id: "th05",
        text: "_____ an elephant in the picture.",
        options: ["There is", "There are"],
        correctIndex: 0,
        rule: "an elephant → יחיד, לכן there is."
      },
      {
        id: "th06",
        text: "_____ some books on the shelf.",
        options: ["There is", "There are"],
        correctIndex: 1,
        rule: "some books → רבים, לכן there are."
      },
      {
        id: "th07",
        text: "_____ nine red markers in the box.",
        options: ["There is", "There are"],
        correctIndex: 1,
        rule: "nine red markers → רבים, לכן there are."
      },
      {
        id: "th08",
        text: "_____ some children in the park.",
        options: ["There is", "There are"],
        correctIndex: 1,
        rule: "some children → רבים, לכן there are."
      }
    ]
  }
};

// --------------------------------------------------------
// כלי סטטיסטיקה
// --------------------------------------------------------
function loadGrammarStats() {
  try {
    const raw = localStorage.getItem(GRAMMAR_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load grammar stats", e);
    return {};
  }
}

function saveGrammarStats(stats) {
  try {
    localStorage.setItem(GRAMMAR_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error("Failed to save grammar stats", e);
  }
}

function updateGrammarStat(topicId, questionId, isCorrect) {
  const stats = loadGrammarStats();
  if (!stats[topicId]) stats[topicId] = {};
  if (!stats[topicId][questionId]) {
    stats[topicId][questionId] = { correct: 0, total: 0 };
  }
  stats[topicId][questionId].total += 1;
  if (isCorrect) stats[topicId][questionId].correct += 1;
  saveGrammarStats(stats);
}

// --------------------------------------------------------
// יצירת מבחן
// --------------------------------------------------------
let currentTopicId = "a_an";
let currentQuestions = [];

function pickRandomQuestions(allQuestions, count) {
  const copy = [...allQuestions];
  // ערבוב
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

function generateQuiz() {
  const topic = grammarBank[currentTopicId];
  if (!topic) return;

  currentQuestions = pickRandomQuestions(topic.questions, QUESTIONS_PER_QUIZ);

  const container = document.getElementById("questionsContainer");
  container.innerHTML = "";

  currentQuestions.forEach((q, index) => {
    const qDiv = document.createElement("div");
    qDiv.className = "question";

    const row = document.createElement("div");
    row.className = "question-row";

    const numSpan = document.createElement("span");
    numSpan.className = "q-number";
    numSpan.textContent = (index + 1) + ".";

    const textSpan = document.createElement("span");
    textSpan.className = "question-text";
    textSpan.textContent = q.text.replace("_____", "_____");

    row.appendChild(numSpan);
    row.appendChild(textSpan);

    const optionsDiv = document.createElement("div");
    optionsDiv.className = "options";

    q.options.forEach((opt, optIndex) => {
      const label = document.createElement("label");

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "q" + index;
      radio.value = optIndex;

      label.appendChild(radio);
      label.appendChild(document.createTextNode(" " + opt));

      optionsDiv.appendChild(label);
    });

    const feedbackDiv = document.createElement("div");
    feedbackDiv.className = "feedback";
    feedbackDiv.id = "fb-" + index;

    qDiv.appendChild(row);
    qDiv.appendChild(optionsDiv);
    qDiv.appendChild(feedbackDiv);

    container.appendChild(qDiv);
  });

  document.getElementById("resultBox").textContent = "";
  document.getElementById("resultDetails").textContent = "";
}

function checkAnswers() {
  if (!currentQuestions.length) return;

  let correctCount = 0;
  let total = currentQuestions.length;
  let details = [];

  currentQuestions.forEach((q, index) => {
    const radios = document.querySelectorAll(`input[name="q${index}"]`);
    let chosenIndex = null;
    radios.forEach(r => {
      if (r.checked) chosenIndex = parseInt(r.value, 10);
      // לאחר בדיקה ננעל את התשובות – אין תיקון
      r.disabled = true;
    });

    const feedbackDiv = document.getElementById("fb-" + index);
    feedbackDiv.classList.remove("correct", "wrong");

    if (chosenIndex === null) {
      feedbackDiv.classList.add("wrong");
      feedbackDiv.textContent = "✗ לא סומן פתרון. התשובה הנכונה: " +
        q.options[q.correctIndex] + ". כלל: " + q.rule;
      updateGrammarStat(currentTopicId, q.id, false);
      details.push(`שאלה ${index + 1}: לא נענתה`);
    } else if (chosenIndex === q.correctIndex) {
      feedbackDiv.classList.add("correct");
      feedbackDiv.textContent = "✓ נכון";
      correctCount++;
      updateGrammarStat(currentTopicId, q.id, true);
      details.push(`שאלה ${index + 1}: נכון`);
    } else {
      feedbackDiv.classList.add("wrong");
      feedbackDiv.textContent = "✗ לא נכון. התשובה הנכונה: " +
        q.options[q.correctIndex] + ". כלל: " + q.rule;
      updateGrammarStat(currentTopicId, q.id, false);
      details.push(`שאלה ${index + 1}: לא נכון`);
    }
  });

  const resultBox = document.getElementById("resultBox");
  const resultDetails = document.getElementById("resultDetails");
  resultBox.textContent = `ציון: ${correctCount} מתוך ${total}`;
  resultDetails.textContent = details.join(" | ");
}

// --------------------------------------------------------
// חיבור לאירועים
// --------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const topicSelect = document.getElementById("topicSelect");
  const newQuizBtn = document.getElementById("newQuizBtn");
  const checkBtn = document.getElementById("checkBtn");

  topicSelect.addEventListener("change", () => {
    currentTopicId = topicSelect.value;
    generateQuiz();
  });

  newQuizBtn.addEventListener("click", () => {
    generateQuiz();
  });

  checkBtn.addEventListener("click", () => {
    checkAnswers();
  });

  // התחלה ראשונית
  currentTopicId = topicSelect.value;
  generateQuiz();
});
