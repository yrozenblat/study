export function selectItems(items, progress, numQuestions, weights) {
  const annotated = items.map(it => {
    const rec = progress[it.id] || { correct: 0, wrong: 0 };
    const total = rec.correct + rec.wrong;
    let strength = 'strong';
    if (total === 0) strength = 'unknown';
    else if (rec.correct / total < 0.4) strength = 'weak';
    else if (rec.correct / total < 0.8) strength = 'medium';
    return { ...it, total, strength };
  });

  const minTotal = Math.min(...annotated.map(i => i.total));
  const rare = annotated.filter(i => i.total == minTotal);
  const others = annotated.filter(i => i.total != minTotal);

  const buckets = {
    rare,
    weak: others.filter(i => i.strength === 'weak'),
    medium: others.filter(i => i.strength === 'medium'),
    strong: others.filter(i => i.strength === 'strong' || i.strength === 'unknown')
  };

  const selected = [];
  let remaining = numQuestions;

  while (remaining > 0) {
    const pool = [];
    Object.keys(buckets).forEach(k => {
      const w = weights[k] || 0;
      if (buckets[k].length === 0 || w <= 0) return;
      for (let i = 0; i < w; i++) pool.push(k);
    });
    if (!pool.length) break;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const arr = buckets[pick];
    const idx = Math.floor(Math.random() * arr.length);
    selected.push(arr.splice(idx, 1)[0]);
    remaining--;
  }
  return selected;
}
