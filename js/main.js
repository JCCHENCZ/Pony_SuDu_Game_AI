import { generatePuzzle, CELL_STATE, COLOR_PALETTE } from '../core/generator';
import StaminaManager from '../core/stamina';
import GridRenderer from './runtime/grid';
import ResultRenderer from './runtime/result';
import TutorialRenderer from './runtime/tutorial';
import LoadingRenderer from './runtime/loading';
import HomeRenderer from './home';
import { SCREEN_DPR, SCREEN_WIDTH, SCREEN_HEIGHT } from './render';
import Audio from '../core/audio';
import SettingsRenderer from './runtime/settings';
// import { watchAdForStamina, watchAdForRevive } from '../core/ad';

const SWIPE_THRESHOLD = 20;
const DOUBLE_TAP_TIME = 300;

export default class Main {
  constructor() {
    this.staminaMgr = new StaminaManager();
    this.gridRenderer = new GridRenderer();
    this.resultRenderer = new ResultRenderer();
    this.tutorialRenderer = new TutorialRenderer();
    this.settingsRenderer = new SettingsRenderer();
    this.loadingRenderer = new LoadingRenderer();
    this.homeRenderer = new HomeRenderer(this.staminaMgr);
    this.ctx = canvas.getContext('2d');

    this.scene = 'home';
    this.resultTimer = null;
    this.hintPopupData = null;
    this.revealRemaining = 3;
    this.settingsOpen = false;
    this.settingsUnderScene = 'home';

    this.swipeMode = false;
    this.startX = 0;
    this.startY = 0;
    this.lastCell = null;
    this.lastTapRow = -1;
    this.lastTapCol = -1;
    this.lastTapTime = 0;

    this.animations = [];
    this.heartFlashTime = 0;

    wx.onTouchStart(this.onTouchStart.bind(this));
    wx.onTouchMove(this.onTouchMove.bind(this));
    wx.onTouchEnd(this.onTouchEnd.bind(this));

    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }

  loop() {
    this.render();
    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }

  render() {
    const ctx = this.ctx;
    const now = Date.now();

    ctx.setTransform(SCREEN_DPR, 0, 0, SCREEN_DPR, 0, 0);

    if (this.scene === 'home') {
      this.homeRenderer.render(ctx, this.staminaMgr.get());
      if (this.settingsOpen) {
        this.settingsRenderer.render(ctx);
      }
      return;
    }

    if (this.scene === 'loading') {
      this.loadingRenderer.render(ctx);
      return;
    }

    if (this.scene === 'tutorial') {
      this.tutorialRenderer.render(ctx);
      return;
    }

    if (this.scene === 'result') {
      this.resultRenderer.render(ctx, this.resultData);
      if (this.settingsOpen) {
        this.settingsRenderer.render(ctx);
      }
      return;
    }

    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.fillStyle = '#f1f2f4';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    this.animations = this.animations.filter(function (a) {
      return now - a.startTime < a.duration;
    });

    this.gridRenderer.render(ctx, this.grid, this.animations, now);
    this.gridRenderer.renderCoordinates(ctx);

    this.gridRenderer.renderTopBar(
      ctx, this.staminaMgr.get(), this.lives, this.maxLives,
      this.heartFlashTime
    );
    this.gridRenderer.renderRuleCard(ctx);

    var remainingSec;
    if (this.isWin || this.isFailed) {
      remainingSec = Math.max(0, this.timeLimit - Math.floor((this.endTime - this.startTime) / 1000));
    } else {
      remainingSec = Math.max(0, this.timeLimit - Math.floor((Date.now() - this.startTime) / 1000));
      if (remainingSec <= 0 && !this.isTimeUp) {
        this.isTimeUp = true;
        this.endTime = Date.now();
        var self3 = this;
        this.resultTimer = setTimeout(function () { self3.goResult(false); }, 300);
      }
    }
    this.gridRenderer.renderStatusCards(ctx, this.foundPonies, this.totalPonies, remainingSec);
    this.gridRenderer.renderBottomBar(ctx, this.hintsRemaining, this.revealRemaining);

    if (this.hintPopupData) {
      this.gridRenderer.renderHintPopup(ctx, this.hintPopupData, this.grid);
    }

    if (this.settingsOpen) {
      this.settingsRenderer.render(ctx);
    }
  }

  goHome() {
    if (this.resultTimer) { clearTimeout(this.resultTimer); this.resultTimer = null; }
    this.scene = 'home';
  }

  goResult(isWin) {
    var elapsed = this.endTime - this.startTime;
    this.resultData = {
      isWin: isWin,
      foundPonies: this.foundPonies,
      totalPonies: this.totalPonies,
      wrongCount: this.wrongCount,
      elapsed: elapsed,
      remainingLives: this.lives,
      maxLives: this.maxLives,
      label: this.gridRenderer.difficultyLabel(this.config),
      isFail: !isWin,
    };
    this.scene = 'result';
    if (isWin) {
      Audio.win();
    } else {
      Audio.fail();
    }
  }

  startGame() {
    if (!this.staminaMgr.consume()) {
      wx.showToast({ title: '体力不足，请等待恢复', icon: 'none', duration: 1500 });
      return false;
    }

    this.scene = 'loading';
    this.loadingRenderer.reset();

    var self = this;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var puzzle = generatePuzzle();
        self.config = puzzle.config;
        self.grid = puzzle.grid;
        self.foundPonies = 0;
        self.wrongCount = 0;
        self.totalPonies = puzzle.config.colorCount;
        self.isWin = false;
        self.isFailed = false;
        self.lives = 2;
        self.maxLives = 2;
        self.hintsRemaining = 3;
        self.revealRemaining = 3;
        self.resultTimer = null;
        self.hintPopupData = null;
        self.timeLimit = puzzle.config.timeLimit || 300;
        self.isTimeUp = false;
        self.startTime = Date.now();
        self.endTime = 0;
        self.animations = [];
        self.heartFlashTime = 0;
        self.gridRenderer.init(self.config.rows, self.config.cols);
        self.scene = 'game';
      });
    });

    return true;
  }

  onTouchStart(e) {
    if (this.scene === 'loading') return;
    if (this.isFailed) return;
    const touch = e.touches[0];

    if (this.settingsOpen) {
      if (this.settingsRenderer.isSliding(touch.clientX, touch.clientY)) {
        this.settingsRenderer.setVolumeFromPos(touch.clientX);
      }
      return;
    }

    if (this.scene === 'home' || this.scene === 'result' || this.scene === 'tutorial' || this.hintPopupData) return;

    const cell = this.gridRenderer.getCellByPos(touch.clientX, touch.clientY);

    this.swipeMode = false;
    this.swipeDirection = null;
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.lastCell = cell;

    if (cell) {
      const gridCell = this.grid[cell.row][cell.col];
      if (gridCell.state === CELL_STATE.HIDDEN) {
        this.swipeDirection = 'mark';
      } else if (gridCell.state === CELL_STATE.MARKED) {
        this.swipeDirection = 'unmark';
      } else {
        this.swipeDirection = null;
      }
    }
  }

  onTouchMove(e) {
    if (this.isFailed) return;
    const touch = e.touches[0];

    if (this.settingsOpen && this.settingsRenderer.isSliding(touch.clientX, touch.clientY)) {
      this.settingsRenderer.setVolumeFromPos(touch.clientX);
      return;
    }

    if (this.settingsOpen) return;

    if (this.scene === 'home' || this.scene === 'result' || this.scene === 'tutorial' || this.hintPopupData) return;
    const dx = Math.abs(touch.clientX - this.startX);
    const dy = Math.abs(touch.clientY - this.startY);

    if (!this.swipeMode && (dx > SWIPE_THRESHOLD || dy > SWIPE_THRESHOLD)) {
      this.swipeMode = true;

      const startCell = this.gridRenderer.getCellByPos(this.startX, this.startY);
      if (startCell) {
        this.applySwipeAction(startCell.row, startCell.col);
      }
    }

    if (!this.swipeMode) return;

    const cell = this.gridRenderer.getCellByPos(touch.clientX, touch.clientY);
    if (!cell) return;

    if (!this.lastCell || cell.row !== this.lastCell.row || cell.col !== this.lastCell.col) {
      this.applySwipeAction(cell.row, cell.col);
      this.lastCell = cell;
    }
  }

  onTouchEnd(e) {
    if (this.swipeMode) {
      this.swipeMode = false;
      this.swipeDirection = null;
      return;
    }

    const touch = e.changedTouches[0];

    if (this.settingsOpen) {
      var hitS = this.settingsRenderer.getHitTarget(touch.clientX, touch.clientY);
      if (hitS === 'toggle_on') {
        Audio.soundEnabled = true;
        Audio.button();
        return;
      }
      if (hitS === 'toggle_off') {
        Audio.soundEnabled = false;
        return;
      }
      if (this.settingsRenderer.isInCard(touch.clientX, touch.clientY)) {
        return;
      }
      this.settingsOpen = false;
      return;
    }

    if (this.hintPopupData) {
      this.hintPopupData = null;
      this.gridRenderer.clearHint();
      return;
    }

    if (this.scene === 'home') {
      const hit = this.homeRenderer.getHitTarget(touch.clientX, touch.clientY);
      if (hit === 'start') {
        this.startGame();
      } else if (hit === 'ad') {
        this.staminaMgr.adRecover();
        wx.showToast({ title: '体力 +1', icon: 'success', duration: 1000 });
      } else if (hit === 'help') {
        this.scene = 'tutorial';
        this.tutorialRenderer.page = 0;
      } else if (hit === 'settings') {
        this.settingsOpen = true;
        this.settingsUnderScene = 'home';
        Audio.button();
      }
      return;
    }

    if (this.scene === 'tutorial') {
      var hitT = this.tutorialRenderer.getHitBtn(touch.clientX, touch.clientY);
      if (hitT === 'next') {
        if (this.tutorialRenderer.isLastPage) {
          this.scene = 'home';
        } else {
          this.tutorialRenderer.page++;
        }
      } else if (hitT === 'prev') {
        this.tutorialRenderer.page--;
      }
      return;
    }

    if (this.scene === 'result') {
      const idx = this.resultRenderer.getHitBtn(touch.clientX, touch.clientY);
      if (idx === 0) {
        if (!this.startGame()) {
          this.goHome();
        }
      } else if (idx === 1) {
        if (this.resultData.isFail) {
          this.lives = this.maxLives;
          this.isFailed = false;
          this.isWin = false;
          this.scene = 'game';
        } else {
          this.goHome();
        }
      } else if (idx === 2) {
        this.goHome();
      }
      return;
    }

    if (this.gridRenderer.isInSettingsBtn(touch.clientX, touch.clientY)) {
      Audio.button();
      this.settingsOpen = true;
      this.settingsUnderScene = 'game';
      return;
    }

    if (this.gridRenderer.isInHomeBtn(touch.clientX, touch.clientY)) {
      this.gridRenderer.clearHint();
      this.goHome();
      return;
    }

    if (this.gridRenderer.isInRevealBtn(touch.clientX, touch.clientY)) {
      this.useReveal();
      return;
    }

    if (this.gridRenderer.isInHintBtn(touch.clientX, touch.clientY)) {
      this.useHint();
      return;
    }

    if (this.gridRenderer.isInClearBtn(touch.clientX, touch.clientY)) {
      this.clearAllMarks();
      return;
    }

    if (this.gridRenderer.isInCoordBtn(touch.clientX, touch.clientY)) {
      this.gridRenderer.toggleCoords();
      return;
    }

    const cell = this.gridRenderer.getCellByPos(touch.clientX, touch.clientY);
    if (!cell) return;

    const now = Date.now();
    const gridCell = this.grid[cell.row][cell.col];

    if (gridCell.state === CELL_STATE.CORRECT || gridCell.state === CELL_STATE.WRONG) return;

    if (
      gridCell.state === CELL_STATE.MARKED &&
      cell.row === this.lastTapRow &&
      cell.col === this.lastTapCol &&
      now - this.lastTapTime < DOUBLE_TAP_TIME
    ) {
      this.revealCell(cell.row, cell.col);
      this.lastTapRow = -1;
      this.lastTapCol = -1;
      this.lastTapTime = 0;
      return;
    }

    if (gridCell.state === CELL_STATE.MARKED) {
      this.toggleMark(cell.row, cell.col);
    } else {
      this.toggleMark(cell.row, cell.col);
      this.lastTapRow = cell.row;
      this.lastTapCol = cell.col;
      this.lastTapTime = now;
    }
  }

  applySwipeAction(row, col) {
    const cell = this.grid[row][col];
    if (cell.state === CELL_STATE.CORRECT || cell.state === CELL_STATE.WRONG) return;

    this.gridRenderer.clearHint();

    if (this.swipeDirection === 'mark' && cell.state === CELL_STATE.HIDDEN) {
      cell.state = CELL_STATE.MARKED;
      Audio.mark();
      this.animations.push({ row: row, col: col, type: 'mark', startTime: Date.now(), duration: 120 });
    } else if (this.swipeDirection === 'unmark' && cell.state === CELL_STATE.MARKED) {
      cell.state = CELL_STATE.HIDDEN;
    }
  }

  toggleMark(row, col) {
    if (this.isFailed) return;
    const cell = this.grid[row][col];
    if (cell.state === CELL_STATE.CORRECT || cell.state === CELL_STATE.WRONG) return;

    this.gridRenderer.clearHint();

    if (cell.state === CELL_STATE.MARKED) {
      cell.state = CELL_STATE.HIDDEN;
    } else {
      cell.state = CELL_STATE.MARKED;
      Audio.mark();
      this.animations.push({ row: row, col: col, type: 'mark', startTime: Date.now(), duration: 120 });
    }
  }

  revealCell(row, col) {
    if (this.isFailed) return;
    const cell = this.grid[row][col];
    if (cell.state === CELL_STATE.CORRECT || cell.state === CELL_STATE.WRONG) return;
    if (cell.state !== CELL_STATE.MARKED) return;

    this.gridRenderer.clearHint();

    if (cell.hasPony) {
      cell.state = CELL_STATE.CORRECT;
      Audio.correct();
      this.foundPonies++;
      this.animations.push({ row: row, col: col, type: 'correct', startTime: Date.now(), duration: 350 });

      if (this.foundPonies >= this.totalPonies) {
        this.isWin = true;
        this.endTime = Date.now();
        var self = this;
        this.resultTimer = setTimeout(function () { self.goResult(true); }, 400);
      }
    } else {
      cell.state = CELL_STATE.WRONG;
      Audio.wrong();
      this.wrongCount++;
      this.lives = Math.max(0, this.lives - 1);
      this.animations.push({ row: row, col: col, type: 'wrong', startTime: Date.now(), duration: 250 });
      this.heartFlashTime = Date.now();

      if (this.lives <= 0 && !this.isFailed) {
        this.isFailed = true;
        this.endTime = Date.now();
        var self2 = this;
        this.resultTimer = setTimeout(function () { self2.goResult(false); }, 300);
      }
    }
  }

  clearAllMarks() {
    for (let r = 0; r < this.config.rows; r++) {
      for (let c = 0; c < this.config.cols; c++) {
        if (this.grid[r][c].state === CELL_STATE.MARKED) {
          this.grid[r][c].state = CELL_STATE.HIDDEN;
        }
      }
    }
    this.gridRenderer.clearHint();
  }

  useHint() {
    if (this.hintsRemaining <= 0) {
      this.hintsRemaining++;
      wx.showToast({ title: '暂未接入广告，已免费赠送1次提示', icon: 'none', duration: 1500 });
    }

    var result = this.computeHint();
    if (!result) return;

    this.hintsRemaining--;

    if (result.highlight && result.highlight.length > 0) {
      for (var hi = 0; hi < result.highlight.length; hi++) {
        var hc = result.highlight[hi];
        if (this.grid[hc.row][hc.col].state === CELL_STATE.HIDDEN && !this.grid[hc.row][hc.col].hasPony) {
          this.grid[hc.row][hc.col].state = CELL_STATE.MARKED;
        }
      }
    }

    this.hintPopupData = result;

    this.gridRenderer.clearHint();
    if (result.highlight && result.highlight.length > 0) {
      if (result.highlight.length === 1) {
        this.gridRenderer.setHintTarget(result.highlight[0].row, result.highlight[0].col, '');
      } else {
        this.gridRenderer.setHintTarget(result.highlight, '');
      }
    }
  }

  useReveal() {
    if (this.revealRemaining <= 0) {
      this.revealRemaining++;
      wx.showToast({ title: '暂未接入广告，已免费赠送1次揭晓', icon: 'none', duration: 1500 });
    }

    var grid = this.grid;
    var totalPonies = this.totalPonies;
    var rows = this.config.rows;
    var cols = this.config.cols;

    var found = {};
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (grid[r][c].state === CELL_STATE.CORRECT) {
          found[grid[r][c].colorId] = true;
        }
      }
    }

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (grid[r][c].hasPony && !found[grid[r][c].colorId] && grid[r][c].state !== CELL_STATE.CORRECT) {
          this.revealRemaining--;
          grid[r][c].state = CELL_STATE.CORRECT;
          this.foundPonies++;
          this.animations.push({ row: r, col: c, type: 'correct', startTime: Date.now(), duration: 350 });
          Audio.correct();
          if (this.foundPonies >= this.totalPonies) {
            this.isWin = true;
            this.endTime = Date.now();
            var self = this;
            this.resultTimer = setTimeout(function () { self.goResult(true); }, 400);
          }
          return;
        }
      }
    }
  }

  computeHint() {
    var grid = this.grid;
    var rows = this.config.rows;
    var cols = this.config.cols;
    var totalPonies = this.totalPonies;

    var revealed = [];
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (grid[r][c].state === CELL_STATE.CORRECT) {
          revealed.push({ row: r, col: c, colorId: grid[r][c].colorId });
        }
      }
    }

    var unrevealedColors = [];
    for (var k = 0; k < totalPonies; k++) {
      var found = false;
      for (var ri = 0; ri < revealed.length; ri++) {
        if (revealed[ri].colorId === k) { found = true; break; }
      }
      if (!found) unrevealedColors.push(k);
    }
    if (unrevealedColors.length === 0) return null;

    var colorValid = {};
    var colorEliminated = {};
    for (var ci = 0; ci < unrevealedColors.length; ci++) {
      var co = unrevealedColors[ci];
      var valid = [];
      var elim = [];
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          if (grid[r][c].colorId !== co) continue;
          if (grid[r][c].state === CELL_STATE.CORRECT) continue;
          if (grid[r][c].state === CELL_STATE.WRONG) continue;
          var blocked = false;
          for (var pi = 0; pi < revealed.length; pi++) {
            var p = revealed[pi];
            if (r === p.row || c === p.col) { blocked = true; break; }
            if (Math.abs(r - p.row) <= 1 && Math.abs(c - p.col) <= 1) { blocked = true; break; }
          }
          if (blocked) { elim.push({ row: r, col: c }); }
          else { valid.push({ row: r, col: c }); }
        }
      }
      colorValid[co] = valid;
      colorEliminated[co] = elim;
    }

    for (var ci = 0; ci < unrevealedColors.length; ci++) {
      var co = unrevealedColors[ci];
      if (colorValid[co].length === 1) {
        var vc = colorValid[co][0];
        if (grid[vc.row][vc.col].state === CELL_STATE.MARKED) {
          return { message: COLOR_PALETTE[co].name + '色的小马只能在这里了！请双击揭晓🐴', highlight: [vc], ponyCell: vc };
        }
        return { message: COLOR_PALETTE[co].name + '色只剩这一个位置！请先画✕再双击揭晓', highlight: [vc], ponyCell: vc };
      }
    }

    for (var ci = 0; ci < unrevealedColors.length; ci++) {
      var coRE = unrevealedColors[ci];
      var validCandidates = colorValid[coRE];
      if (validCandidates.length === 0) continue;

      var sameRow = validCandidates[0].row;
      var allSameRow = true;
      for (var vi = 0; vi < validCandidates.length; vi++) {
        if (validCandidates[vi].row !== sameRow) { allSameRow = false; break; }
      }
      if (allSameRow) {
        if (validCandidates.length === 2) {
          var otherColorInRow = [];
          var rIdx = sameRow;
          for (var c2 = 0; c2 < cols; c2++) {
            if (grid[rIdx][c2].colorId === coRE) continue;
            if (grid[rIdx][c2].state === CELL_STATE.HIDDEN) otherColorInRow.push({ row: rIdx, col: c2 });
          }
          if (otherColorInRow.length > 0) {
            return { message: COLOR_PALETTE[coRE].name + '色小马必定在第' + (sameRow + 1) + '行（仅2个候选），同行其他颜色请画✕', highlight: otherColorInRow, ponyCell: null };
          }
        } else {
          var otherRowCells = [];
          for (var r = 0; r < rows; r++) {
            if (r === sameRow) continue;
            for (var c = 0; c < cols; c++) {
              if (grid[r][c].colorId !== coRE) continue;
              if (grid[r][c].state === CELL_STATE.HIDDEN) otherRowCells.push({ row: r, col: c });
            }
          }
          if (otherRowCells.length > 0) {
            return { message: COLOR_PALETTE[coRE].name + '色小马必定在第' + (sameRow + 1) + '行（该行只有此颜色），其他行请画✕', highlight: otherRowCells, ponyCell: null };
          }
        }
      }

      var sameCol = validCandidates[0].col;
      var allSameCol = true;
      for (var vi = 0; vi < validCandidates.length; vi++) {
        if (validCandidates[vi].col !== sameCol) { allSameCol = false; break; }
      }
      if (allSameCol) {
        if (validCandidates.length === 2) {
          var otherColorInCol = [];
          var cIdx = sameCol;
          for (var r2 = 0; r2 < rows; r2++) {
            if (grid[r2][cIdx].colorId === coRE) continue;
            if (grid[r2][cIdx].state === CELL_STATE.HIDDEN) otherColorInCol.push({ row: r2, col: cIdx });
          }
          if (otherColorInCol.length > 0) {
            return { message: COLOR_PALETTE[coRE].name + '色小马必定在第' + (sameCol + 1) + '列（仅2个候选），同列其他颜色请画✕', highlight: otherColorInCol, ponyCell: null };
          }
        } else {
          var otherColCells = [];
          for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
              if (c === sameCol) continue;
              if (grid[r][c].colorId !== coRE) continue;
              if (grid[r][c].state === CELL_STATE.HIDDEN) otherColCells.push({ row: r, col: c });
            }
          }
          if (otherColCells.length > 0) {
            return { message: COLOR_PALETTE[coRE].name + '色小马必定在第' + (sameCol + 1) + '列', highlight: otherColCells, ponyCell: null };
          }
        }
      }
    }

    for (var ci = 0; ci < unrevealedColors.length; ci++) {
      var coIC = unrevealedColors[ci];
      var validCandidates = colorValid[coIC];
      if (validCandidates.length <= 2) continue;
      var colsCount = {};
      for (var vi = 0; vi < validCandidates.length; vi++) {
        var vc = validCandidates[vi];
        if (colsCount[vc.col] === undefined) colsCount[vc.col] = [];
        colsCount[vc.col].push(vc.row);
      }
      for (var colKey in colsCount) {
        if (colsCount[colKey].length === 2) {
          var cNum = parseInt(colKey);
          var row1 = colsCount[colKey][0];
          var row2 = colsCount[colKey][1];
          var otherRowCells = [];
          for (var oci = 0; oci < unrevealedColors.length; oci++) {
            var otherCo = unrevealedColors[oci];
            if (otherCo === coIC) continue;
            for (var gr = 0; gr < rows; gr++) {
              if (gr !== row1 && gr !== row2) continue;
              if (grid[gr][cNum].colorId !== otherCo) continue;
              if (grid[gr][cNum].state === CELL_STATE.HIDDEN) otherRowCells.push({ row: gr, col: cNum });
            }
          }
          if (otherRowCells.length > 0) {
            return { message: COLOR_PALETTE[coIC].name + '色在第' + (cNum + 1) + '列仅有2个候选(' + (row1 + 1) + ',' + (row2 + 1) + ')，同列同行请画✕', highlight: otherRowCells, ponyCell: null };
          }
        }
      }
    }

    for (var ci = 0; ci < unrevealedColors.length; ci++) {
      var coWM = unrevealedColors[ci];
      var validCands = colorValid[coWM];
      if (validCands.length === 0) continue;
      var allMarked = true;
      for (var vi = 0; vi < validCands.length; vi++) {
        if (grid[validCands[vi].row][validCands[vi].col].state !== CELL_STATE.MARKED) {
          allMarked = false;
          break;
        }
      }
      if (allMarked) {
        return { message: COLOR_PALETTE[coWM].name + '色的所有候选都被标记了✕，请确认是否有标记错误', highlight: [], ponyCell: null };
      }
    }

    var bestElimCol = -1;
    var bestElimCells = [];
    for (var ci = 0; ci < unrevealedColors.length; ci++) {
      var coE = unrevealedColors[ci];
      var elimList = [];
      for (var ei = 0; ei < colorEliminated[coE].length; ei++) {
        var ec = colorEliminated[coE][ei];
        if (grid[ec.row][ec.col].state === CELL_STATE.HIDDEN) elimList.push(ec);
      }
      if (elimList.length > bestElimCells.length) {
        bestElimCol = coE;
        bestElimCells = elimList;
      }
    }

    if (bestElimCells.length > 0) {
      return {
        message: COLOR_PALETTE[bestElimCol].name + '色中，这些格子被已找到的小马排除，不可能藏小马，请画✕',
        highlight: bestElimCells,
        ponyCell: null
      };
    }

    var bestContraCol = -1;
    var bestContraCells = [];
    var lockedPony = null;

    for (var ci = 0; ci < unrevealedColors.length; ci++) {
      var coC = unrevealedColors[ci];
      var candidates = colorValid[coC];
      var solvableCount = 0;
      var lastSolvable = null;
      var localContra = [];

      for (var hi = 0; hi < candidates.length; hi++) {
        var cell = candidates[hi];
        var canSolve = this.checkSolvable(grid, rows, cols, unrevealedColors, revealed, cell.row, cell.col, coC, ci);
        if (canSolve) {
          solvableCount++;
          lastSolvable = cell;
        } else {
          if (grid[cell.row][cell.col].state === CELL_STATE.HIDDEN) localContra.push(cell);
        }
      }

      if (solvableCount === 1 && lastSolvable) {
        lockedPony = lastSolvable;
        lockedPony.colorId = coC;
        break;
      }

      if (localContra.length > bestContraCells.length) {
        bestContraCol = coC;
        bestContraCells = localContra;
      }
    }

    if (lockedPony) {
      if (grid[lockedPony.row][lockedPony.col].state === CELL_STATE.MARKED) {
        return { message: '推理发现：如果小马不在' + COLOR_PALETTE[lockedPony.colorId].name + '色的这里，其他小马就无处可放！请双击揭晓🐴', highlight: [lockedPony], ponyCell: lockedPony };
      }
      return { message: '推理发现：' + COLOR_PALETTE[lockedPony.colorId].name + '色小马只能在这里，否则无解！请画✕标记', highlight: [lockedPony], ponyCell: lockedPony };
    }

    if (bestContraCells.length > 0) {
      return {
        message: '推理发现：' + COLOR_PALETTE[bestContraCol].name + '色中，如果小马在这些位置，其他颜色将无解，请排除✕',
        highlight: bestContraCells,
        ponyCell: null
      };
    }

    var bestColor = -1;
    var bestList = null;
    var bestCount = Infinity;
    for (var ci2 = 0; ci2 < unrevealedColors.length; ci2++) {
      var co2 = unrevealedColors[ci2];
      var hidden = [];
      for (var hi = 0; hi < colorValid[co2].length; hi++) {
        if (grid[colorValid[co2][hi].row][colorValid[co2][hi].col].state === CELL_STATE.HIDDEN) {
          hidden.push(colorValid[co2][hi]);
        }
      }
      if (hidden.length >= 2 && hidden.length < bestCount) {
        bestCount = hidden.length;
        bestColor = co2;
        bestList = hidden;
      }
    }

    if (bestColor >= 0 && bestList && bestList.length > 0) {
      return {
        message: COLOR_PALETTE[bestColor].name + '色有' + bestList.length + '个可能藏小马的位置，建议从这里入手推理',
        highlight: bestList,
        ponyCell: null
      };
    }

    return { message: '暂无可推导的线索，请先揭晓一些小马', highlight: [], ponyCell: null };
  }

  checkSolvable(grid, rows, cols, unrevealedColors, revealed, testRow, testCol, testColor, testColorIdx) {
    var placed = [];
    for (var i = 0; i < revealed.length; i++) {
      placed.push({ row: revealed[i].row, col: revealed[i].col });
    }
    placed.push({ row: testRow, col: testCol });

    var remaining = [];
    for (var i = 0; i < unrevealedColors.length; i++) {
      if (i !== testColorIdx) remaining.push(unrevealedColors[i]);
    }

    function backtrack(idx) {
      if (idx >= remaining.length) return true;
      var color = remaining[idx];

      var candidates = [];
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          if (grid[r][c].colorId !== color) continue;
          if (grid[r][c].state === CELL_STATE.CORRECT) continue;
          if (grid[r][c].state === CELL_STATE.WRONG) continue;

          var ok = true;
          for (var p = 0; p < placed.length; p++) {
            if (r === placed[p].row || c === placed[p].col) { ok = false; break; }
            if (Math.abs(r - placed[p].row) <= 1 && Math.abs(c - placed[p].col) <= 1) { ok = false; break; }
          }
          if (ok) candidates.push({ row: r, col: c });
        }
      }

      for (var ci = 0; ci < candidates.length; ci++) {
        placed.push(candidates[ci]);
        if (backtrack(idx + 1)) { placed.pop(); return true; }
        placed.pop();
      }
      return false;
    }

    return backtrack(0);
  }
}
