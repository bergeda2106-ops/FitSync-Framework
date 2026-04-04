/**
 * Smart Warm-up Algorithm
 * Calculates optimal warm-up sets based on target working weight.
 * Protocol: %40 x 10 → %60 x 6 → %80 x 3
 */

export const WARMUP_THRESHOLDS = {
  SKIP_BELOW: 20,   // kg — don't suggest warm-up for very light weights
  LIGHT_BELOW: 40,  // kg — only 1 warm-up set for light weights
};

/**
 * Generate warm-up sets for a given target weight.
 * @param {number} targetWeight - Working weight in kg
 * @param {number} [barWeight=20] - Bar weight, default 20kg Olympic bar
 * @returns {Array<{weight: number, reps: number, label: string}>}
 */
export function calculateWarmupSets(targetWeight, barWeight = 20) {
  if (!targetWeight || targetWeight <= WARMUP_THRESHOLDS.SKIP_BELOW) return [];

  // Round to nearest 2.5kg for practical plate loading
  const round = (w) => Math.max(barWeight, Math.round(w / 2.5) * 2.5);

  if (targetWeight < WARMUP_THRESHOLDS.LIGHT_BELOW) {
    // Light weight: just 1 set at 60%
    return [
      { weight: round(targetWeight * 0.6), reps: 8, label: '60%', intensity: 'low' },
    ];
  }

  const sets = [
    { weight: round(targetWeight * 0.4), reps: 10, label: '40%', intensity: 'low' },
    { weight: round(targetWeight * 0.6), reps: 6, label: '60%', intensity: 'medium' },
    { weight: round(targetWeight * 0.8), reps: 3, label: '80%', intensity: 'high' },
  ];

  // Remove duplicates (e.g. if 40% and 60% round to same weight)
  const unique = [];
  sets.forEach(s => {
    if (!unique.find(u => u.weight === s.weight)) unique.push(s);
  });

  return unique;
}

/**
 * Get total warm-up time estimate (seconds).
 * Assumes ~45 sec per set + 60 sec rest between.
 */
export function estimateWarmupTime(sets) {
  if (!sets.length) return 0;
  return sets.length * 45 + (sets.length - 1) * 60;
}

/**
 * Get warm-up suggestion label for UI.
 */
export function getWarmupSuggestionText(targetWeight, lang = 'tr') {
  if (!targetWeight || targetWeight <= WARMUP_THRESHOLDS.SKIP_BELOW) {
    return lang === 'tr'
      ? 'Bu ağırlık için ısınma gerekmiyor.'
      : 'No warm-up needed for this weight.';
  }
  const sets = calculateWarmupSets(targetWeight);
  const timeMin = Math.ceil(estimateWarmupTime(sets) / 60);
  return lang === 'tr'
    ? `${sets.length} set ısınma önerilir (~${timeMin} dk)`
    : `${sets.length} warm-up sets recommended (~${timeMin} min)`;
}
