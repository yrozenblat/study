import { recordAnswer, saveProgress } from './storage.js';

export function renderVocabDragQuiz(container, quizConfig, questions, progress) {
  container.innerHTML = '';

  const title = document.createElement('h3');
  title.textContent = quizConfig.title;
  container.appendChild(title);

  const instructions = document.createElement('p');
  instructions.textContent = 'גררו כל מילה בעברית ממחסן המילים אל המילה המתאימה באנגלית.';
  container.appendChild(instructions);

  const table = document.createElement('table');
  table.style.borderCollapse = 'collapse';
  table.style.marginBottom = '16px';
  table.style.direction = 'rtl';

  questions.forEach((q, idx) => {
    const tr = document.createElement('tr');

    const numTd = document.createElement('td');
    numTd.textContent = (idx + 1) + '.';
    numTd.style.padding = '4px 8px';

    const engTd = document.createElement('td');
    engTd.textContent = q.english;
    engTd.style.padding = '4px 8px';

    const dropTd = document.createElement('td');
    dropTd.style.padding = '4px 8px';
    const dropZone = document.createElement('div');
    dropZone.className = 'drop-zone';
    dropZone.dataset.id = q.id;
    dropZone.style.minWidth = '120px';
    dropZone.style.minHeight = '24px';
    dropZone.style.border = '1px dashed #aaa';
    dropZone.style.borderRadius = '4px';
    dropZone.style.padding = '2px 6px';
    dropZone.style.backgroundColor = '#fafafa';

    dropZone.addEventListener('dragover', ev => {
      ev.preventDefault();
      dropZone.style.backgroundColor = '#eef';
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.style.backgroundColor = '#fafafa';
    });
    dropZone.addEventListener('drop', ev => {
      ev.preventDefault();
      dropZone.style.backgroundColor = '#fafafa';
      const wordId = ev.dataTransfer.getData('text/plain');
      if (!wordId) return;
      const el = container.querySelector(`.word-chip[data-id="${wordId}"]`);
      if (!el) return;
      if (el.parentElement) {
        el.parentElement.removeChild(el);
      }
      dropZone.innerHTML = '';
      dropZone.appendChild(el);
    });

    dropTd.appendChild(dropZone);

    const resultTd = document.createElement('td');
    resultTd.className = 'result-cell';
    resultTd.style.padding = '4px 8px';

    tr.appendChild(numTd);
    tr.appendChild(engTd);
    tr.appendChild(dropTd);
    tr.appendChild(resultTd);
    table.appendChild(tr);
  });

  container.appendChild(table);

  const storeTitle = document.createElement('div');
  storeTitle.textContent = 'מחסן מילים:';
  storeTitle.style.marginBottom = '4px';
  container.appendChild(storeTitle);

  const store = document.createElement('div');
  store.id = 'wordStore';
  store.style.display = 'flex';
  store.style.flexWrap = 'wrap';
  store.style.gap = '6px';
  store.style.marginBottom = '16px';

  questions
    .map(q => ({ id: q.id, hebrew: q.hebrew }))
    .sort((a, b) => a.hebrew.localeCompare(b.hebrew))
    .forEach(w => {
      const chip = document.createElement('div');
      chip.className = 'word-chip';
      chip.dataset.id = w.id;
      chip.textContent = w.hebrew;
      chip.draggable = true;
      chip.style.border = '1px solid #ccc';
      chip.style.borderRadius = '12px';
      chip.style.padding = '2px 10px';
      chip.style.cursor = 'move';
      chip.style.backgroundColor = '#fff';

      chip.addEventListener('dragstart', ev => {
        ev.dataTransfer.setData('text/plain', w.id);
      });

      store.appendChild(chip);
    });

  container.appendChild(store);

  const buttonsRow = document.createElement('div');
  buttonsRow.style.display = 'flex';
  buttonsRow.style.gap = '10px';
  buttonsRow.style.alignItems = 'center';
  buttonsRow.style.marginBottom = '10px';

  const checkBtn = document.createElement('button');
  checkBtn.textContent = 'בדוק';
  const newTestBtn = document.createElement('button');
  newTestBtn.textContent = 'מבחן חדש';
  newTestBtn.style.display = 'none';

  const scoreSpan = document.createElement('span');
  scoreSpan.style.marginRight = '10px';

  buttonsRow.appendChild(checkBtn);
  buttonsRow.appendChild(newTestBtn);
  buttonsRow.appendChild(scoreSpan);
  container.appendChild(buttonsRow);

  const explanationList = document.createElement('ul');
  explanationList.style.marginTop = '8px';
  container.appendChild(explanationList);

  checkBtn.addEventListener('click', () => {
    let correctCount = 0;
    explanationList.innerHTML = '';

    checkBtn.disabled = true;
    newTestBtn.style.display = 'inline-block';

    questions.forEach((q, idx) => {
      const row = table.rows[idx];
      const dropZone = row.querySelector('.drop-zone');
      const resultTd = row.querySelector('.result-cell');
      const placed = dropZone.querySelector('.word-chip');
      let isCorrect = false;
      resultTd.innerHTML = '';

      if (placed && placed.dataset.id === q.id) {
        isCorrect = true;
        correctCount++;
        resultTd.innerHTML = '<span style="color:green">✓</span>';
      } else {
        const correctText = q.hebrew;
        if (!placed) {
          resultTd.innerHTML = '<span style="color:red">✗ (אין תשובה)</span>';
        } else {
          resultTd.innerHTML = `<span style="color:red">✗ (${correctText})</span>`;
        }
        const li = document.createElement('li');
        li.textContent = `${q.english} = ${q.hebrew}`;
        explanationList.appendChild(li);
      }

      recordAnswer(progress, q.id, isCorrect);
    });

    saveProgress(quizConfig.id, progress);
    scoreSpan.textContent = `ציון: ${correctCount} מתוך ${questions.length}`;
  });

  newTestBtn.addEventListener('click', () => {
    const ev = new CustomEvent('quiz:newTest', { detail: { quizId: quizConfig.id } });
    container.dispatchEvent(ev);
  });
}
