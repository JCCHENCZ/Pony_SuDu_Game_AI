import { SCREEN_WIDTH, SCREEN_HEIGHT, SCREEN_SCALE } from '../render';

var S = SCREEN_SCALE;

export default class LoadingRenderer {
  constructor() {
    this.startTime = 0;
  }

  render(ctx) {
    if (!this.startTime) this.startTime = Date.now();

    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.fillStyle = '#f1f2f4';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    var cx = SCREEN_WIDTH / 2;
    var cy = SCREEN_HEIGHT / 2;

    ctx.font = Math.round(42 * S) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐴', cx, cy - Math.round(32 * S));

    ctx.fillStyle = '#4A3728';
    ctx.font = 'bold ' + Math.round(18 * S) + 'px Arial';
    ctx.fillText('生成谜题中', cx, cy + Math.round(16 * S));

    var elapsed = Date.now() - this.startTime;
    var dots = (Math.floor(elapsed / 400) % 4);
    var dotStr = '';
    for (var i = 0; i < dots; i++) dotStr += '.';
    ctx.fillText(dotStr, cx, cy + Math.round(44 * S));

    ctx.fillStyle = '#aaa';
    ctx.font = Math.round(11 * S) + 'px Arial';
    ctx.fillText('首次生成可能需要几秒', cx, cy + Math.round(72 * S));
  }

  reset() {
    this.startTime = 0;
  }
}
