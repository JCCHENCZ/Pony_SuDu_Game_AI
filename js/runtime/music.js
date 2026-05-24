let instance;

/**
 * 统一的音效管理器
 */
export default class Music {
  boomAudio = wx.createInnerAudioContext();

  constructor() {
    if (instance) return instance;
    instance = this;

    this.boomAudio.src = 'audio/boom.mp3';
  }

  playExplosion() {
    this.boomAudio.currentTime = 0;
    this.boomAudio.play();
  }
}
