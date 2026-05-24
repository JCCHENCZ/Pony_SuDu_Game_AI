import { SCREEN_WIDTH, SCREEN_HEIGHT, SCREEN_SCALE } from '../render';

const S = SCREEN_SCALE;

const PAGES = [
  {
    icon: '🐴',
    title: '找出所有隐藏的小马',
    body: '彩色方格中每种颜色藏着 1 匹小马。\n利用逻辑推理，找出全部小马即可通关！',
    draw: function (ctx, cx, cy) {
      ctx.font = Math.round(48 * S) + 'px Arial';
      ctx.fillText('🐴', cx, cy - Math.round(30 * S));
    }
  },
  {
    icon: '📏',
    title: '四条核心规则',
    body: '① 每行最多 1 匹小马\n② 每列最多 1 匹小马\n③ 小马周围 3×3 不能有其他小马\n④ 每种颜色恰好 1 匹小马',
    draw: function (ctx, cx, cy) {
      var gs = Math.round(18 * S);
      var gap = Math.round(4 * S);
      var ox = cx - (gs * 3 + gap * 2) / 2;
      var oy = cy - (gs * 1 + gap * 0) / 2 - Math.round(15 * S);

      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1;
      for (var r = 0; r < 3; r++) {
        for (var c = 0; c < 3; c++) {
          var x = ox + c * (gs + gap);
          var y = oy + r * (gs + gap);
          ctx.fillStyle = (r === 1 && c === 1) ? '#df8674' : '#e0e0e0';
          ctx.fillRect(x, y, gs, gs);
          ctx.strokeRect(x, y, gs, gs);
        }
      }
      ctx.font = Math.round(14 * S) + 'px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#333';
      ctx.fillText('🐴', cx, oy + gs + gap / 2 + Math.round(6 * S));

      ctx.setLineDash([Math.round(3 * S), Math.round(3 * S)]);
      ctx.strokeStyle = '#E53935';
      ctx.lineWidth = 2;
      ctx.strokeRect(ox - 2, oy - 2, gs * 3 + gap * 2 + 4, gs * 3 + gap * 2 + 4);
      ctx.setLineDash([]);
    }
  },
  {
    icon: '👆',
    title: '操作方式',
    body: '• 点击格子 → 画 ✕ 标记可疑位置\n• 双击已标记格子 → 揭晓答案\n• 手指滑动 → 批量标记 / 取消\n• 点击 🗑 → 清空所有标记',
    draw: function (ctx, cx, cy) {
      var gs = Math.round(26 * S);
      var gap = Math.round(4 * S);
      var ox = cx - (gs * 4 + gap * 3) / 2;
      var oy = cy - gs / 2;

      for (var c = 0; c < 4; c++) {
        var x = ox + c * (gs + gap);
        var state = c < 2 ? (c === 1 ? 'marked' : 'hidden') : (c === 2 ? 'wrong' : 'correct');
        ctx.fillStyle = state === 'wrong' ? '#f2c46f' : state === 'correct' ? '#7dbcdb' : state === 'marked' ? '#b8adcd' : '#eab6c2';
        ctx.fillRect(x, oy, gs, gs);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (state === 'marked') {
          ctx.fillStyle = 'rgba(90,90,90,0.8)';
          ctx.font = 'bold ' + Math.round(16 * S) + 'px Arial';
          ctx.fillText('✕', x + gs / 2, oy + gs / 2);
        } else if (state === 'wrong') {
          ctx.fillStyle = '#C62828';
          ctx.font = 'bold ' + Math.round(16 * S) + 'px Arial';
          ctx.fillText('✘', x + gs / 2, oy + gs / 2);
        } else if (state === 'correct') {
          ctx.fillStyle = '#2E7D32';
          ctx.font = Math.round(18 * S) + 'px Arial';
          ctx.fillText('🐴', x + gs / 2, oy + gs / 2);
        }
      }

      var labY = oy + gs + Math.round(10 * S);
      ctx.fillStyle = '#888';
      ctx.font = Math.round(10 * S) + 'px Arial';
      var labels = ['点击', '已标✕', '猜错✘', '猜对🐴'];
      for (var l = 0; l < 4; l++) {
        ctx.fillText(labels[l], ox + l * (gs + gap) + gs / 2, labY);
      }
    }
  },
  {
    icon: '❤️',
    title: '生命与提示',
    body: '• ❤❤ 共 2 条命，猜错扣 1 心\n• 💡 提示可用 3 次\n• ⏱ 限时完成，0 秒即失败\n• 提示弹窗暂停后点击空白处继续',
    draw: function (ctx, cx, cy) {
      ctx.font = Math.round(42 * S) + 'px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('❤❤', cx - Math.round(55 * S), cy);
      ctx.fillText('💡3', cx, cy);
      ctx.fillText('⏱', cx + Math.round(55 * S), cy);

      ctx.font = Math.round(11 * S) + 'px Arial';
      ctx.fillStyle = '#888';
      ctx.fillText('生命', cx - Math.round(55 * S), cy + Math.round(30 * S));
      ctx.fillText('提示', cx, cy + Math.round(30 * S));
      ctx.fillText('限时', cx + Math.round(55 * S), cy + Math.round(30 * S));
    }
  },
  {
    icon: '🎮',
    title: '准备好了吗？',
    body: '掌握了全部规则，现在去挑战吧！\n\n记住：冷静推理，步步为营。',
    draw: function (ctx, cx, cy) {
      ctx.font = Math.round(52 * S) + 'px Arial';
      ctx.fillText('🐴✨', cx, cy);
    }
  }
];

export default class TutorialRenderer {
  constructor() {
    this.page = 0;
    this.btnRects = {};
  }

  render(ctx) {
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.fillStyle = '#f1f2f4';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    var topY = Math.round(60 * S);
    var cx = SCREEN_WIDTH / 2;
    var cy = SCREEN_HEIGHT / 2 - Math.round(30 * S);

    var page = PAGES[this.page];

    ctx.fillStyle = '#fff';
    this.roundRect(ctx, Math.round(20 * S), topY, SCREEN_WIDTH - Math.round(40 * S), SCREEN_HEIGHT - topY - Math.round(60 * S), Math.round(16 * S));

    ctx.fillStyle = '#333';
    ctx.font = 'bold ' + Math.round(15 * S) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(page.icon + ' ' + page.title, cx, topY + Math.round(28 * S));

    var dotY = topY + Math.round(50 * S);
    for (var i = 0; i < PAGES.length; i++) {
      ctx.fillStyle = i === this.page ? '#5C6BC0' : '#ddd';
      ctx.beginPath();
      ctx.arc(cx - (PAGES.length - 1) * Math.round(12 * S) / 2 + i * Math.round(12 * S), dotY, Math.round(4 * S), 0, Math.PI * 2);
      ctx.fill();
    }

    var drawY = dotY + Math.round(100 * S);
    if (page.draw) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      page.draw(ctx, cx, drawY);
    }

    var bodyY = drawY + Math.round(70 * S);
    var lines = page.body.split('\n');
    ctx.fillStyle = '#555';
    ctx.font = Math.round(13 * S) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var lineH = Math.round(22 * S);
    for (var li = 0; li < lines.length; li++) {
      ctx.fillText(lines[li], cx, bodyY + li * lineH);
    }

    var arrowW = Math.round(48 * S);
    var arrowH = Math.round(40 * S);
    var arrowY = bodyY + lines.length * lineH + Math.round(30 * S);

    if (this.page > 0) {
      this.drawArrow(ctx, '←', cx - Math.round(50 * S) - arrowW / 2, arrowY, arrowW, arrowH);
      this.btnRects.prev = { x: cx - Math.round(50 * S) - arrowW / 2, y: arrowY, w: arrowW, h: arrowH };
    } else {
      this.btnRects.prev = null;
    }

    if (this.page < PAGES.length - 1) {
      this.drawArrow(ctx, '→', cx + Math.round(50 * S) - arrowW / 2, arrowY, arrowW, arrowH);
      this.btnRects.next = { x: cx + Math.round(50 * S) - arrowW / 2, y: arrowY, w: arrowW, h: arrowH };
    } else {
      this.drawArrow(ctx, '✔', cx + Math.round(50 * S) - arrowW / 2, arrowY, arrowW, arrowH);
      this.btnRects.next = { x: cx + Math.round(50 * S) - arrowW / 2, y: arrowY, w: arrowW, h: arrowH };
    }
  }

  drawArrow(ctx, symbol, x, y, w, h) {
    ctx.fillStyle = '#5C6BC0';
    this.roundRect(ctx, x, y, w, h, Math.round(8 * S));
    ctx.fillStyle = '#fff';
    ctx.font = Math.round(20 * S) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, x + w / 2, y + h / 2);
  }

  getHitBtn(clientX, clientY) {
    var btns = ['prev', 'next'];
    for (var i = 0; i < btns.length; i++) {
      var r = this.btnRects[btns[i]];
      if (r && clientX >= r.x && clientX <= r.x + r.w && clientY >= r.y && clientY <= r.y + r.h) {
        return btns[i];
      }
    }
    return null;
  }

  get isLastPage() {
    return this.page >= PAGES.length - 1;
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
