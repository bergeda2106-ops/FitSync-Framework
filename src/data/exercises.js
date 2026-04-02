export const exercises = [
  // Göğüs / Chest
  { id: 'bench_press', name: { tr: 'Bench Press', en: 'Bench Press' }, category: 'chest', icon: '🏋️', muscles: ['pectoralis', 'triceps', 'deltoids'] },
  { id: 'incline_bench', name: { tr: 'İncline Bench Press', en: 'Incline Bench Press' }, category: 'chest', icon: '🏋️', muscles: ['upper_pectoralis', 'deltoids'] },
  { id: 'decline_bench', name: { tr: 'Decline Bench Press', en: 'Decline Bench Press' }, category: 'chest', icon: '🏋️', muscles: ['lower_pectoralis', 'triceps'] },
  { id: 'dumbbell_fly', name: { tr: 'Dumbbell Fly', en: 'Dumbbell Fly' }, category: 'chest', icon: '💪', muscles: ['pectoralis'] },
  { id: 'cable_crossover', name: { tr: 'Cable Crossover', en: 'Cable Crossover' }, category: 'chest', icon: '💪', muscles: ['pectoralis'] },
  { id: 'push_up', name: { tr: 'Şınav', en: 'Push Up' }, category: 'chest', icon: '🫸', muscles: ['pectoralis', 'triceps', 'deltoids'] },
  { id: 'chest_press_machine', name: { tr: 'Chest Press Makinesi', en: 'Chest Press Machine' }, category: 'chest', icon: '🏋️', muscles: ['pectoralis', 'triceps'] },
  { id: 'pec_deck', name: { tr: 'Pec Deck', en: 'Pec Deck' }, category: 'chest', icon: '💪', muscles: ['pectoralis'] },

  // Sırt / Back
  { id: 'deadlift', name: { tr: 'Deadlift', en: 'Deadlift' }, category: 'back', icon: '🏋️', muscles: ['back', 'glutes', 'hamstrings'] },
  { id: 'lat_pulldown', name: { tr: 'Lat Pulldown', en: 'Lat Pulldown' }, category: 'back', icon: '💪', muscles: ['latissimus', 'biceps'] },
  { id: 'barbell_row', name: { tr: 'Barbell Row', en: 'Barbell Row' }, category: 'back', icon: '🏋️', muscles: ['back', 'biceps'] },
  { id: 'seated_cable_row', name: { tr: 'Seated Cable Row', en: 'Seated Cable Row' }, category: 'back', icon: '💪', muscles: ['back', 'biceps'] },
  { id: 'pull_up', name: { tr: 'Barfiks', en: 'Pull Up' }, category: 'back', icon: '🫸', muscles: ['latissimus', 'biceps'] },
  { id: 't_bar_row', name: { tr: 'T-Bar Row', en: 'T-Bar Row' }, category: 'back', icon: '🏋️', muscles: ['back', 'biceps'] },
  { id: 'face_pull', name: { tr: 'Face Pull', en: 'Face Pull' }, category: 'back', icon: '💪', muscles: ['rear_deltoids', 'traps'] },
  { id: 'hyperextension', name: { tr: 'Hyperextension', en: 'Hyperextension' }, category: 'back', icon: '🏋️', muscles: ['lower_back', 'glutes'] },

  // Bacak / Legs
  { id: 'squat', name: { tr: 'Squat', en: 'Squat' }, category: 'legs', icon: '🦵', muscles: ['quadriceps', 'glutes', 'hamstrings'] },
  { id: 'leg_press', name: { tr: 'Leg Press', en: 'Leg Press' }, category: 'legs', icon: '🦵', muscles: ['quadriceps', 'glutes'] },
  { id: 'leg_extension', name: { tr: 'Leg Extension', en: 'Leg Extension' }, category: 'legs', icon: '🦵', muscles: ['quadriceps'] },
  { id: 'leg_curl', name: { tr: 'Leg Curl', en: 'Leg Curl' }, category: 'legs', icon: '🦵', muscles: ['hamstrings'] },
  { id: 'romanian_deadlift', name: { tr: 'Romanian Deadlift', en: 'Romanian Deadlift' }, category: 'legs', icon: '🏋️', muscles: ['hamstrings', 'glutes'] },
  { id: 'lunges', name: { tr: 'Lunge', en: 'Lunges' }, category: 'legs', icon: '🦵', muscles: ['quadriceps', 'glutes'] },
  { id: 'calf_raise', name: { tr: 'Calf Raise', en: 'Calf Raise' }, category: 'legs', icon: '🦵', muscles: ['calves'] },
  { id: 'bulgarian_split', name: { tr: 'Bulgarian Split Squat', en: 'Bulgarian Split Squat' }, category: 'legs', icon: '🦵', muscles: ['quadriceps', 'glutes'] },
  { id: 'hack_squat', name: { tr: 'Hack Squat', en: 'Hack Squat' }, category: 'legs', icon: '🦵', muscles: ['quadriceps', 'glutes'] },

  // Omuz / Shoulders
  { id: 'overhead_press', name: { tr: 'Overhead Press', en: 'Overhead Press' }, category: 'shoulders', icon: '💪', muscles: ['deltoids', 'triceps'] },
  { id: 'lateral_raise', name: { tr: 'Lateral Raise', en: 'Lateral Raise' }, category: 'shoulders', icon: '💪', muscles: ['lateral_deltoids'] },
  { id: 'front_raise', name: { tr: 'Front Raise', en: 'Front Raise' }, category: 'shoulders', icon: '💪', muscles: ['front_deltoids'] },
  { id: 'rear_delt_fly', name: { tr: 'Rear Delt Fly', en: 'Rear Delt Fly' }, category: 'shoulders', icon: '💪', muscles: ['rear_deltoids'] },
  { id: 'arnold_press', name: { tr: 'Arnold Press', en: 'Arnold Press' }, category: 'shoulders', icon: '💪', muscles: ['deltoids'] },
  { id: 'shrugs', name: { tr: 'Shrug', en: 'Shrugs' }, category: 'shoulders', icon: '💪', muscles: ['traps'] },
  { id: 'upright_row', name: { tr: 'Upright Row', en: 'Upright Row' }, category: 'shoulders', icon: '💪', muscles: ['deltoids', 'traps'] },

  // Kol / Arms
  { id: 'bicep_curl', name: { tr: 'Bicep Curl', en: 'Bicep Curl' }, category: 'arms', icon: '💪', muscles: ['biceps'] },
  { id: 'hammer_curl', name: { tr: 'Hammer Curl', en: 'Hammer Curl' }, category: 'arms', icon: '💪', muscles: ['biceps', 'brachialis'] },
  { id: 'tricep_pushdown', name: { tr: 'Tricep Pushdown', en: 'Tricep Pushdown' }, category: 'arms', icon: '💪', muscles: ['triceps'] },
  { id: 'skull_crusher', name: { tr: 'Skull Crusher', en: 'Skull Crusher' }, category: 'arms', icon: '💪', muscles: ['triceps'] },
  { id: 'preacher_curl', name: { tr: 'Preacher Curl', en: 'Preacher Curl' }, category: 'arms', icon: '💪', muscles: ['biceps'] },
  { id: 'tricep_dip', name: { tr: 'Tricep Dip', en: 'Tricep Dip' }, category: 'arms', icon: '💪', muscles: ['triceps', 'chest'] },
  { id: 'concentration_curl', name: { tr: 'Concentration Curl', en: 'Concentration Curl' }, category: 'arms', icon: '💪', muscles: ['biceps'] },
  { id: 'overhead_tricep', name: { tr: 'Overhead Tricep Extension', en: 'Overhead Tricep Extension' }, category: 'arms', icon: '💪', muscles: ['triceps'] },

  // Karın / Core
  { id: 'crunch', name: { tr: 'Crunch', en: 'Crunch' }, category: 'core', icon: '🧘', muscles: ['abs'] },
  { id: 'plank', name: { tr: 'Plank', en: 'Plank' }, category: 'core', icon: '🧘', muscles: ['abs', 'core'] },
  { id: 'leg_raise', name: { tr: 'Leg Raise', en: 'Leg Raise' }, category: 'core', icon: '🧘', muscles: ['lower_abs'] },
  { id: 'russian_twist', name: { tr: 'Russian Twist', en: 'Russian Twist' }, category: 'core', icon: '🧘', muscles: ['obliques'] },
  { id: 'ab_wheel', name: { tr: 'Ab Wheel Rollout', en: 'Ab Wheel Rollout' }, category: 'core', icon: '🧘', muscles: ['abs', 'core'] },
  { id: 'cable_crunch', name: { tr: 'Cable Crunch', en: 'Cable Crunch' }, category: 'core', icon: '🧘', muscles: ['abs'] },
  { id: 'mountain_climber', name: { tr: 'Mountain Climber', en: 'Mountain Climber' }, category: 'core', icon: '🧘', muscles: ['abs', 'cardio'] },

  // Kardiyo / Cardio
  { id: 'treadmill', name: { tr: 'Koşu Bandı', en: 'Treadmill' }, category: 'cardio', icon: '🏃', muscles: ['cardio', 'legs'] },
  { id: 'cycling', name: { tr: 'Bisiklet', en: 'Cycling' }, category: 'cardio', icon: '🚴', muscles: ['cardio', 'legs'] },
  { id: 'rowing', name: { tr: 'Kürek', en: 'Rowing' }, category: 'cardio', icon: '🚣', muscles: ['cardio', 'back'] },
  { id: 'elliptical', name: { tr: 'Eliptik', en: 'Elliptical' }, category: 'cardio', icon: '🏃', muscles: ['cardio', 'legs'] },
  { id: 'jump_rope', name: { tr: 'İp Atlama', en: 'Jump Rope' }, category: 'cardio', icon: '🏃', muscles: ['cardio', 'calves'] },
  { id: 'stair_climber', name: { tr: 'Merdiven Tırmanma', en: 'Stair Climber' }, category: 'cardio', icon: '🏃', muscles: ['cardio', 'legs', 'glutes'] },
  { id: 'swimming', name: { tr: 'Yüzme', en: 'Swimming' }, category: 'cardio', icon: '🏊', muscles: ['cardio', 'full_body'] },
];

export const categories = [
  { id: 'all', icon: '🔥' },
  { id: 'chest', icon: '🏋️' },
  { id: 'back', icon: '🔙' },
  { id: 'legs', icon: '🦵' },
  { id: 'shoulders', icon: '💪' },
  { id: 'arms', icon: '💪' },
  { id: 'core', icon: '🧘' },
  { id: 'cardio', icon: '🏃' },
];

export function getExercisesByCategory(categoryId) {
  if (categoryId === 'all') return exercises;
  return exercises.filter(e => e.category === categoryId);
}

export function getExerciseById(id) {
  return exercises.find(e => e.id === id);
}
