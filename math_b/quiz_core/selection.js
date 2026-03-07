const QuestionSelector = (() => {
  // Weighted random selection, using a shared classification.
  // Requires `quiz_core/strength.js` to be loaded before this file.

  function _normalizeWeights(weights) {
    // Backwards compatibility:
    // - older configs use {rare, weak, medium, strong}
    // - new configs use {new, weak, medium, strong}
    if (!weights) return null;
    const out = Object.assign({}, weights);
    if (typeof out.new !== 'number' && typeof out.rare === 'number') out.new = out.rare;
    return out;
  }

  function _weightedPickIndex(items, getWeight) {
    let sum = 0;
    for (let i = 0; i < items.length; i++) {
      const w = Math.max(0, getWeight(items[i], i) || 0);
      sum += w;
    }
    if (sum <= 0) return -1;

    let r = Math.random() * sum;
    for (let i = 0; i < items.length; i++) {
      const w = Math.max(0, getWeight(items[i], i) || 0);
      r -= w;
      if (r <= 0) return i;
    }
    return items.length - 1;
  }

  
  function filterByTags(questions, config) {
    const inc = (config && config.tags && Array.isArray(config.tags.include)) ? config.tags.include : [];
    const exc = (config && config.tags && Array.isArray(config.tags.exclude)) ? config.tags.exclude : [];
    if ((!inc || inc.length === 0) && (!exc || exc.length === 0)) return questions;

    const incSet = new Set(inc || []);
    const excSet = new Set(exc || []);

    return questions.filter(q => {
      const t = Array.isArray(q.tags) ? q.tags : [];
      // Exclude has priority
      for (const tag of t) if (excSet.has(tag)) return false;
      if (!inc || inc.length === 0) return true;
      for (const tag of t) if (incSet.has(tag)) return true;
      return false;
    });
  }

function select(questions, stats, config) {
    // Optional tag filtering (include/exclude). If no tags in config, this is a no-op.
    questions = filterByTags(questions, config);
    const numQuestions = config.numQuestions || questions.length;

    // Default weights are *scores*, not percentages.
    // Higher score => selected more often.
    const weights = _normalizeWeights(config.selectionWeights) || {
      new: 5,
      weak: 4,
      medium: 2,
      strong: 1
    };

    const weakThreshold = (typeof config.weakThreshold === 'number') ? config.weakThreshold : 0.60;
    const mediumThreshold = (typeof config.mediumThreshold === 'number') ? config.mediumThreshold : 0.85;
    const noveltyK = (typeof config.noveltyK === 'number') ? config.noveltyK : 1.5;
    const minNewRatio = (typeof config.minNewRatio === 'number') ? config.minNewRatio : 0;
    const preventSameGroup = (typeof config.preventSameGroup === 'boolean') ? config.preventSameGroup : true;

    // Build a working pool with per-question computed priority.
    let pool = questions.map(q => {
      const base = Strength.baseId(q.id);
      const s = stats ? (stats[base] || stats[String(base)]) : null;
      const cls = (typeof Strength !== 'undefined')
        ? Strength.classify(s, { weakThreshold, mediumThreshold })
        : 'medium';
      const baseW = (typeof weights[cls] === 'number') ? weights[cls] : 1;
      const pri = (typeof Strength !== 'undefined')
        ? Strength.priority(s, baseW, noveltyK)
        : baseW;
      const total = s ? (s.total || 0) : 0;
      return { q, stat: s, cls, baseW, pri, total };
    });

    const result = [];

    // Safety: ensure a minimum number of new questions if available.
    const requestedNew = Math.max(0, Math.min(
      Math.floor(numQuestions * minNewRatio),
      pool.filter(x => x.total === 0).length
    ));

    function pickOne(fromArr) {
      const idx = _weightedPickIndex(fromArr, x => x.pri);
      if (idx < 0) return null;
      const picked = fromArr.splice(idx, 1)[0];
      return picked;
    }

    if (requestedNew > 0) {
      const newPool = pool.filter(x => x.total === 0);
      const restPool = pool.filter(x => x.total !== 0);
      for (let i = 0; i < requestedNew && newPool.length > 0; i++) {
        const p = pickOne(newPool);
        if (p) result.push(p.q);
      }
      // Remaining picks from combined pool.
      while (result.length < numQuestions && (newPool.length + restPool.length) > 0) {
        const combined = newPool.concat(restPool);
        const p = pickOne(combined);
        if (!p) break;
        result.push(p.q);
        // Keep arrays in sync
        const removeFrom = (p.total === 0) ? newPool : restPool;
        const idx = removeFrom.findIndex(x => x.q.id === p.q.id);
        if (idx >= 0) removeFrom.splice(idx, 1);
      }
      return result.slice(0, numQuestions);
    }

    // Main selection loop: weighted sampling without replacement.
    while (result.length < numQuestions && pool.length > 0) {
      const p = pickOne(pool);
      if (!p) break;
      result.push(p.q);
    }

    return result.slice(0, numQuestions);
  }

  return { select };
})();
