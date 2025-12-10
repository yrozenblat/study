const QuestionSelector = (() => {
  function classify(stat, globalMinTotal) {
    const total = stat ? stat.total || 0 : 0;
    const correct = stat ? stat.correct || 0 : 0;

    if (total === globalMinTotal) return 'rare';
    if (total === 0) return 'rare';

    const ratio = total ? correct / total : 0;
    if (ratio < 0.4) return 'weak';
    if (ratio < 0.8) return 'medium';
    return 'strong';
  }

  function makeBuckets(questions, stats) {
    let minTotal = Infinity;
    questions.forEach(q => {
      const s = stats[q.id];
      const t = s ? (s.total || 0) : 0;
      if (t < minTotal) minTotal = t;
    });
    if (!isFinite(minTotal)) minTotal = 0;

    const buckets = { rare: [], weak: [], medium: [], strong: [] };
    questions.forEach(q => {
      const s = stats[q.id];
      const str = classify(s, minTotal);
      buckets[str].push(q);
    });
    return buckets;
  }

  function select(questions, stats, config) {
    const numQuestions = config.numQuestions || questions.length;
    const weights = config.selectionWeights || {
      rare: 0.4,
      weak: 0.4,
      medium: 0.2,
      strong: 0.0
    };

    const buckets = makeBuckets(questions, stats);
    const result = [];

    function takeFrom(bucketName, n) {
      const arr = buckets[bucketName];
      for (let i = 0; i < n && arr.length > 0; i++) {
        const idx = Math.floor(Math.random() * arr.length);
        result.push(arr.splice(idx, 1)[0]);
      }
    }

    const totalRequested = numQuestions;
    const order = ['rare', 'weak', 'medium', 'strong'];

    order.forEach(name => {
      const w = weights[name] || 0;
      const n = Math.round(totalRequested * w);
      takeFrom(name, n);
    });

    const remainingPool = [
      ...buckets.rare,
      ...buckets.weak,
      ...buckets.medium,
      ...buckets.strong
    ];
    while (result.length < numQuestions && remainingPool.length > 0) {
      const idx = Math.floor(Math.random() * remainingPool.length);
      result.push(remainingPool.splice(idx, 1)[0]);
    }

    return result.slice(0, numQuestions);
  }

  return { select };
})();
