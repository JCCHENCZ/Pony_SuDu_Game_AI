const STORAGE_KEY = 'pony_stamina';
const STORAGE_TIME_KEY = 'pony_stamina_time';
const MAX_STAMINA = 5;
const RECOVER_INTERVAL = 10 * 60 * 1000;

export default class StaminaManager {
  constructor() {
    this.load();
  }

  load() {
    let stored = wx.getStorageSync(STORAGE_KEY);
    const lastTime = wx.getStorageSync(STORAGE_TIME_KEY) || Date.now();

    if (stored === '' || stored === undefined || stored === null) {
      stored = MAX_STAMINA;
    }

    const elapsed = Date.now() - lastTime;
    const recovered = Math.floor(elapsed / RECOVER_INTERVAL);
    this.stamina = Math.min(MAX_STAMINA, Number(stored) + recovered);
    this.lastTime = lastTime + recovered * RECOVER_INTERVAL;

    this.save();
  }

  save() {
    wx.setStorageSync(STORAGE_KEY, this.stamina);
    wx.setStorageSync(STORAGE_TIME_KEY, this.lastTime);
  }

  get() {
    this.load();
    return this.stamina;
  }

  getMax() {
    return MAX_STAMINA;
  }

  consume() {
    this.load();
    if (this.stamina <= 0) return false;
    this.stamina--;
    this.lastTime = Date.now();
    this.save();
    return true;
  }

  remainingSeconds() {
    const elapsed = Date.now() - this.lastTime;
    const remaining = RECOVER_INTERVAL - elapsed;
    return Math.max(0, Math.ceil(remaining / 1000));
  }

  adRecover() {
    this.stamina = Math.min(MAX_STAMINA, this.stamina + 1);
    this.save();
  }
}
