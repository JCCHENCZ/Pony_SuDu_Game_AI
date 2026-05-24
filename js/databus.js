import Pool from './base/pool';

let instance;

/**
 * 全局状态管理器
 * 管理游戏状态、动画和对象池
 */
export default class DataBus {
  animations = [];
  frame = 0;
  isGameOver = false;
  pool = new Pool();

  constructor() {
    if (instance) return instance;
    instance = this;
  }

  reset() {
    this.frame = 0;
    this.animations = [];
    this.isGameOver = false;
  }

  gameOver() {
    this.isGameOver = true;
  }
}
