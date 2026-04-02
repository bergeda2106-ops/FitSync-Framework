import { db, doc, setDoc, getDoc } from './firebase.js';

const STORAGE_KEY = 'fitsync_data';

function getDeviceId() {
  let id = localStorage.getItem('fitsync_device_id');
  if (!id) {
    id = 'device_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('fitsync_device_id', id);
  }
  return id;
}

const defaultData = {
  user: null,
  workouts: [],
  activeWorkout: null,
  streak: { current: 0, best: 0, lastWorkoutDate: null, freezesUsed: 0 },
  xp: { total: 0, level: 1 },
  badges: [],
  pinnedBadges: [],
  gymReal: { posts: [], todayPosted: false, streak: 0 },
  gym: { selectedGym: null, checkedIn: false, checkInTime: null },
  friends: [],
  personalRecords: {},
  settings: { lang: 'tr', notifications: true },
};

// Simulated friends data
const simulatedFriends = [
  { id: 'f1', name: 'Ahmet Yılmaz', avatar: '🧔', level: 12, xp: 4800, streak: 15 },
  { id: 'f2', name: 'Ayşe Demir', avatar: '👩', level: 8, xp: 3200, streak: 7 },
  { id: 'f3', name: 'Mehmet Kaya', avatar: '👨', level: 22, xp: 9600, streak: 45 },
  { id: 'f4', name: 'Zeynep Çelik', avatar: '👩‍🦰', level: 15, xp: 6100, streak: 23 },
  { id: 'f5', name: 'Can Öztürk', avatar: '🧑', level: 5, xp: 1900, streak: 3 },
  { id: 'f6', name: 'Elif Arslan', avatar: '👱‍♀️', level: 18, xp: 7400, streak: 31 },
  { id: 'f7', name: 'Burak Koç', avatar: '👨‍🦱', level: 10, xp: 4100, streak: 12 },
  { id: 'f8', name: 'Selin Yıldız', avatar: '👩‍🦱', level: 6, xp: 2200, streak: 5 },
];

// Simulated social feed
function generateSimulatedFeed() {
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

// Simulated gym members
const simulatedGymMembers = [
  { ...simulatedFriends[0], status: 'working_out', exercise: 'Bench Press', since: '14:30' },
  { ...simulatedFriends[2], status: 'working_out', exercise: 'Squat', since: '15:00' },
  { ...simulatedFriends[3], status: 'resting', exercise: 'Deadlift', since: '14:45' },
  { ...simulatedFriends[6], status: 'working_out', exercise: 'Lat Pulldown', since: '15:15' },
];

// Simulated gyms
const simulatedGyms = [
  { id: 'g1', name: 'FitLife Gym', address: 'Kadıköy, İstanbul', members: 342, rating: 4.7 },
  { id: 'g2', name: 'PowerHouse Fitness', address: 'Beşiktaş, İstanbul', members: 518, rating: 4.5 },
  { id: 'g3', name: 'Iron Paradise', address: 'Bakırköy, İstanbul', members: 275, rating: 4.8 },
  { id: 'g4', name: 'GoldGym Training Center', address: 'Ataşehir, İstanbul', members: 410, rating: 4.6 },
  { id: 'g5', name: 'Atlas Spor Salonu', address: 'Üsküdar, İstanbul', members: 198, rating: 4.4 },
];

// Simulated GymReal posts
function generateSimulatedGymRealPosts() {
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

// Simulated leaderboard
function generateLeaderboard(userId, userName) {
  const board = simulatedFriends.map(f => ({
    id: f.id,
    name: f.name,
    avatar: f.avatar,
    xp: f.xp + Math.floor(Math.random() * 500),
    level: f.level,
    workoutsThisWeek: Math.floor(Math.random() * 6) + 1,
  }));

  if (userId) {
    const data = load();
    board.push({
      id: 'self',
      name: userName || 'Sen',
      avatar: '🏋️',
      xp: data.xp.total,
      level: data.xp.level,
      workoutsThisWeek: getWorkoutsThisWeek().length,
      isSelf: true,
    });
  }

  board.sort((a, b) => b.xp - a.xp);
  return board.map((entry, i) => ({ ...entry, rank: i + 1 }));
}

// Simulated buddy requests
const simulatedBuddyRequests = [
  { user: simulatedFriends[1], type: 'heavy', message: 'Ağır gireceğim, spotter lazım 🏋️' },
  { user: simulatedFriends[4], type: 'cardio', message: 'Beraber kardiyo yapalım 🏃' },
];

class Store {
  constructor() {
    this.data = this.load();
    this.listeners = [];
    this.deviceId = getDeviceId();
    this.syncFromFirebase();
  }

  async syncFromFirebase() {
    if (!db) return;
    try {
      const docRef = doc(db, 'users', this.deviceId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const cloudData = docSnap.data();
        if (cloudData.updatedAt && (!this.data.updatedAt || cloudData.updatedAt > this.data.updatedAt)) {
          this.data = { ...defaultData, ...cloudData };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
          this.notify();
        }
      }
    } catch (e) {
      console.error("Firebase sync error:", e);
    }
  }

  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultData, ...parsed };
      }
    } catch (e) {
      console.error('Store load error:', e);
    }
    return { ...defaultData };
  }

  save() {
    try {
      this.data.updatedAt = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      this.notify();

      if (db) {
        setDoc(doc(db, 'users', this.deviceId), this.data).catch(e => console.error("Firebase write error:", e));
      }
    } catch (e) {
      console.error('Store save error:', e);
    }
  }

  subscribe(fn) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  notify() {
    this.listeners.forEach(fn => fn(this.data));
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    this.data[key] = value;
    this.save();
  }

  update(key, updater) {
    this.data[key] = updater(this.data[key]);
    this.save();
  }

  // User
  getUser() { return this.data.user; }
  setUser(user) { this.set('user', user); }
  isOnboarded() { return this.data.user !== null; }

  // Workouts
  getWorkouts() { return this.data.workouts || []; }
  getActiveWorkout() { return this.data.activeWorkout; }

  startWorkout() {
    const workout = {
      id: `w_${Date.now()}`,
      startTime: Date.now(),
      exercises: [],
      completed: false,
    };
    this.set('activeWorkout', workout);
    return workout;
  }

  addExerciseToWorkout(exerciseId) {
    const workout = this.data.activeWorkout;
    if (!workout) return;
    workout.exercises.push({
      exerciseId,
      sets: [],
    });
    this.set('activeWorkout', workout);
  }

  addSetToExercise(exerciseIndex, set) {
    const workout = this.data.activeWorkout;
    if (!workout || !workout.exercises[exerciseIndex]) return;
    workout.exercises[exerciseIndex].sets.push({
      reps: set.reps || 0,
      weight: set.weight || 0,
      completed: true,
      timestamp: Date.now(),
    });
    this.set('activeWorkout', workout);
    return workout.exercises[exerciseIndex].sets.length;
  }

  removeSetFromExercise(exerciseIndex, setIndex) {
    const workout = this.data.activeWorkout;
    if (!workout || !workout.exercises[exerciseIndex]) return;
    workout.exercises[exerciseIndex].sets.splice(setIndex, 1);
    this.set('activeWorkout', workout);
  }

  finishWorkout() {
    const workout = this.data.activeWorkout;
    if (!workout) return null;
    workout.endTime = Date.now();
    workout.completed = true;
    workout.duration = workout.endTime - workout.startTime;

    const workouts = [...this.data.workouts, workout];
    this.data.workouts = workouts;
    this.data.activeWorkout = null;

    // Update streak
    this.updateStreak();

    this.save();
    return workout;
  }

  // Streak
  updateStreak() {
    const today = new Date().toDateString();
    const streak = this.data.streak;

    if (streak.lastWorkoutDate === today) return;

    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (streak.lastWorkoutDate === yesterday || !streak.lastWorkoutDate) {
      streak.current += 1;
    } else {
      streak.current = 1;
    }

    if (streak.current > streak.best) {
      streak.best = streak.current;
    }

    streak.lastWorkoutDate = today;
    this.set('streak', streak);
  }

  // XP
  addXP(amount) {
    const xp = this.data.xp;
    xp.total += amount;

    // Level calculation: each level = level * 100 XP
    let levelXP = 0;
    let level = 1;
    while (levelXP + level * 100 <= xp.total) {
      levelXP += level * 100;
      level++;
    }
    xp.level = level;
    this.set('xp', xp);
    return { total: xp.total, level, xpForNext: level * 100, xpInLevel: xp.total - levelXP };
  }

  getXPInfo() {
    const xp = this.data.xp;
    let levelXP = 0;
    let level = 1;
    while (levelXP + level * 100 <= xp.total) {
      levelXP += level * 100;
      level++;
    }
    return {
      total: xp.total,
      level,
      xpForNext: level * 100,
      xpInLevel: xp.total - levelXP,
      progress: (xp.total - levelXP) / (level * 100),
    };
  }

  // Personal Records
  checkPR(exerciseId, weight) {
    const prs = this.data.personalRecords || {};
    const currentPR = prs[exerciseId] || 0;
    if (weight > currentPR) {
      prs[exerciseId] = weight;
      this.set('personalRecords', prs);
      return { isNewPR: true, previous: currentPR, current: weight };
    }
    return { isNewPR: false, current: currentPR };
  }

  // Badges
  getEarnedBadges() { return this.data.badges || []; }
  getPinnedBadges() { return this.data.pinnedBadges || []; }

  earnBadge(badgeId) {
    const badges = this.data.badges || [];
    if (!badges.includes(badgeId)) {
      badges.push(badgeId);
      this.set('badges', badges);
    }
  }

  togglePinBadge(badgeId) {
    let pinned = this.data.pinnedBadges || [];
    if (pinned.includes(badgeId)) {
      pinned = pinned.filter(id => id !== badgeId);
    } else if (pinned.length < 3) {
      pinned.push(badgeId);
    }
    this.set('pinnedBadges', pinned);
  }

  // GymReal
  getGymRealPosts() { return this.data.gymReal?.posts || []; }
  hasTodayGymReal() {
    const today = new Date().toDateString();
    return (this.data.gymReal?.posts || []).some(p =>
      new Date(p.timestamp).toDateString() === today
    );
  }

  addGymRealPost(post) {
    const gymReal = this.data.gymReal || { posts: [], streak: 0 };
    gymReal.posts.unshift({
      ...post,
      id: `mygr_${Date.now()}`,
      timestamp: Date.now(),
    });
    gymReal.todayPosted = true;
    this.set('gymReal', gymReal);
  }

  // Gym
  getSelectedGym() { return this.data.gym?.selectedGym; }
  isCheckedIn() { return this.data.gym?.checkedIn || false; }

  selectGym(gym) {
    this.update('gym', g => ({ ...g, selectedGym: gym }));
  }

  checkIn() {
    this.update('gym', g => ({ ...g, checkedIn: true, checkInTime: Date.now() }));
  }

  checkOut() {
    this.update('gym', g => ({ ...g, checkedIn: false, checkInTime: null }));
  }

  // Stats helpers
  getStats() {
    const workouts = this.data.workouts || [];
    let totalVolume = 0;
    let totalPRs = Object.keys(this.data.personalRecords || {}).length;
    let benchPR = (this.data.personalRecords || {}).bench_press || 0;

    workouts.forEach(w => {
      (w.exercises || []).forEach(ex => {
        (ex.sets || []).forEach(s => {
          totalVolume += (s.weight || 0) * (s.reps || 0);
        });
      });
    });

    const hour = new Date().getHours();
    const earlyWorkout = workouts.some(w => new Date(w.startTime).getHours() < 6);
    const lateWorkout = workouts.some(w => new Date(w.startTime).getHours() >= 22);

    return {
      totalWorkouts: workouts.length,
      totalVolume,
      totalPRs,
      benchPR,
      bestStreak: this.data.streak.best,
      currentStreak: this.data.streak.current,
      earlyWorkout,
      lateWorkout,
      gymRealOnTimeWeek: 0,
    };
  }

  // Reset
  reset() {
    localStorage.removeItem(STORAGE_KEY);
    this.data = { ...defaultData };
    this.notify();
  }
}

// Helper functions
function load() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaultData, ...JSON.parse(saved) } : { ...defaultData };
  } catch { return { ...defaultData }; }
}

function getWorkoutsThisWeek() {
  const data = load();
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return (data.workouts || []).filter(w => w.startTime >= startOfWeek.getTime());
}

// Singleton
export const store = new Store();

// Export simulated data getters
export const getSimulatedFriends = () => simulatedFriends;
export const getSimulatedFeed = () => generateSimulatedFeed();
export const getSimulatedGymMembers = () => simulatedGymMembers;
export const getSimulatedGyms = () => simulatedGyms;
export const getSimulatedGymRealPosts = () => generateSimulatedGymRealPosts();
export const getSimulatedBuddyRequests = () => simulatedBuddyRequests;
export const getLeaderboard = (userId, userName) => generateLeaderboard(userId, userName);
