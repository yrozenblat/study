
const QuizSelection = (function() {
  function categorize(stats, qKey) {
    const s = stats[qKey];
    if (!s || !s.total) return 'rare';
    const ratio = s.correct / s.total;
    if (ratio < 0.4) return 'weak';
    if (ratio < 0.7) return 'medium';
    return 'strong';
  }

  function classifyQuestions(questions, stats) {
    const buckets = { rare: [], weak: [], medium: [], strong: [] };
    questions.forEach((q) => {
      const key = q.key || q.english || q.id;
      const strength = categorize(stats, key);
      q.strength = strength;
      buckets[strength].push(q);
    });
    return buckets;
  }

  function weightedChoice(weights) {
    const entries = Object.entries(weights);
    const total = entries.reduce((sum, [,w]) => sum + w, 0);
    const r = Math.random() * total;
    let acc = 0;
    for (const [k, w] of entries) {
      acc += w;
      if (r <= acc) return k;
    }
    return entries[entries.length - 1][0];
  }

  function pickQuestions(questions, stats, numQuestions, weights) {
    const buckets = classifyQuestions(questions, stats);
    const result = [];
    const usedKeys = new Set();
    const defaultWeights = { rare: 0.5, weak: 0.3, medium: 0.15, strong: 0.05 };
    const w = Object.assign({}, defaultWeights, weights || {});

    let safety = 0;
    while (result.length < numQuestions && safety < numQuestions * 20) {
      safety++;
      const bucketName = weightedChoice(w);
      const bucket = buckets[bucketName];
      if (!bucket || bucket.length === 0) {
        // if chosen bucket empty, fall back to all questions
        const remaining = questions.filter(q => !usedKeys.has(q.key || q.english || q.id));
        if (!remaining.length) break;
        const q = remaining[Math.floor(Math.random() * remaining.length)];
        const key = q.key || q.english || q.id;
        usedKeys.add(key);
        result.push(q);
        continue;
      }
      const q = bucket[Math.floor(Math.random() * bucket.length)];
      const key = q.key || q.english || q.id;
      if (usedKeys.has(key)) continue;
      usedKeys.add(key);
      result.push(q);
    }

    return result;
  }

  return {
    pickQuestions,
    classifyQuestions
  };
})();
