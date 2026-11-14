import { db, doc, setDoc, onSnapshot } from './firebase.js';

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
  friends: [],
  personalRecords: {},
  settings: { lang: 'tr', notifications: true },
  weightLog: [],
  workoutTemplates: [],
  aiChatHistory: [],
  restTimerPrefs: { default: 90 },
  weeklySummaryDismissed: null,
  streakShields: 0,
  weeklyXpLog: [],
};

import {
  simulatedFriends,
  generateSimulatedFeed,
  generateSimulatedGymRealPosts,
} from './data/simulatedData.js';

/** Firestore Timestamp | number | undefined → epoch ms */
function toMillis(ts) {
  if (ts == null) return 0;
  if (typeof ts === 'number') return ts;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  return 0;
}

function normalizeDocFromFirestore(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const o = { ...raw };
  o.updatedAt = toMillis(o.updatedAt);
  return o;
}

class Store {
  constructor() {
    this.data = this._loadCache();
    this.listeners = [];
    this.deviceId = getDeviceId();
    this._firestoreUnsub = null;
    this._bootstrapPushed = false;
    this._subscribeFirestore();
  }

  /**
   * localStorage: offline cache / cold start only — not authoritative.
   * Firestore document `users/{deviceId}` is the single source of truth when online.
   */
  _loadCache() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultData, ...parsed };
      }
    } catch (e) {
      console.error('Store cache load error:', e);
    }
    return { ...defaultData };
  }

  _persistCache() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  _cacheHasUserData(d) {
    if (!d) return false;
    if (d.user) return true;
    if ((d.workouts || []).length > 0) return true;
    if ((d.xp?.total || 0) > 0) return true;
    if ((d.badges || []).length > 0) return true;
    if (d.activeWorkout) return true;
    return false;
  }

  /**
   * Last-write-wins using monotonic `updatedAt` (epoch ms).
   * - remote.updatedAt > local → apply Firestore (other device / server newer)
   * - local.updatedAt > remote → push local (this session ahead, e.g. offline edits)
   * - tie → merge with snapshot fields as base
   */
  _applyConflictPolicy(remoteNormalized) {
    const localU = toMillis(this.data.updatedAt);
    const remoteU = toMillis(remoteNormalized.updatedAt);

    if (remoteU > localU) {
      this.data = { ...defaultData, ...remoteNormalized };
      this.data.updatedAt = remoteU;
      this._persistCache();
      this.notify();
      window.dispatchEvent(
        new CustomEvent('fitsync_sync', {
          detail: { source: 'firestore', conflict: false, strategy: 'last_write_wins' },
        }),
      );
      return;
    }

    if (localU > remoteU) {
      window.dispatchEvent(
        new CustomEvent('fitsync_conflict', {
          detail: {
            strategy: 'last_write_wins',
            winner: 'local',
            localUpdatedAt: localU,
            remoteUpdatedAt: remoteU,
          },
        }),
      );
      this._syncToFirebaseWithRetry(this.data, 3);
      return;
    }

    const merged = { ...defaultData, ...remoteNormalized };
    merged.updatedAt = remoteU;
    const prev = JSON.stringify(this.data);
    const next = JSON.stringify(merged);
    if (prev !== next) {
      this.data = merged;
      this._persistCache();
      this.notify();
    }
    window.dispatchEvent(
      new CustomEvent('fitsync_sync', {
        detail: { source: 'firestore', conflict: false, strategy: 'last_write_wins_tie' },
      }),
    );
  }

  _subscribeFirestore() {
    if (!db) return;

    const docRef = doc(db, 'users', this.deviceId);
    this._firestoreUnsub = onSnapshot(
      docRef,
      (snapshot) => {
        try {
          if (!snapshot.exists()) {
            if (this._cacheHasUserData(this.data) && !this._bootstrapPushed) {
              this._bootstrapPushed = true;
              this.data.updatedAt = Date.now();
              this._persistCache();
              this._syncToFirebaseWithRetry(this.data, 3);
            }
            return;
          }

          const remote = normalizeDocFromFirestore(snapshot.data());
          if (!remote) return;

          this._applyConflictPolicy(remote);
        } catch (e) {
          console.error('Firestore snapshot handler error:', e);
        }
      },
      (e) => {
        console.error('Firestore listener error:', e);
        window.dispatchEvent(new CustomEvent('fitsync_error', { detail: 'Firebase: ' + e.message }));
      },
    );
  }

  save() {
    try {
      this.data.updatedAt = Date.now();
      this._persistCache();
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
        window.dispatchEvent(
          new CustomEvent('fitsync_error', {
            detail: 'Veri buluta kaydedilemedi. Çevrimdışı önbellekte saklanıyor; bağlantı gelince yeniden denenecek.',
          }),
        );
      }
    }
  }

  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  notify() {
    this.listeners.forEach((fn) => fn(this.data));
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
  getUser() {
    return this.data.user;
  }
  setUser(user) {
    this.set('user', user);
  }
  isOnboarded() {
    return this.data.user !== null;
  }

  // Workouts
  getWorkouts() {
    return this.data.workouts || [];
  }
  getActiveWorkout() {
    return this.data.activeWorkout;
  }

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
      if ((this.data.streakShields || 0) > 0 && streak.current > 0) {
        this.data.streakShields -= 1;
        streak.current += 1;
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

    if (streak.current > 0 && streak.current % 7 === 0) {
      this.addStreakShield();
      this._shieldEarned = true;
    }
  }

  // XP
  addXP(amount) {
    const xp = this.data.xp;
    xp.total += amount;

    let levelXP = 0;
    let level = 1;
    while (levelXP + level * 100 <= xp.total) {
      levelXP += level * 100;
      level++;
    }
    xp.level = level;
    this.set('xp', xp);

    this._trackWeeklyXP(amount);

    return { total: xp.total, level, xpForNext: level * 100, xpInLevel: xp.total - levelXP };
  }

  _trackWeeklyXP(amount) {
    const weekId = this.getWeekId();
    const log = this.data.weeklyXpLog || [];
    const idx = log.findIndex((e) => e.weekId === weekId);
    if (idx >= 0) {
      log[idx].xp += amount;
    } else {
      log.push({ weekId, xp: amount });
    }
    if (log.length > 8) log.splice(0, log.length - 8);
    this.data.weeklyXpLog = log;
  }

  getWeeklyXP() {
    const weekId = this.getWeekId();
    const log = this.data.weeklyXpLog || [];
    const entry = log.find((e) => e.weekId === weekId);
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
  getEarnedBadges() {
    return this.data.badges || [];
  }
  getPinnedBadges() {
    return this.data.pinnedBadges || [];
  }

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
      pinned = pinned.filter((id) => id !== badgeId);
    } else if (pinned.length < 3) {
      pinned.push(badgeId);
    }
    this.set('pinnedBadges', pinned);
  }

  // GymReal
  getGymRealPosts() {
    return this.data.gymReal?.posts || [];
  }
  hasTodayGymReal() {
    const today = new Date().toDateString();
    return (this.data.gymReal?.posts || []).some((p) => new Date(p.timestamp).toDateString() === today);
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

  // Weight Log
  getWeightLog() {
    return this.data.weightLog || [];
  }
  addWeightEntry(weight) {
    const log = this.data.weightLog || [];
    const today = new Date().toDateString();
    const existingIdx = log.findIndex((e) => new Date(e.date).toDateString() === today);
    if (existingIdx >= 0) {
      log[existingIdx] = { date: Date.now(), weight };
    } else {
      log.push({ date: Date.now(), weight });
    }
    this.set('weightLog', log);
  }

  // Workout Templates
  getWorkoutTemplates() {
    return this.data.workoutTemplates || [];
  }
  saveWorkoutTemplate(template) {
    const templates = this.data.workoutTemplates || [];
    templates.push({ ...template, id: `tpl_${Date.now()}`, createdAt: Date.now() });
    this.set('workoutTemplates', templates);
  }
  deleteWorkoutTemplate(templateId) {
    const templates = (this.data.workoutTemplates || []).filter((t) => t.id !== templateId);
    this.set('workoutTemplates', templates);
  }

  // AI Chat History
  getAIChatHistory() {
    return this.data.aiChatHistory || [];
  }
  addAIChatMessage(message, isAi) {
    const history = this.data.aiChatHistory || [];
    history.push({ text: message, isAi, timestamp: Date.now() });
    if (history.length > 50) history.splice(0, history.length - 50);
    this.set('aiChatHistory', history);
  }
  clearAIChatHistory() {
    this.set('aiChatHistory', []);
  }

  // Rest Timer Preferences
  getRestTimerPrefs() {
    return this.data.restTimerPrefs || { default: 90 };
  }
  setRestTimerDefault(seconds) {
    this.update('restTimerPrefs', (p) => ({ ...p, default: seconds }));
  }

  // Weekly Summary
  getWeeklySummaryDismissed() {
    return this.data.weeklySummaryDismissed;
  }
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

    const workouts = (this.data.workouts || []).filter(
      (w) => w.startTime >= startOfLastWeek.getTime() && w.startTime < startOfThisWeek.getTime(),
    );

    let totalVolume = 0;
    let totalSets = 0;
    workouts.forEach((w) => {
      (w.exercises || []).forEach((ex) => {
        (ex.sets || []).forEach((s) => {
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

    workouts.forEach((w) => {
      (w.exercises || []).forEach((ex) => {
        (ex.sets || []).forEach((s) => {
          totalVolume += (s.weight || 0) * (s.reps || 0);
        });
      });
    });

    const earlyWorkout = workouts.some((w) => new Date(w.startTime).getHours() < 6);
    const lateWorkout = workouts.some((w) => new Date(w.startTime).getHours() >= 22);

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
    return posts.filter((p) => {
      const postDate = new Date(p.timestamp);
      return postDate >= startOfWeek && p.onTime;
    }).length;
  }

  getStreakShields() {
    return this.data.streakShields || 0;
  }
  addStreakShield() {
    this.data.streakShields = (this.data.streakShields || 0) + 1;
    this.save();
  }

  reset() {
    localStorage.removeItem(STORAGE_KEY);
    this.data = { ...defaultData };
    this.data.updatedAt = Date.now();
    this._bootstrapPushed = false;
    this.notify();

    if (db) {
      setDoc(doc(db, 'users', this.deviceId), { ...defaultData, updatedAt: Date.now() }).catch((e) =>
        console.error('Firebase reset error:', e),
      );
    }
  }
}

export const store = new Store();

export const getSimulatedFriends = () => simulatedFriends;
export const getSimulatedFeed = () => generateSimulatedFeed();
export const getSimulatedGymRealPosts = () => generateSimulatedGymRealPosts();
