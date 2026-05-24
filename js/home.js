import { SCREEN_WIDTH, SCREEN_HEIGHT, SCREEN_SCALE } from './render';

const S = SCREEN_SCALE;

export default class HomeRenderer {
  constructor(staminaMgr) {
    this.staminaMgr = staminaMgr;
  }

  render(ctx, stamina) {
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.fillStyle = '#f1f2f4';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    const cy = SCREEN_HEIGHT / 2;

    ctx.fillStyle = '#4A3728';
    ctx.font = 'bold ' + Math.round(36 * S) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('🐴 小马谜题', SCREEN_WIDTH / 2, cy - Math.round(80 * S));

    ctx.font = Math.round(14 * S) + 'px Arial';
    ctx.fillStyle = '#888';
    ctx.textBaseline = 'top';
    ctx.fillText('推理与运气并存的小马数独', SCREEN_WIDTH / 2, cy - Math.round(72 * S));

    const maxSta = this.staminaMgr.getMax();
    const secLeft = this.staminaMgr.remainingSeconds();

    ctx.fillStyle = '#333';
    ctx.font = 'bold ' + Math.round(18 * S) + 'px Arial';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`体力 ${stamina}/${maxSta}`, SCREEN_WIDTH / 2, cy - Math.round(10 * S));

    ctx.textBaseline = 'top';
    if (stamina < maxSta) {
      const m = Math.floor(secLeft / 60);
      const s = secLeft % 60;
      ctx.font = Math.round(13 * S) + 'px Arial';
      ctx.fillStyle = '#999';
      ctx.fillText(
        `下次恢复 ${m}:${s.toString().padStart(2, '0')}`,
        SCREEN_WIDTH / 2,
        cy - Math.round(8 * S)
      );
    }

    this.drawBtn(ctx, '开始游戏', SCREEN_WIDTH / 2, cy + Math.round(40 * S), '#5C6BC0', 'start');
    this.drawBtn(ctx, '广告恢复体力', SCREEN_WIDTH / 2, cy + Math.round(92 * S), '#BDBDBD', 'ad');
    this.drawBtn(ctx, '📖 玩法说明', SCREEN_WIDTH / 2, cy + Math.round(144 * S), 'rgba(120,120,120,0.6)', 'help');
    this.drawBtn(ctx, '设置', SCREEN_WIDTH / 2, cy + Math.round(196 * S), 'rgba(120,120,120,0.5)', 'settings');
  }

  drawBtn(ctx, text, cx, top, color, id) {
    const bw = Math.round(180 * S);
    const bh = Math.round(42 * S);
    const x = cx - bw / 2;
    const y = top;

    ctx.fillStyle = color;
    this.roundRect(ctx, x, y, bw, bh, Math.round(10 * S));

    ctx.fillStyle = '#fff';
    ctx.font = 'bold ' + Math.round(16 * S) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, y + bh / 2);

    this[`${id}Rect`] = { x, y, w: bw, h: bh };
  }

  getHitTarget(clientX, clientY) {
    const targets = ['start', 'ad', 'help', 'settings'];
    for (let i = 0; i < targets.length; i++) {
      const r = this[`${targets[i]}Rect`];
      if (r && clientX >= r.x && clientX <= r.x + r.w && clientY >= r.y && clientY <= r.y + r.h) {
        return targets[i];
      }
    }
    return null;
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.fill();
  }
}
