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
  weightLog: [],
  workoutTemplates: [],
  aiChatHistory: [],
  restTimerPrefs: { default: 90 },
  weeklySummaryDismissed: null,
  streakShields: 0,        // 🛡️ Streak Shield sayısı
  weeklyXpLog: [],         // ⚡ Haftalık XP log [{weekId, xp}]
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
        if (cloudData.updatedAt && ((cloudData.updatedAt || 0) > (this.data.updatedAt || 0))) {
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
        this._syncToFirebaseWithRetry(this.data, 3);
      }
    } catch (e) {
      console.error('Store save error:', e);
    }
  }

  async _syncToFirebaseWithRetry(data, retriesLeft, delay = 1000) {
    try {
      await setDoc(doc(db, 'users', this.deviceId), data);
    } catch (e) {
      if (retriesLeft > 0) {
        console.warn(`Firebase write failed, retrying in ${delay}ms... (${retriesLeft} left)`);
        setTimeout(() => this._syncToFirebaseWithRetry(data, retriesLeft - 1, delay * 2), delay);
      } else {
        console.error('Firebase write error after retries:', e);
      }
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

  removeExerciseFromWorkout(exerciseIndex) {
    const workout = this.data.activeWorkout;
    if (!workout) return;
    workout.exercises.splice(exerciseIndex, 1);
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
      // Missed a day — check for streak shield
      if ((this.data.streakShields || 0) > 0 && streak.current > 0) {
        this.data.streakShields -= 1;
        streak.current += 1; // protected!
        this._shieldUsed = true;
      } else {
        streak.current = 1;
      }
    }

    if (streak.current > streak.best) {
      streak.best = streak.current;
    }

    streak.lastWorkoutDate = today;
    this.set('streak', streak);

    // Auto-award shield at 7-day streak milestones
    if (streak.current > 0 && streak.current % 7 === 0) {
      this.addStreakShield();
      this._shieldEarned = true;
    }
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

    // Track weekly XP
    this._trackWeeklyXP(amount);

    return { total: xp.total, level, xpForNext: level * 100, xpInLevel: xp.total - levelXP };
  }

  _trackWeeklyXP(amount) {
    const weekId = this.getWeekId();
    const log = this.data.weeklyXpLog || [];
    const idx = log.findIndex(e => e.weekId === weekId);
    if (idx >= 0) {
      log[idx].xp += amount;
    } else {
      log.push({ weekId, xp: amount });
    }
    // Keep only last 8 weeks
    if (log.length > 8) log.splice(0, log.length - 8);
    this.data.weeklyXpLog = log;
    // Note: save() called by caller via set()
  }

  getWeeklyXP() {
    const weekId = this.getWeekId();
    const log = this.data.weeklyXpLog || [];
    const entry = log.find(e => e.weekId === weekId);
    return entry ? entry.xp : 0;
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

  // Weight Log
  getWeightLog() { return this.data.weightLog || []; }
  addWeightEntry(weight) {
    const log = this.data.weightLog || [];
    const today = new Date().toDateString();
    // Replace if already logged today
    const existingIdx = log.findIndex(e => new Date(e.date).toDateString() === today);
    if (existingIdx >= 0) {
      log[existingIdx] = { date: Date.now(), weight };
    } else {
      log.push({ date: Date.now(), weight });
    }
    this.set('weightLog', log);
  }

  // Workout Templates
  getWorkoutTemplates() { return this.data.workoutTemplates || []; }
  saveWorkoutTemplate(template) {
    const templates = this.data.workoutTemplates || [];
    templates.push({ ...template, id: `tpl_${Date.now()}`, createdAt: Date.now() });
    this.set('workoutTemplates', templates);
  }
  deleteWorkoutTemplate(templateId) {
    const templates = (this.data.workoutTemplates || []).filter(t => t.id !== templateId);
    this.set('workoutTemplates', templates);
  }

  // AI Chat History
  getAIChatHistory() { return this.data.aiChatHistory || []; }
  addAIChatMessage(message, isAi) {
    const history = this.data.aiChatHistory || [];
    history.push({ text: message, isAi, timestamp: Date.now() });
    // Keep last 50 messages
    if (history.length > 50) history.splice(0, history.length - 50);
    this.set('aiChatHistory', history);
  }
  clearAIChatHistory() {
    this.set('aiChatHistory', []);
  }

  // Rest Timer Preferences
  getRestTimerPrefs() { return this.data.restTimerPrefs || { default: 90 }; }
  setRestTimerDefault(seconds) {
    this.update('restTimerPrefs', p => ({ ...p, default: seconds }));
  }

  // Weekly Summary
  getWeeklySummaryDismissed() { return this.data.weeklySummaryDismissed; }
  dismissWeeklySummary() {
    const weekId = this.getWeekId();
    this.set('weeklySummaryDismissed', weekId);
  }
  getWeekId() {
    return Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  }
  getLastWeekStats() {
    const now = new Date();
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);
    const startOfLastWeek = new Date(startOfThisWeek.getTime() - 7 * 86400000);

    const workouts = (this.data.workouts || []).filter(w =>
      w.startTime >= startOfLastWeek.getTime() && w.startTime < startOfThisWeek.getTime()
    );

    let totalVolume = 0;
    let totalSets = 0;
    workouts.forEach(w => {
      (w.exercises || []).forEach(ex => {
        (ex.sets || []).forEach(s => {
          totalVolume += (s.weight || 0) * (s.reps || 0);
          totalSets++;
        });
      });
    });

    return {
      workoutCount: workouts.length,
      totalVolume,
      totalSets,
    };
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
      gymRealOnTimeWeek: this.calculateGymRealOnTimeWeek(),
    };
  }

  calculateGymRealOnTimeWeek() {
    const posts = this.data.gymReal?.posts || [];
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return posts.filter(p => {
      const postDate = new Date(p.timestamp);
      return postDate >= startOfWeek && p.onTime;
    }).length;
  }

  // Streak Shield methods
  getStreakShields() { return this.data.streakShields || 0; }
  addStreakShield() {
    this.data.streakShields = (this.data.streakShields || 0) + 1;
    this.save();
  }

  // Reset
  reset() {
    localStorage.removeItem(STORAGE_KEY);
    this.data = { ...defaultData };
    this.notify();

    // Also clear Firebase data
    if (db) {
      setDoc(doc(db, 'users', this.deviceId), { ...defaultData, updatedAt: Date.now() })
        .catch(e => console.error("Firebase reset error:", e));
    }
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
