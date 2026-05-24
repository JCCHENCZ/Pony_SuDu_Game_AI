import { SCREEN_WIDTH, SCREEN_HEIGHT, SCREEN_SCALE } from '../render';

const S = SCREEN_SCALE;
const CARD_W = SCREEN_WIDTH - Math.round(40 * S);
const CARD_X = Math.round(20 * S);

export default class ResultRenderer {
  constructor() {
    this.btnRects = [];
  }

  render(ctx, data) {
    var y = SCREEN_HEIGHT / 2 - Math.round(150 * S);

    ctx.fillStyle = '#f1f2f4';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    var isWin = data.isWin;
    var foundPonies = data.foundPonies;
    var totalPonies = data.totalPonies;
    var wrongCount = data.wrongCount;
    var elapsed = data.elapsed;
    var remainingLives = data.remainingLives;
    var maxLives = data.maxLives;
    var label = data.label;

    ctx.fillStyle = '#fff';
    var headerH = Math.round(80 * S);
    var bodyH = Math.round(180 * S);
    var totalCardH = headerH + bodyH;
    var cardY = y;
    const r14 = Math.round(14 * S);
    this.roundRect(ctx, CARD_X, cardY, CARD_W, headerH, { tl: r14, tr: r14, bl: 0, br: 0 });

    ctx.fillStyle = isWin ? '#43A047' : '#E53935';
    ctx.font = 'bold ' + Math.round(30 * S) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      isWin ? '🎉 恭喜通关！' : '💔 生命耗尽！',
      SCREEN_WIDTH / 2,
      cardY + headerH / 2
    );

    ctx.fillStyle = '#f9f9f9';
    this.roundRect(ctx, CARD_X, cardY + headerH, CARD_W, bodyH, { tl: 0, tr: 0, bl: r14, br: r14 });

    ctx.fillStyle = '#888';
    ctx.font = 'bold ' + Math.round(13 * S) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, SCREEN_WIDTH / 2, cardY + headerH + Math.round(22 * S));

    var leftX = CARD_X + Math.round(24 * S);
    var rightX = SCREEN_WIDTH / 2 + Math.round(20 * S);
    var rowH = Math.round(32 * S);
    var startY = cardY + headerH + Math.round(52 * S);

    this.statRow(ctx, '🐴 找到的小马', foundPonies + '/' + totalPonies, leftX, SCREEN_WIDTH / 2 - Math.round(20 * S), startY);
    this.statRow(ctx, '✘ 错误次数', wrongCount, leftX, SCREEN_WIDTH / 2 - Math.round(20 * S), startY + rowH);
    this.statRow(ctx, '❤ 剩余生命', this.heartStr(remainingLives, maxLives), leftX, SCREEN_WIDTH / 2 - Math.round(20 * S), startY + rowH * 2);

    this.statRow(ctx, '⏱ 用时', this.formatTime(elapsed), rightX, SCREEN_WIDTH - Math.round(20 * S), startY);
    var score = this.calcScore(data);
    this.statRow(ctx, '⭐ 评分', this.starStr(score), rightX, SCREEN_WIDTH - Math.round(20 * S), startY + rowH);

    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(SCREEN_WIDTH / 2, startY - Math.round(6 * S));
    ctx.lineTo(SCREEN_WIDTH / 2, startY + rowH * 2 + Math.round(20 * S));
    ctx.stroke();

    ctx.font = Math.round(11 * S) + 'px Arial';
    ctx.fillStyle = '#aaa';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      '用时越少、错误越少，评分越高',
      SCREEN_WIDTH / 2,
      startY + rowH * 3 + Math.round(16 * S)
    );

    var btnY = cardY + totalCardH + Math.round(28 * S);
    var btnW = Math.round(160 * S);
    var btnH = Math.round(44 * S);
    var btnGap = Math.round(12 * S);

    if (isWin) {
      this.drawBtn(ctx, '🔄 再来一局', SCREEN_WIDTH / 2, btnY, btnW, btnH, '#5C6BC0', 0);
      this.drawBtn(ctx, '🏠 返回主页', SCREEN_WIDTH / 2, btnY + btnH + btnGap, btnW, btnH, 'rgba(120,120,120,0.7)', 1);
    } else {
      this.drawBtn(ctx, '🔄 重新开始', SCREEN_WIDTH / 2, btnY, btnW, btnH, '#5C6BC0', 0);
      this.drawBtn(ctx, '📺 看广告复活', SCREEN_WIDTH / 2, btnY + btnH + btnGap, btnW, btnH, '#E53935', 1);
      this.drawBtn(ctx, '🏠 返回主页', SCREEN_WIDTH / 2, btnY + (btnH + btnGap) * 2, btnW, btnH, 'rgba(120,120,120,0.7)', 2);
    }
  }

  statRow(ctx, label, value, lx, rx, y) {
    ctx.textAlign = 'left';
    ctx.font = Math.round(12 * S) + 'px Arial';
    ctx.fillStyle = '#888';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, lx, y);

    ctx.textAlign = 'right';
    ctx.font = 'bold ' + Math.round(14 * S) + 'px Arial';
    ctx.fillStyle = '#333';
    ctx.fillText(value, rx, y);
  }

  calcScore(data) {
    if (data.isFail) return 1;
    var found = data.foundPonies;
    var total = data.totalPonies;
    var wrong = data.wrongCount;
    var elapsed = data.elapsed;
    var lives = data.remainingLives;

    if (found === total && wrong === 0) {
      return lives >= 2 ? 5 : 4;
    }
    var ratio = found / total;
    var base = ratio * 3;
    var wrongPenalty = wrong * 0.5;
    var timeBonus = 0;
    if (total === 8) timeBonus = elapsed < 120000 ? 1 : 0;
    else if (total === 10) timeBonus = elapsed < 180000 ? 1 : 0;
    else timeBonus = elapsed < 300000 ? 1 : 0;

    var raw = base - wrongPenalty + timeBonus;
    return Math.max(1, Math.min(5, Math.round(raw)));
  }

  starStr(score) {
    var s = '';
    for (var i = 0; i < 5; i++) {
      s += i < score ? '⭐' : '☆';
    }
    return s;
  }

  heartStr(lives, max) {
    return '❤'.repeat(Math.max(0, lives));
  }

  formatTime(ms) {
    var totalSec = Math.floor(ms / 1000);
    var min = Math.floor(totalSec / 60);
    var sec = totalSec % 60;
    return min + '分' + (sec < 10 ? '0' : '') + sec + '秒';
  }

  drawBtn(ctx, text, cx, top, w, h, color, index) {
    var x = cx - w / 2;
    ctx.fillStyle = color;
    this.roundRectFull(ctx, x, top, w, h, Math.round(10 * S));
    ctx.fill();

    ctx.fillStyle = color === '#5C6BC0' ? '#fff' : '#666';
    ctx.font = 'bold ' + Math.round(16 * S) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, top + h / 2);

    this.btnRects[index] = { x: x, y: top, w: w, h: h };
  }

  getHitBtn(clientX, clientY) {
    for (var i = 0; i < this.btnRects.length; i++) {
      var r = this.btnRects[i];
      if (r && clientX >= r.x && clientX <= r.x + r.w && clientY >= r.y && clientY <= r.y + r.h) {
        return i;
      }
    }
    return -1;
  }

  roundRect(ctx, x, y, w, h, corners) {
    ctx.beginPath();
    var tl = corners.tl || 0;
    var tr = corners.tr || 0;
    var bl = corners.bl || 0;
    var br = corners.br || 0;
    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + w - tr, y);
    ctx.arcTo(x + w, y, x + w, y + tr, tr);
    ctx.lineTo(x + w, y + h - br);
    ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
    ctx.lineTo(x + bl, y + h);
    ctx.arcTo(x, y + h, x, y + h - bl, bl);
    ctx.lineTo(x, y + tl);
    ctx.arcTo(x, y, x + tl, y, tl);
    ctx.closePath();
    ctx.fill();
  }

  roundRectFull(ctx, x, y, w, h, r) {
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
  }
}
