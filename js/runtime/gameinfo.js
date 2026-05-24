import Emitter from '../libs/tinyemitter';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

/**
 * 游戏 UI 渲染类（参考用，待后续搭建时改造）
 * 负责在 Canvas 上绘制分数、游戏结束界面、处理触摸事件
 */
export default class GameInfo extends Emitter {
  constructor() {
    super();

    this.btnArea = {
      startX: SCREEN_WIDTH / 2 - 40,
      startY: SCREEN_HEIGHT / 2 - 100 + 180,
      endX: SCREEN_WIDTH / 2 + 50,
      endY: SCREEN_HEIGHT / 2 - 100 + 255,
    };

    wx.onTouchStart(this.touchEventHandler.bind(this));
  }

  setFont(ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
  }

  render(ctx) {
    if (GameGlobal.databus.isGameOver) {
      this.renderGameOver(ctx);
    }
  }

  renderGameOver(ctx) {
    this.setFont(ctx);
    ctx.fillText('游戏结束', SCREEN_WIDTH / 2 - 40, SCREEN_HEIGHT / 2 - 50);
    ctx.fillText(
      '重新开始',
      SCREEN_WIDTH / 2 - 40,
      SCREEN_HEIGHT / 2 + 10
    );
  }

  touchEventHandler(event) {
    const { clientX, clientY } = event.touches[0];

    if (GameGlobal.databus.isGameOver) {
      if (
        clientX >= this.btnArea.startX &&
        clientX <= this.btnArea.endX &&
        clientY >= this.btnArea.startY &&
        clientY <= this.btnArea.endY
      ) {
        this.emit('restart');
      }
    }
  }
}
