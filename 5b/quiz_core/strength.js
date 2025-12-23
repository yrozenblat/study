// Shared strength / prioritization helpers for quiz selection + stats.
// Exposes global `Strength`.

const Strength = (() => {
  function _total(stat) {
    return stat ? (stat.total || 0) : 0;
  }

  function _correct(stat) {
    return stat ? (stat.correct || 0) : 0;
  }

  /**
   * Classify a question based on performance.
   * Returns one of: 'new' | 'weak' | 'medium' | 'strong'
   */
  function classify(stat, opts) {
    const total = _total(stat);
    if (total === 0) return 'new';

    const correct = _correct(stat);
    const ratio = total ? (correct / total) : 0;

    const weakThreshold = (opts && typeof opts.weakThreshold === 'number') ? opts.weakThreshold : 0.60;
    const mediumThreshold = (opts && typeof opts.mediumThreshold === 'number') ? opts.mediumThreshold : 0.85;

    if (ratio < weakThreshold) return 'weak';
    if (ratio < mediumThreshold) return 'medium';
    return 'strong';
  }

  /**
   * Compatibility label: maps 'new' -> 'rare' for older UI/CSS.
   */
  function classifyLegacy(stat, opts) {
    const c = classify(stat, opts);
    return (c === 'new') ? 'rare' : c;
  }

  /**
   * Novelty boost for questions asked fewer times.
   * total=0 -> 1, total=1 -> 0.5, total=4 -> 0.2...
   */
  function noveltyBoost(total) {
    const t = (typeof total === 'number') ? total : 0;
    return 1 / (1 + Math.max(0, t));
  }

  /**
   * Compute a priority score for weighted random selection.
   * Higher score => more likely to be selected.
   */
  function priority(stat, baseWeight, k) {
    const total = _total(stat);
    const K = (typeof k === 'number') ? k : 1.5;
    const bw = (typeof baseWeight === 'number') ? baseWeight : 1;
    return bw * (1 + K * noveltyBoost(total));
  }

  return {
    classify,
    classifyLegacy,
    noveltyBoost,
    priority
  };
})();
