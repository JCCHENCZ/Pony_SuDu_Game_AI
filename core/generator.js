const COLOR_PALETTE = [
  { id: 0, bg: '#f2c46f', border: '#d4a855', name: '金黄' },
  { id: 1, bg: '#eab6c2', border: '#d498a5', name: '粉红' },
  { id: 2, bg: '#dcdc86', border: '#bfbf6a', name: '草绿' },
  { id: 3, bg: '#879ad2', border: '#6a7eb5', name: '蓝紫' },
  { id: 4, bg: '#df8674', border: '#c26b58', name: '橙红' },
  { id: 5, bg: '#b8adcd', border: '#9c90b0', name: '淡紫' },
  { id: 6, bg: '#7dbcdb', border: '#5fa0bf', name: '天蓝' },
  { id: 7, bg: '#c3e0ee', border: '#a5c4d5', name: '浅蓝' },
  { id: 8, bg: '#e89f6e', border: '#cc8555', name: '暖橙' },
  { id: 9, bg: '#d4a5c9', border: '#b789af', name: '丁香' },
  { id: 10, bg: '#8cbf8a', border: '#6ea36c', name: '翠绿' },
  { id: 11, bg: '#a0c9c4', border: '#82aba6', name: '湖青' },
];

const CELL_STATE = {
  HIDDEN: 'hidden',
  MARKED: 'marked',
  CORRECT: 'correct',
  WRONG: 'wrong',
};

function randomDifficulty() {
  const rand = Math.random();
  if (rand < 0.40) return { rows: 8, cols: 8, colorCount: 8, timeLimit: 360 };
  if (rand < 0.75) return { rows: 10, cols: 10, colorCount: 10, timeLimit: 360 };
  return { rows: 12, cols: 12, colorCount: 12, timeLimit: 360 };
}

function createGrid(rows, cols) {
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        row: r,
        col: c,
        colorId: 0,
        hasPony: false,
        state: CELL_STATE.HIDDEN,
      });
    }
    grid.push(row);
  }
  return grid;
}

function assignColors(grid, colorCount) {
  const rows = grid.length;
  const cols = grid[0].length;
  const totalCells = rows * cols;
  const colorQueues = [];
  const EMPTY = -1;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      grid[r][c].colorId = EMPTY;
    }
  }

  for (let k = 0; k < colorCount; k++) {
    let row, col;
    do {
      row = Math.floor(Math.random() * rows);
      col = Math.floor(Math.random() * cols);
    } while (grid[row][col].colorId !== EMPTY);
    grid[row][col].colorId = k;
    colorQueues.push({ colorId: k, cells: [{ row, col }] });
  }

  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  let filled = colorCount;

  while (filled < totalCells) {
    const order = colorQueues.map((q, i) => i);
    shuffle(order);

    let grew = false;
    for (let qi = 0; qi < order.length; qi++) {
      const q = colorQueues[order[qi]];
      shuffle(q.cells);

      for (let i = 0; i < q.cells.length; i++) {
        const { row, col } = q.cells[i];
        shuffle(dirs);

        for (let d = 0; d < dirs.length; d++) {
          const nr = row + dirs[d][0];
          const nc = col + dirs[d][1];
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].colorId === EMPTY) {
            grid[nr][nc].colorId = q.colorId;
            q.cells.push({ row: nr, col: nc });
            filled++;
            grew = true;
            i = q.cells.length;
            break;
          }
        }
      }
      if (grew) break;
    }

    if (!grew) break;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].colorId === EMPTY) {
        grid[r][c].colorId = 0;
      }
    }
  }
}

function getCellsByColor(grid, colorId) {
  const cells = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c].colorId === colorId) {
        cells.push({ row: r, col: c });
      }
    }
  }
  return cells;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function isValidPlacement(ponies, newRow, newCol) {
  for (let i = 0; i < ponies.length; i++) {
    const p = ponies[i];
    if (p.row === newRow) return false;
    if (p.col === newCol) return false;
    if (Math.abs(p.row - newRow) <= 1 && Math.abs(p.col - newCol) <= 1) {
      return false;
    }
  }
  return true;
}

function placePonies(grid, colorCount) {
  var ponies = [];
  var iterations = 0;
  var MAX_ITER = 500000;

  function backtrack(colorIndex) {
    if (colorIndex >= colorCount) return true;
    if (iterations++ > MAX_ITER) return false;

    var candidates = getCellsByColor(grid, colorIndex);
    shuffle(candidates);

    for (var i = 0; i < candidates.length; i++) {
      var row = candidates[i].row;
      var col = candidates[i].col;
      if (isValidPlacement(ponies, row, col)) {
        ponies.push({ row, col, color: colorIndex });
        if (backtrack(colorIndex + 1)) return true;
        ponies.pop();
      }
    }
    return false;
  }

  if (backtrack(0)) {
    for (var i = 0; i < ponies.length; i++) {
      grid[ponies[i].row][ponies[i].col].hasPony = true;
    }
    return true;
  }
  return false;
}

function hasMultipleSolutions(grid, colorCount) {
  var ponies = [];
  var foundLimit = 0;
  var iterations = 0;
  var MAX_ITER = 800000;

  var colorCells = [];
  for (var k = 0; k < colorCount; k++) {
    colorCells.push(getCellsByColor(grid, k));
  }

  function backtrackSol(colorIndex) {
    if (foundLimit >= 2) return true;
    if (colorIndex >= colorCount) {
      foundLimit++;
      return foundLimit >= 2;
    }
    if (iterations++ > MAX_ITER) return false;

    var candidates = colorCells[colorIndex];
    for (var i = 0; i < candidates.length; i++) {
      var row = candidates[i].row;
      var col = candidates[i].col;
      if (isValidPlacement(ponies, row, col)) {
        ponies.push({ row: row, col: col, color: colorIndex });
        if (backtrackSol(colorIndex + 1)) return true;
        ponies.pop();
        if (foundLimit >= 2) return true;
      }
    }
    return false;
  }

  return backtrackSol(0);
}

function generatePuzzle() {
  var config = randomDifficulty();
  var deadline = Date.now() + 3000;

  for (var attempt = 0; attempt < 200; attempt++) {
    if (Date.now() > deadline) break;

    var grid = createGrid(config.rows, config.cols);
    assignColors(grid, config.colorCount);

    if (!placePonies(grid, config.colorCount)) continue;
    if (!hasMultipleSolutions(grid, config.colorCount)) {
      return { config: config, grid: grid };
    }
  }

  var fallbackConfig = {
    rows: config.rows,
    cols: config.cols,
    colorCount: Math.max(4, config.colorCount - 1),
  };
  var grid = createGrid(fallbackConfig.rows, fallbackConfig.cols);
  assignColors(grid, fallbackConfig.colorCount);
  if (!placePonies(grid, fallbackConfig.colorCount)) {
    fallbackConfig.colorCount = Math.max(3, fallbackConfig.colorCount - 1);
    assignColors(grid, fallbackConfig.colorCount);
    placePonies(grid, fallbackConfig.colorCount);
  }
  return { config: fallbackConfig, grid };
}

export { generatePuzzle, randomDifficulty, CELL_STATE, COLOR_PALETTE, createGrid, assignColors };
