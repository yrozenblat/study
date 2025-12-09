// בחירת פריטים למבחן לפי סטטיסטיקה + משקלים
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

  // rare = אלו עם מספר הניסיונות המינימלי
  const minTotal = Math.min(...annotated.map(i => i.total));
  const rare = annotated.filter(i => i.total === minTotal);
  const others = annotated.filter(i => i.total !== minTotal);

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
    for (const key of Object.keys(buckets)) {
      const w = weights[key] || 0;
      if (!buckets[key].length || w <= 0) continue;
      for (let i = 0; i < w; i++) pool.push(key);
    }
    if (!pool.length) break;

    const bucketKey = pool[Math.floor(Math.random() * pool.length)];
    const arr = buckets[bucketKey];
    const idx = Math.floor(Math.random() * arr.length);
    selected.push(arr.splice(idx, 1)[0]);
    remaining--;
  }

  // אם לא הגענו לכמות המבוקשת – נמשלים באקראי מתוך השאר
  if (selected.length < numQuestions) {
    const remainingPool = [];
    Object.values(buckets).forEach(arr => remainingPool.push(...arr));
    while (selected.length < numQuestions && remainingPool.length) {
      const idx = Math.floor(Math.random() * remainingPool.length);
      selected.push(remainingPool.splice(idx, 1)[0]);
    }
  }

  return selected;
}
