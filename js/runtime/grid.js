import { SCREEN_WIDTH, SCREEN_HEIGHT, STATUS_BAR_HEIGHT, SCREEN_SCALE } from '../render';
import { COLOR_PALETTE } from '../../core/generator';

const S = SCREEN_SCALE;
const MARGIN = Math.round(6 * S) + Math.round(8 * S);
const SAFE_TOP = STATUS_BAR_HEIGHT + Math.floor(38 * S);
const SECTION_GAP = Math.round(4 * S);
const TOP_BAR_H = Math.round(28 * S);
const RULE_CARD_H = Math.round(38 * S);
const STATUS_CARD_H = Math.round(48 * S);
const BOTTOM_BAR_H = Math.round(80 * S);
const CELL_GAP = Math.round(2 * S);
const CELL_RADIUS = Math.round(5 * S);

export default class GridRenderer {
  constructor() {
    this.offsetX = 0;
    this.offsetY = 0;
    this.cellSize = 0;
    this.rows = 0;
    this.cols = 0;
    this.hintTarget = null;
    this.hintTargets = null;
    this.hintMessage = '';
    this.topBarY = 0;
    this.ruleCardY = 0;
    this.statusCardY = 0;
    this.gridTop = 0;
    this.gridBottom = 0;
    this.bottomBarY = 0;
    this.overlayBtnRects = null;
  }

  init(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.hintTarget = null;
    this.hintTargets = null;
    this.hintMessage = '';

    this.topBarY = SAFE_TOP + MARGIN;
    this.ruleCardY = this.topBarY + TOP_BAR_H + SECTION_GAP;
    this.statusCardY = this.ruleCardY + RULE_CARD_H + SECTION_GAP;
    this.gridTop = this.statusCardY + STATUS_CARD_H + SECTION_GAP;
    this.bottomBarY = SCREEN_HEIGHT - BOTTOM_BAR_H - MARGIN;
    this.gridBottom = this.bottomBarY - SECTION_GAP;

    const gridW = SCREEN_WIDTH - MARGIN * 2;
    const gridH = this.gridBottom - this.gridTop;

    const cellSizeW = (gridW - CELL_GAP * (cols - 1)) / cols;
    const cellSizeH = (gridH - CELL_GAP * (rows - 1)) / rows;
    this.cellSize = Math.floor(Math.min(cellSizeW, cellSizeH));

    const totalGridW = this.cellSize * cols + CELL_GAP * (cols - 1);
    const totalGridH = this.cellSize * rows + CELL_GAP * (rows - 1);
    this.offsetX = Math.floor((SCREEN_WIDTH - totalGridW) / 2);
    this.offsetY = Math.floor(this.gridTop + (gridH - totalGridH) / 2);
  }

  getCellByPos(clientX, clientY) {
    const step = this.cellSize + CELL_GAP;
    const col = Math.floor((clientX - this.offsetX) / step);
    const row = Math.floor((clientY - this.offsetY) / step);
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return null;
    const cx = this.offsetX + col * step;
    const cy = this.offsetY + row * step;
    if (clientX < cx || clientX > cx + this.cellSize || clientY < cy || clientY > cy + this.cellSize) return null;
    return { row, col };
  }

  // ==================== RENDER ====================

  render(ctx, grid, anims, now) {
    const size = this.cellSize;
    const step = size + CELL_GAP;

    var animMap = {};
    if (anims && anims.length) {
      for (var a = 0; a < anims.length; a++) {
        var anim = anims[a];
        animMap[anim.row + ',' + anim.col] = anim;
      }
    }

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = grid[r][c];
        const x = this.offsetX + c * step;
        const y = this.offsetY + r * step;
        const palette = COLOR_PALETTE[cell.colorId];
        const cellAnim = animMap[r + ',' + c];

        ctx.fillStyle = palette.bg;
        this.roundRect(ctx, x, y, size, size, CELL_RADIUS);

        this.drawCellState(ctx, cell, x, y, size, cellAnim, now);
      }
    }

    if (this.hintTarget || (this.hintTargets && this.hintTargets.length)) {
      var targets = this.hintTargets || [this.hintTarget];
      var pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008);
      var alpha = 0.5 + pulse * 0.5;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#FFB300';
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 3]);
      for (var ti = 0; ti < targets.length; ti++) {
        var t = targets[ti];
        var tx = this.offsetX + t.col * step;
        var ty = this.offsetY + t.row * step;
        ctx.strokeRect(tx + 2, ty + 2, size - 4, size - 4);
      }
      ctx.setLineDash([]);
      ctx.restore();
    }

    if (this.hintMessage) {
      ctx.fillStyle = 'rgba(255, 183, 77, 0.92)';
      ctx.font = Math.round(13 * S) + 'px Arial';
      var msgW = ctx.measureText(this.hintMessage).width + Math.round(32 * S);
      var msgH = Math.round(30 * S);
      var msgX = SCREEN_WIDTH / 2 - msgW / 2;
      var msgY = this.gridBottom + Math.round(2 * S);
      this.roundRect(ctx, msgX, msgY, msgW, msgH, Math.round(6 * S));
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.hintMessage, SCREEN_WIDTH / 2, msgY + msgH / 2);
    }
  }

  // ==================== TOP BAR ====================

  renderTopBar(ctx, stamina, lives, maxLives, heartFlashTime) {
    const y = this.topBarY;
    const h = TOP_BAR_H;

    ctx.save();

    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#666';
    ctx.font = Math.round(12 * S) + 'px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('⚡' + stamina, MARGIN + Math.round(4 * S), y + h / 2);

    var heartAlpha = 1;
    var heartScale = 1;
    if (heartFlashTime) {
      var elapsed = Date.now() - heartFlashTime;
      if (elapsed < 500) {
        heartAlpha = 0.5 + 0.5 * Math.abs(Math.sin(elapsed * 0.02));
        heartScale = 1 + 0.15 * Math.sin(elapsed * 0.025);
      }
    }

    ctx.save();
    ctx.globalAlpha = heartAlpha;
    var heartCX = SCREEN_WIDTH / 2;
    ctx.translate(heartCX, y + h / 2);
    ctx.scale(heartScale, heartScale);
    ctx.translate(-heartCX, -(y + h / 2));

    ctx.font = Math.round(16 * S) + 'px Arial';
    ctx.textAlign = 'center';
    var heartStr = '❤'.repeat(lives);
    ctx.fillText(heartStr, SCREEN_WIDTH / 2, y + h / 2);
    ctx.restore();

    const homeBtnW = Math.round(36 * S);
    const homeBtnH = Math.round(24 * S);
    const homeBtnX = SCREEN_WIDTH - homeBtnW - MARGIN - Math.round(4 * S);
    const homeBtnY = y + (h - homeBtnH) / 2;
    ctx.fillStyle = 'rgba(130, 130, 130, 0.4)';
    this.roundRect(ctx, homeBtnX, homeBtnY, homeBtnW, homeBtnH, Math.round(5 * S));
    ctx.fillStyle = '#fff';
    ctx.font = Math.round(14 * S) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🏠', homeBtnX + homeBtnW / 2, homeBtnY + homeBtnH / 2);
    this.homeBtnRect = { x: homeBtnX, y: homeBtnY, w: homeBtnW, h: homeBtnH };

    var gearW = homeBtnW;
    var gearH = homeBtnH;
    var gearX = homeBtnX - gearW - Math.round(4 * S);
    var gearY = homeBtnY;
    ctx.fillStyle = 'rgba(130, 130, 130, 0.4)';
    this.roundRect(ctx, gearX, gearY, gearW, gearH, Math.round(5 * S));
    ctx.fillStyle = '#fff';
    ctx.font = Math.round(14 * S) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⚙️', gearX + gearW / 2, gearY + gearH / 2);
    this.settingsBtnRect = { x: gearX, y: gearY, w: gearW, h: gearH };

    ctx.restore();
  }

  // ==================== RULE CARD ====================

  renderRuleCard(ctx) {
    const y = this.ruleCardY;
    const h = RULE_CARD_H;
    const x = MARGIN + Math.round(2 * S);
    const w = SCREEN_WIDTH - MARGIN * 2 - Math.round(4 * S);

    ctx.fillStyle = '#fff';
    this.roundRect(ctx, x, y, w, h, Math.round(10 * S));

    const colW = (w - Math.round(2 * S)) / 3;
    ctx.font = Math.round(11 * S) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#333';

    ctx.fillText('🐴 每种颜色1匹小马', x + colW / 2, y + h / 2 - 1);
    ctx.fillText('📏 每行每列各1匹', x + colW + colW / 2, y + h / 2 - 1);
    ctx.fillText('🚫 小马不能相邻', x + colW * 2 + colW / 2, y + h / 2 - 1);

    ctx.strokeStyle = '#7dbcdb';
    ctx.lineWidth = 0.8;
    ctx.globalAlpha = 0.3;
    ctx.setLineDash([Math.round(3 * S), Math.round(5 * S)]);
    ctx.beginPath();
    ctx.moveTo(x + colW + Math.round(1 * S), y + Math.round(8 * S));
    ctx.lineTo(x + colW + Math.round(1 * S), y + h - Math.round(8 * S));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + colW * 2 + Math.round(1 * S), y + Math.round(8 * S));
    ctx.lineTo(x + colW * 2 + Math.round(1 * S), y + h - Math.round(8 * S));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  // ==================== STATUS CARDS ====================

  renderStatusCards(ctx, foundPonies, totalPonies, remainingSec) {
    const y = this.statusCardY;
    const h = STATUS_CARD_H;
    const gap = Math.round(8 * S);
    const cardW = (SCREEN_WIDTH - MARGIN * 2 - gap) / 2;
    const leftX = MARGIN;

    ctx.fillStyle = '#fff';
    this.roundRect(ctx, leftX, y, cardW, h, Math.round(10 * S));
    ctx.fillStyle = '#fff';
    this.roundRect(ctx, leftX + cardW + gap, y, cardW, h, Math.round(10 * S));

    ctx.textAlign = 'center';
    ctx.font = 'bold ' + Math.round(11 * S) + 'px Arial';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#888';
    var rem = totalPonies - foundPonies;
    ctx.fillText('🐴 剩余', leftX + cardW / 2, y + Math.round(16 * S));
    ctx.fillText('⏱ 剩余时间', leftX + cardW + gap + cardW / 2, y + Math.round(16 * S));

    ctx.font = 'bold ' + Math.round(24 * S) + 'px Arial';
    ctx.fillStyle = '#C62828';
    ctx.fillText(rem, leftX + cardW / 2, y + Math.round(40 * S));
    ctx.fillStyle = '#1565C0';
    ctx.fillText(remainingSec, leftX + cardW + gap + cardW / 2, y + Math.round(40 * S));
  }

  // ==================== BOTTOM BAR ====================

  renderBottomBar(ctx, hintsRemaining, revealRemaining) {
    const y = this.bottomBarY;
    const h = BOTTOM_BAR_H;
    const btnSpacing = Math.round(16 * S);
    const clearW = Math.round(48 * S);
    const clearH = Math.round(48 * S);
    const bigW = Math.round(60 * S);
    const bigH = Math.round(60 * S);
    const coordW = Math.round(42 * S);
    const coordH = Math.round(42 * S);

    const centerY = y + h / 2;

    const clearX = MARGIN;
    const coordX = SCREEN_WIDTH - coordW - MARGIN;
    const availableW = coordX - (clearX + clearW);
    const spacePerGap = (availableW - bigW * 2) / 3;
    const revealX = clearX + clearW + spacePerGap;
    const hintX = revealX + bigW + spacePerGap;
    const clearY = centerY - clearH / 2;
    ctx.fillStyle = '#BDBDBD';
    this.roundRect(ctx, clearX, clearY, clearW, clearH, Math.round(10 * S));
    ctx.fillStyle = '#fff';
    ctx.font = Math.round(20 * S) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🗑', clearX + clearW / 2, clearY + clearH / 2);
    ctx.font = Math.round(9 * S) + 'px Arial';
    ctx.fillStyle = '#888';
    ctx.fillText('清除', clearX + clearW / 2, clearY + clearH + Math.round(10 * S));
    this.clearBtnRect = { x: clearX, y: clearY, w: clearW, h: clearH };

    const revealY = centerY - bigH / 2;
    var revealAlpha = revealRemaining > 0 ? 1 : 0.4;
    ctx.globalAlpha = revealAlpha;
    ctx.fillStyle = revealRemaining > 0 ? '#5C6BC0' : '#BDBDBD';
    this.roundRect(ctx, revealX, revealY, bigW, bigH, Math.round(12 * S));
    ctx.fillStyle = '#fff';
    ctx.font = Math.round(26 * S) + 'px Arial';
    ctx.fillText('🐴', revealX + bigW / 2, revealY + bigH / 2);
    ctx.font = Math.round(9 * S) + 'px Arial';
    ctx.fillStyle = '#bbb';
    ctx.fillText('揭晓(' + revealRemaining + ')', revealX + bigW / 2, revealY + bigH + Math.round(10 * S));
    ctx.globalAlpha = 1;
    this.revealBtnRect = { x: revealX, y: revealY, w: bigW, h: bigH };

    const hintY = centerY - bigH / 2;
    var alpha = hintsRemaining > 0 ? 1 : 0.4;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = hintsRemaining > 0 ? '#FFA726' : '#BDBDBD';
    this.roundRect(ctx, hintX, hintY, bigW, bigH, Math.round(12 * S));
    ctx.fillStyle = '#fff';
    ctx.font = Math.round(26 * S) + 'px Arial';
    ctx.fillText('💡', hintX + bigW / 2, hintY + bigH / 2);
    ctx.font = Math.round(9 * S) + 'px Arial';
    ctx.fillStyle = '#bbb';
    ctx.fillText('提示(' + hintsRemaining + ')', hintX + bigW / 2, hintY + bigH + Math.round(10 * S));
    ctx.globalAlpha = 1;
    this.hintBtnRect = { x: hintX, y: hintY, w: bigW, h: bigH };

    const coordY = centerY - coordH / 2;
    ctx.fillStyle = '#BDBDBD';
    this.roundRect(ctx, coordX, coordY, coordW, coordH, Math.round(8 * S));
    ctx.fillStyle = '#fff';
    ctx.font = Math.round(16 * S) + 'px Arial';
    ctx.fillText('📍', coordX + coordW / 2, coordY + coordH / 2);
    ctx.font = Math.round(9 * S) + 'px Arial';
    ctx.fillStyle = '#888';
    ctx.fillText('坐标', coordX + coordW / 2, coordY + coordH + Math.round(10 * S));
    this.coordBtnRect = { x: coordX, y: coordY, w: coordW, h: coordH };
  }

  // ==================== CELL STATE ====================

  easeOutBack(t) {
    var c1 = 1.70158;
    var c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  easeOutBounce(t) {
    var n1 = 7.5625;
    var d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    else return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }

  drawCellState(ctx, cell, x, y, size, anim, now) {
    const cx = x + size / 2;
    const cy = y + size / 2;

    if (cell.state === 'marked') {
      var scale = 1;
      if (anim && anim.type === 'mark' && now) {
        var prog = Math.min((now - anim.startTime) / anim.duration, 1);
        scale = 0.8 + 0.2 * this.easeOutBack(prog);
      }
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.translate(-cx, -cy);

      var pad = size * 0.22;
      var x1 = x + pad;
      var y1 = y + pad;
      var x2 = x + size - pad;
      var y2 = y + size - pad;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = Math.max(2, size * 0.1);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.moveTo(x2, y1);
      ctx.lineTo(x1, y2);
      ctx.stroke();

      ctx.restore();
    } else if (cell.state === 'correct') {
      var scaleC = 1;
      if (anim && anim.type === 'correct' && now) {
        var progC = Math.min((now - anim.startTime) / anim.duration, 1);
        scaleC = this.easeOutBounce(progC);
      }
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scaleC, scaleC);
      ctx.translate(-cx, -cy);

      ctx.fillStyle = '#2E7D32';
      ctx.font = `${Math.max(size * 0.7, Math.round(13 * S))}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐴', cx, cy);

      ctx.restore();
    } else if (cell.state === 'wrong') {
      var shakeX = 0;
      if (anim && anim.type === 'wrong' && now) {
        var progW = Math.min((now - anim.startTime) / anim.duration, 1);
        var freq = 5;
        var decay = 1 - progW;
        shakeX = Math.sin(progW * Math.PI * freq) * decay * size * 0.08;
      }

      ctx.save();
      ctx.translate(shakeX, 0);

      var padW = size * 0.22;
      var wx1 = x + padW;
      var wy1 = y + padW;
      var wx2 = x + size - padW;
      var wy2 = y + size - padW;
      ctx.strokeStyle = '#C62828';
      ctx.lineWidth = Math.max(2, size * 0.1);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(wx1, wy1);
      ctx.lineTo(wx2, wy2);
      ctx.moveTo(wx2, wy1);
      ctx.lineTo(wx1, wy2);
      ctx.stroke();

      ctx.restore();
    }
  }

  // ==================== OVERLAYS ====================

  difficultyLabel(config) {
    const { rows, cols } = config;
    if (rows === 8) return '简单 (8×8)';
    if (rows === 10) return '中等 (10×10)';
    return '困难 (12×12)';
  }

  formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return min + ':' + (sec < 10 ? '0' : '') + sec;
  }

  renderWinOverlay(ctx, data) {
    const { foundPonies, totalPonies, remainingLives, elapsed, config } = data;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    const cy = SCREEN_HEIGHT / 2;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold ' + Math.round(26 * S) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('🎉 恭喜通关！', SCREEN_WIDTH / 2, cy - Math.round(60 * S));

    ctx.font = Math.round(14 * S) + 'px Arial';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ddd';
    ctx.fillText(this.difficultyLabel(config), SCREEN_WIDTH / 2, cy - Math.round(30 * S));

    ctx.fillStyle = '#fff';
    const heartStr = '❤'.repeat(remainingLives);
    ctx.fillText(
      '🐴 ' + foundPonies + '/' + totalPonies + '    生命 ' + heartStr + '    ⏱ ' + this.formatTime(elapsed),
      SCREEN_WIDTH / 2,
      cy
    );

    this.drawOverlayBtn(ctx, '🔄 再来一局', SCREEN_WIDTH / 2, cy + Math.round(40 * S), 0);
    this.drawOverlayBtn(ctx, '🏠 返回主页', SCREEN_WIDTH / 2, cy + Math.round(86 * S), 1);
  }

  renderFailOverlay(ctx, data) {
    const { foundPonies, totalPonies, wrongCount, elapsed } = data;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    const cy = SCREEN_HEIGHT / 2;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold ' + Math.round(26 * S) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('💔 生命耗尽！', SCREEN_WIDTH / 2, cy - Math.round(40 * S));

    ctx.font = Math.round(14 * S) + 'px Arial';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      '🐴 已找到 ' + foundPonies + '/' + totalPonies + '    ✘ ' + wrongCount + '    ⏱ ' + this.formatTime(elapsed),
      SCREEN_WIDTH / 2,
      cy
    );

    this.drawOverlayBtn(ctx, '🔄 重新开始', SCREEN_WIDTH / 2, cy + Math.round(40 * S), 0);
    this.drawOverlayBtn(ctx, '🏠 返回主页', SCREEN_WIDTH / 2, cy + Math.round(86 * S), 1);
  }

  drawOverlayBtn(ctx, text, cx, top, index) {
    const bw = Math.round(140 * S);
    const bh = Math.round(36 * S);
    if (!this.overlayBtnRects) this.overlayBtnRects = [];
    this.overlayBtnRects[index] = { x: cx - bw / 2, y: top - bh / 2, w: bw, h: bh };

    ctx.fillStyle = '#5C6BC0';
    this.roundRect(ctx, this.overlayBtnRects[index].x, this.overlayBtnRects[index].y, bw, bh, Math.round(8 * S));
    ctx.fillStyle = '#fff';
    ctx.font = Math.round(15 * S) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, top);
  }

  // ==================== HIT DETECTION ====================

  isInHomeBtn(clientX, clientY) {
    if (!this.homeBtnRect) return false;
    var r = this.homeBtnRect;
    return clientX >= r.x && clientX <= r.x + r.w && clientY >= r.y && clientY <= r.y + r.h;
  }

  isInClearBtn(clientX, clientY) {
    if (!this.clearBtnRect) return false;
    var r = this.clearBtnRect;
    return clientX >= r.x && clientX <= r.x + r.w && clientY >= r.y && clientY <= r.y + r.h;
  }

  isInHintBtn(clientX, clientY) {
    if (!this.hintBtnRect) return false;
    var r = this.hintBtnRect;
    return clientX >= r.x && clientX <= r.x + r.w && clientY >= r.y && clientY <= r.y + r.h;
  }

  isInRevealBtn(clientX, clientY) {
    if (!this.revealBtnRect) return false;
    var r = this.revealBtnRect;
    return clientX >= r.x && clientX <= r.x + r.w && clientY >= r.y && clientY <= r.y + r.h;
  }

  isInCoordBtn(clientX, clientY) {
    if (!this.coordBtnRect) return false;
    var r = this.coordBtnRect;
    return clientX >= r.x && clientX <= r.x + r.w && clientY >= r.y && clientY <= r.y + r.h;
  }

  isInSettingsBtn(clientX, clientY) {
    if (!this.settingsBtnRect) return false;
    var r = this.settingsBtnRect;
    return clientX >= r.x && clientX <= r.x + r.w && clientY >= r.y && clientY <= r.y + r.h;
  }

  isInOverlayBtn(clientX, clientY) {
    if (!this.overlayBtnRects) return -1;
    for (let i = 0; i < this.overlayBtnRects.length; i++) {
      const r = this.overlayBtnRects[i];
      if (r && clientX >= r.x && clientX <= r.x + r.w && clientY >= r.y && clientY <= r.y + r.h) {
        return i;
      }
    }
    return -1;
  }

  // ==================== HINT ====================

  setHintTarget(row, col, message) {
    if (Array.isArray(row)) {
      this.hintTargets = row;
      this.hintTarget = null;
      this.hintMessage = col;
    } else {
      this.hintTarget = { row: row, col: col };
      this.hintTargets = null;
      this.hintMessage = message;
    }
  }

  clearHint() {
    this.hintTarget = null;
    this.hintTargets = null;
    this.hintMessage = '';
    this.hintPopupData = null;
  }

  // ==================== HINT POPUP ====================

  renderHintPopup(ctx, data, grid) {
    if (!data) return;
    this.hintPopupData = data;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    var cardW = SCREEN_WIDTH - Math.round(48 * S);
    var cardX = Math.round(24 * S);
    var cardY = this.gridTop - Math.round(28 * S);

    var titleH = Math.round(30 * S);
    var fontForWrap = Math.round(13 * S) + 'px Arial';
    ctx.font = fontForWrap;
    var lines = this.wrapText(ctx, data.message, cardW - Math.round(32 * S));
    var lineH = Math.round(20 * S);
    var bodyH = Math.round(10 * S) + lines.length * lineH + Math.round(14 * S);
    var cardH = titleH + bodyH;

    ctx.fillStyle = '#fff';
    this.roundRect(ctx, cardX, cardY, cardW, cardH, Math.round(14 * S));

    ctx.fillStyle = '#333';
    ctx.font = 'bold ' + Math.round(15 * S) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💡 提示', SCREEN_WIDTH / 2, cardY + Math.round(18 * S));

    ctx.fillStyle = '#555';
    ctx.font = fontForWrap;
    var startY = cardY + titleH + Math.round(6 * S);
    for (var i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], SCREEN_WIDTH / 2, startY + i * lineH);
    }

    this.hintPopupRect = { x: cardX, y: cardY, w: cardW, h: cardH };

    var targets = this.hintTargets || (this.hintTarget ? [this.hintTarget] : null);
    if (targets && targets.length > 0 && grid) {
      var step = this.cellSize + CELL_GAP;
      for (var ti = 0; ti < targets.length; ti++) {
        var t = targets[ti];
        var cell = grid[t.row][t.col];
        var hx = this.offsetX + t.col * step;
        var hy = this.offsetY + t.row * step;
        var palette = COLOR_PALETTE[cell.colorId];
        ctx.fillStyle = palette.bg;
        this.roundRect(ctx, hx, hy, this.cellSize, this.cellSize, CELL_RADIUS);
        this.drawCellState(ctx, cell, hx, hy, this.cellSize, null, null);
      }
    }
  }

  wrapText(ctx, text, maxW) {
    var result = [];
    var start = 0;
    while (start < text.length) {
      var end = text.length;
      while (end > start) {
        var seg = text.substring(start, end);
        if (ctx.measureText(seg).width <= maxW) break;
        end--;
      }
      result.push(text.substring(start, end));
      start = end;
    }
    return result;
  }

  // ==================== COORDINATE ====================

  renderCoordinates(ctx) {
    if (!this.showCoords) return;
    const step = this.cellSize + CELL_GAP;
    ctx.fillStyle = '#999';
    ctx.font = Math.round(10 * S) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    var colLabelY = this.offsetY - Math.round(10 * S);

    for (var c = 0; c < this.cols; c++) {
      var cx = this.offsetX + c * step + this.cellSize / 2;
      ctx.fillText(c + 1, cx, colLabelY);
    }
    ctx.textAlign = 'right';
    for (var r = 0; r < this.rows; r++) {
      var cy = this.offsetY + r * step + this.cellSize / 2;
      ctx.fillText(r + 1, this.offsetX - Math.round(3 * S), cy);
    }
  }

  toggleCoords() {
    this.showCoords = !this.showCoords;
  }

  // ==================== HELPERS ====================

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

  roundRectStroke(ctx, x, y, w, h, r) {
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
    ctx.stroke();
  }
}
