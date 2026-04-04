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
    { type: 'checkin', textKey: 'feedCheckedIn', detail: 'FitLife Gym' },
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

export const simulatedGymMembers = [
  { ...simulatedFriends[0], status: 'working_out', exercise: 'Bench Press', since: '14:30' },
  { ...simulatedFriends[2], status: 'working_out', exercise: 'Squat', since: '15:00' },
  { ...simulatedFriends[3], status: 'resting', exercise: 'Deadlift', since: '14:45' },
  { ...simulatedFriends[6], status: 'working_out', exercise: 'Lat Pulldown', since: '15:15' },
];

export const simulatedGyms = [
  { id: 'g1', name: 'FitLife Gym', address: 'Kadıköy, İstanbul', members: 342, rating: 4.7 },
  { id: 'g2', name: 'PowerHouse Fitness', address: 'Beşiktaş, İstanbul', members: 518, rating: 4.5 },
  { id: 'g3', name: 'Iron Paradise', address: 'Bakırköy, İstanbul', members: 275, rating: 4.8 },
  { id: 'g4', name: 'GoldGym Training Center', address: 'Ataşehir, İstanbul', members: 410, rating: 4.6 },
  { id: 'g5', name: 'Atlas Spor Salonu', address: 'Üsküdar, İstanbul', members: 198, rating: 4.4 },
];

export function generateSimulatedGymRealPosts() {
  return simulatedFriends.slice(0, 5).map((friend, i) => ({
    id: `gr_${i}`,
    user: friend,
    exercise: ['Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Lat Pulldown'][i],
    weight: [80, 120, 140, 60, 70][i],
    set: [3, 4, 3, 3, 4][i],
    gym: simulatedGyms[i % simulatedGyms.length].name,
    timestamp: Date.now() - (i * 1800000),
    onTime: i < 3,
    likes: Math.floor(Math.random() * 15) + 3,
    liked: false,
  }));
}

export function generateLeaderboard(userId, userName, userTotalXp, userLevel, userWorkoutsThisWeekCount) {
  const board = simulatedFriends.map(f => ({
    id: f.id,
    name: f.name,
    avatar: f.avatar,
    xp: f.xp + Math.floor(Math.random() * 500),
    level: f.level,
    workoutsThisWeek: Math.floor(Math.random() * 6) + 1,
  }));

  if (userId && userTotalXp !== undefined) {
    board.push({
      id: 'self',
      name: userName || 'Sen',
      avatar: '🏋️',
      xp: userTotalXp,
      level: userLevel,
      workoutsThisWeek: userWorkoutsThisWeekCount || 0,
      isSelf: true,
    });
  }

  board.sort((a, b) => b.xp - a.xp);
  return board.map((entry, i) => ({ ...entry, rank: i + 1 }));
}

export const simulatedBuddyRequests = [
  { user: simulatedFriends[1], type: 'heavy', message: 'Ağır gireceğim, spotter lazım 🏋️' },
  { user: simulatedFriends[4], type: 'cardio', message: 'Beraber kardiyo yapalım 🏃' },
];
