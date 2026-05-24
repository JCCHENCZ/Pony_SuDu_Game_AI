import { SCREEN_WIDTH, SCREEN_HEIGHT, SCREEN_SCALE } from '../render';
import Audio from '../../core/audio';

var S = SCREEN_SCALE;

export default class SettingsRenderer {
  constructor() {
    this.toggleOnRect = null;
    this.toggleOffRect = null;
    this.sliderRect = null;
    this.knobX = 0;
    this.dragging = false;
  }

  render(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    var cardW = SCREEN_WIDTH - Math.round(56 * S);
    var cardH = Math.round(150 * S);
    var cardX = Math.round(28 * S);
    var cardY = SCREEN_HEIGHT / 2 - cardH / 2;

    ctx.fillStyle = '#fff';
    this.roundRect(ctx, cardX, cardY, cardW, cardH, Math.round(16 * S));

    ctx.fillStyle = '#333';
    ctx.font = 'bold ' + Math.round(17 * S) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚙️ 设置', SCREEN_WIDTH / 2, cardY + Math.round(26 * S));

    // Sound toggle row
    var rowY = cardY + Math.round(56 * S);
    ctx.fillStyle = '#888';
    ctx.font = Math.round(13 * S) + 'px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('🔊 音效', cardX + Math.round(24 * S), rowY);

    var toggleW = Math.round(52 * S);
    var toggleH = Math.round(30 * S);
    var toggleX = SCREEN_WIDTH - cardX - Math.round(24 * S) - toggleW * 2 - Math.round(8 * S);

    var soundOn = Audio.soundEnabled;
    ctx.fillStyle = soundOn ? '#43A047' : '#e0e0e0';
    this.roundRect(ctx, toggleX, rowY - toggleH / 2, toggleW, toggleH, Math.round(6 * S));
    ctx.fillStyle = '#fff';
    ctx.font = 'bold ' + Math.round(12 * S) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('开', toggleX + toggleW / 2, rowY);
    this.toggleOnRect = { x: toggleX, y: rowY - toggleH / 2, w: toggleW, h: toggleH };

    var offX = toggleX + toggleW + Math.round(8 * S);
    ctx.fillStyle = !soundOn ? '#E53935' : '#e0e0e0';
    this.roundRect(ctx, offX, rowY - toggleH / 2, toggleW, toggleH, Math.round(6 * S));
    ctx.fillStyle = '#fff';
    ctx.fillText('关', offX + toggleW / 2, rowY);
    this.toggleOffRect = { x: offX, y: rowY - toggleH / 2, w: toggleW, h: toggleH };

    // Volume slider row
    var sliderY = cardY + Math.round(100 * S);
    ctx.fillStyle = '#888';
    ctx.font = Math.round(13 * S) + 'px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('📢 音量', cardX + Math.round(24 * S), sliderY);

    var sliderLeft = SCREEN_WIDTH - cardX - Math.round(24 * S) - toggleW * 2 - Math.round(8 * S);
    var sliderW = toggleW * 2 + Math.round(8 * S);
    var sliderH = Math.round(16 * S);
    var sliderTop = sliderY - sliderH / 2;

    ctx.fillStyle = '#e0e0e0';
    this.roundRect(ctx, sliderLeft, sliderTop, sliderW, sliderH, sliderH / 2);

    var volumePct = Audio.soundVolume / 100;
    var filledW = sliderW * volumePct;
    if (filledW > sliderH) {
      ctx.fillStyle = 'rgba(92, 107, 192, 0.3)';
      this.roundRect(ctx, sliderLeft, sliderTop, filledW, sliderH, sliderH / 2);
    }

    var knobR = Math.round(10 * S);
    var knobX = sliderLeft + (sliderW - knobR * 2) * volumePct + knobR;
    var knobY = sliderY;
    ctx.fillStyle = '#5C6BC0';
    ctx.beginPath();
    ctx.arc(knobX, knobY, knobR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(knobX, knobY, knobR * 0.55, 0, Math.PI * 2);
    ctx.fill();

    this.sliderRect = { x: sliderLeft, y: sliderTop, w: sliderW, h: sliderH };
    this.knobX = knobX;

    // Close hint
    ctx.fillStyle = '#aaa';
    ctx.font = Math.round(11 * S) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('点击空白处关闭', SCREEN_WIDTH / 2, cardY + cardH - Math.round(14 * S));

    this.cardRect = { x: cardX, y: cardY, w: cardW, h: cardH };
  }

  getHitTarget(clientX, clientY) {
    if (this.toggleOnRect && clientX >= this.toggleOnRect.x && clientX <= this.toggleOnRect.x + this.toggleOnRect.w &&
        clientY >= this.toggleOnRect.y && clientY <= this.toggleOnRect.y + this.toggleOnRect.h) return 'toggle_on';
    if (this.toggleOffRect && clientX >= this.toggleOffRect.x && clientX <= this.toggleOffRect.x + this.toggleOffRect.w &&
        clientY >= this.toggleOffRect.y && clientY <= this.toggleOffRect.y + this.toggleOffRect.h) return 'toggle_off';
    return null;
  }

  isInCard(clientX, clientY) {
    var r = this.cardRect;
    return r && clientX >= r.x && clientX <= r.x + r.w && clientY >= r.y && clientY <= r.y + r.h;
  }

  isSliding(clientX, clientY) {
    var r = this.sliderRect;
    return r && clientX >= r.x - Math.round(12 * S) && clientX <= r.x + r.w + Math.round(12 * S) &&
        clientY >= r.y - Math.round(12 * S) && clientY <= r.y + r.h + Math.round(12 * S);
  }

  setVolumeFromPos(clientX) {
    var r = this.sliderRect;
    if (!r) return;
    var pct = (clientX - r.x) / r.w;
    Audio.soundVolume = Math.round(Math.max(0, Math.min(1, pct)) * 100);
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
