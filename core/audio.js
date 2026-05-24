var audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    try {
      audioCtx = wx.createWebAudioContext ? wx.createWebAudioContext() : (typeof AudioContext !== 'undefined' ? new AudioContext() : null);
    } catch (e) {
      audioCtx = null;
    }
  }
  return audioCtx;
}

function playTone(freq, duration, type, vol) {
  var ctx = getCtx();
  if (!ctx) return;
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  gain.gain.value = vol || 0.3;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration, vol) {
  var ctx = getCtx();
  if (!ctx) return;
  var bufferSize = ctx.sampleRate * duration;
  var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  var data = buffer.getChannelData(0);
  for (var i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
  }
  var source = ctx.createBufferSource();
  source.buffer = buffer;
  var gain = ctx.createGain();
  gain.gain.value = vol || 0.15;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

var soundEnabled = true;
var soundVolume = 60;

function loadSettings() {
  try {
    var saved = wx.getStorageSync('sound_settings');
    if (saved !== undefined && saved !== null && saved !== '') {
      if (saved.soundEnabled !== undefined) soundEnabled = saved.soundEnabled;
      if (saved.soundVolume !== undefined) soundVolume = saved.soundVolume;
    }
  } catch (e) {}
}

function saveSettings() {
  wx.setStorageSync('sound_settings', { soundEnabled: soundEnabled, soundVolume: soundVolume });
}

loadSettings();

var Audio = {
  get soundEnabled() { return soundEnabled; },
  set soundEnabled(v) { soundEnabled = v; saveSettings(); },
  get soundVolume() { return soundVolume; },
  set soundVolume(v) { soundVolume = Math.max(0, Math.min(100, v)); saveSettings(); },

  mark: function () {
    if (!soundEnabled) return;
    var vol = soundVolume / 100 * 0.3;
    playNoise(0.05, vol);
  },

  unmark: function () {
    if (!soundEnabled) return;
    var vol = soundVolume / 100 * 0.12;
    playNoise(0.03, vol);
  },

  correct: function () {
    if (!soundEnabled) return;
    var vol = soundVolume / 100 * 0.4;
    var ctx = getCtx();
    if (!ctx) return;
    var t = ctx.currentTime;
    [600, 750, 900].forEach(function (f, i) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.value = vol;
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2 + i * 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + i * 0.08);
      osc.stop(t + 0.25 + i * 0.08);
    });
  },

  wrong: function () {
    if (!soundEnabled) return;
    var vol = soundVolume / 100 * 0.35;
    playTone(160, 0.3, 'sawtooth', vol);
  },

  win: function () {
    if (!soundEnabled) return;
    var vol = soundVolume / 100 * 0.5;
    var ctx = getCtx();
    if (!ctx) return;
    var t = ctx.currentTime;
    [523, 659, 784, 1047].forEach(function (f, i) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.value = vol;
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35 + i * 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + i * 0.12);
      osc.stop(t + 0.4 + i * 0.12);
    });
  },

  fail: function () {
    if (!soundEnabled) return;
    var vol = soundVolume / 100 * 0.4;
    var ctx = getCtx();
    if (!ctx) return;
    var t = ctx.currentTime;
    [330, 262, 196].forEach(function (f, i) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.value = vol;
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3 + i * 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + i * 0.15);
      osc.stop(t + 0.35 + i * 0.15);
    });
  },

  button: function () {
    if (!soundEnabled) return;
    var vol = soundVolume / 100 * 0.1;
    playNoise(0.02, vol);
  },
};

export default Audio;
