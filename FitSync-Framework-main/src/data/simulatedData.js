// Simulated Social Data

export const simulatedFriends = [
  { id: 'f1', name: 'Ahmet Yılmaz', avatar: '🧔', level: 12, xp: 4800, streak: 15 },
  { id: 'f2', name: 'Ayşe Demir', avatar: '👩', level: 8, xp: 3200, streak: 7 },
  { id: 'f3', name: 'Mehmet Kaya', avatar: '👨', level: 22, xp: 9600, streak: 45 },
  { id: 'f4', name: 'Zeynep Çelik', avatar: '👩‍🦰', level: 15, xp: 6100, streak: 23 },
  { id: 'f5', name: 'Can Öztürk', avatar: '🧑', level: 5, xp: 1900, streak: 3 },
  { id: 'f6', name: 'Elif Arslan', avatar: '👱‍♀️', level: 18, xp: 7400, streak: 31 },
  { id: 'f7', name: 'Burak Koç', avatar: '👨‍🦱', level: 10, xp: 4100, streak: 12 },
  { id: 'f8', name: 'Selin Yıldız', avatar: '👩‍🦱', level: 6, xp: 2200, streak: 5 },
];

export function generateSimulatedFeed() {
  const actions = [
    { type: 'workout', textKey: 'feedWorkout', detail: '5 egzersiz • 45 dk' },
    { type: 'pr', textKey: 'feedPR', detail: 'Bench Press: 100kg' },
    { type: 'gymreal', textKey: 'feedGymReal', detail: '' },
    { type: 'levelup', textKey: 'feedLevelUp', detail: 'Seviye 15' },
    { type: 'badge', textKey: 'feedBadge', detail: '🔥 Haftalık Seri' },
    { type: 'workout', textKey: 'feedWorkout', detail: '3 egzersiz • 30 dk' },
    { type: 'workout', textKey: 'feedWorkout', detail: '6 egzersiz • 60 dk' },
    { type: 'pr', textKey: 'feedPR', detail: 'Squat: 140kg' },
    { type: 'gymreal', textKey: 'feedGymReal', detail: '' },
  ];

  return actions.map((action, i) => ({
    id: `feed_${i}`,
    user: simulatedFriends[i % simulatedFriends.length],
    ...action,
    timestamp: Date.now() - (i * 3600000 * (1 + Math.random() * 2)),
    likes: Math.floor(Math.random() * 20) + 1,
    liked: false,
  }));
}

export function generateSimulatedGymRealPosts() {
  return simulatedFriends.slice(0, 5).map((friend, i) => ({
    id: `gr_${i}`,
    user: friend,
    exercise: ['Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Lat Pulldown'][i],
    weight: [80, 120, 140, 60, 70][i],
    set: [3, 4, 3, 3, 4][i],
    timestamp: Date.now() - (i * 1800000),
    onTime: i < 3,
    likes: Math.floor(Math.random() * 15) + 3,
    liked: false,
  }));
}
