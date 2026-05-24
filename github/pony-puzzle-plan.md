# 小马谜题 (Pony Puzzle) — 微信小程序游戏规划文档

---

## 一、游戏概述

**小马谜题**是一款融合了"逻辑推理"与"扫雷标记"玩法的微信小程序益智游戏。玩家需要在彩色的网格中找出所有隐藏的小马，利用行列约束、颜色约束和空间隔离约束进行推理，并通过类似扫雷的标记/揭晓机制来验证自己的判断。每局难度由系统随机分配，消耗体力开始游戏，猜错会扣减生命值，生命耗尽可观看广告复活。

---

## 二、网格规格与难度分级

| 难度 | 网格尺寸 | 颜色种类（= 小马数量） | 出现概率 |
|------|----------|------------------------|----------|
| 简单 | 8 × 8 | 8 | 40% |
| 中等 | 10 × 10 | 10 | 35% |
| 困难 | 12 × 12 | 12 | 25% |

> **系统随机分配难度**：玩家不手动选择难度，每次开始新游戏时由系统按概率随机抽取一个难度档位。
>
> **小马数量规则**：对于 N×N 的方形网格，小马数量 = N（8×8=8只, 10×10=10只, 12×12=12只）。每种颜色在网格上有若干个相邻格子（洪水填充区域），但只有其中一个格子藏有小马。

---

## 三、核心规则

### 3.1 约束条件（四条铁律）

| # | 规则 | 说明 |
|---|------|------|
| R1 | **行唯一** | 每一行最多只能有 1 匹小马 |
| R2 | **列唯一** | 每一列最多只能有 1 匹小马 |
| R3 | **3×3 隔离** | 以小马为中心的 3×3 区域内不能有其它小马（水平、垂直、对角线方向均隔离至少 1 格） |
| R4 | **颜色唯一** | 每种颜色恰好有 1 匹小马（小马总数 = 颜色种类数） |

**R3 示意**：

```
  ■ ■ ■      ← 小马在中心，周围 8 格 + 自身 = 3×3
  ■ 🐴 ■      ← 这 9 个格子内不能再有其它小马
  ■ ■ ■
```

等价表述：**任意两匹小马的曼哈顿距离 ≤ 1 即为非法**（含对角相邻）。

### 3.2 约束推导示例

在 8×8、8 色的简单关卡中：

- R1 + R2 保证最多放置 min(行数, 列数) 匹小马，即 8 匹上限；
- R4 将小马数锁定为 8 匹（8 色），进一步收窄可能性；
- R3 确保 8 匹小马在空间上彼此远离，形成"互斥区域"；
- **玩家的推理链**：先看某种颜色在哪些行/列有分布 → 排除与已知小马冲突的行/列 → 锁定唯一可行格子。

---

## 四、扫雷式交互设计

### 4.1 核心交互逻辑

```
格子初始状态：覆盖（显示该格颜色，但内容隐藏）

┌─────────────────────────────────────────────────────┐
│                                                      │
│   第一次点击（标记）                                    │
│   ├─ 格子显示灰色 "X" 标记                              │
│   └─ 表示玩家怀疑此处有小马（相当于扫雷右键插旗）          │
│                                                      │
│   第二次点击同一格子（揭晓）                              │
│   ├─ 如果此处确实有小马 → 显示 🐴 小马图标（绿色/成功）     │
│   └─ 如果此处没有小马 → 显示红色 "✘"（猜错标记）           │
│                                                      │
│   第三次点击同一格子（取消/重置）                          │
│   └─ 已揭晓的格子不支持取消；标记状态的 "X" 可以再点取消     │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 4.2 滑动连续标记（手指滑动批量画 X）

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   手指在网格上滑动 → 路径经过的所有 hidden 格子连续标上 X       │
│                                                              │
│   规则：                                                      │
│   ├─ hidden（未标记）格子 → 标上 X（标记）                     │
│   ├─ marked（用户主动标记）格子 → 取消 X，回到 hidden（toggle） │
│   ├─ 已揭晓（correct/wrong）的格子直接跳过、不可操作            │
│   └─ 不会触发揭晓逻辑（滑动只是标记/取消标记，不是揭晓）        │
│                                                              │
│   交互示例：                                                   │
│                                                              │
│      滑动手势（首次标记）：  · ──→ · ──→ · ──→ ·              │
│      经过的 hidden 格子： [X]    [X]    [X]    [X] ← 连续画叉  │
│                                                              │
│      滑动手势（再次滑过）：  · ──→ · ──→   ·   ──→  ·         │
│      经过的 marked 格子：  复原   复原  跳过(揭晓)   复原      │
│                             ↑ 非错误揭晓的 X 可被滑动取消      │
│                                                              │
│   与点击的区分：                                               │
│   ├─ 指尖按下后未移动（或位移 < 1格） → 视为点击               │
│   └─ 指尖移动跨越格子边界 → 视为滑动，进入连续标记模式          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 4.2.1 全部清除标记

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   🗑 一键清除所有 X 标记                                       │
│                                                              │
│   触发：点击游戏界面的「清除标记」按钮                           │
│                                                              │
│   效果：遍历整个网格，将所有 marked 状态的格子恢复为 hidden      │
│                                                              │
│   不受影响：                                                   │
│   ├─ 已揭晓的格子（correct/wrong）不受影响                     │
│   └─ hidden 状态的格子不受影响                                 │
│                                                              │
│   使用场景：                                                   │
│   ├─ 推理思路改变，想推翻重来                                  │
│   ├─ 标记过多导致视觉混乱                                      │
│   └─ 发现之前的标记逻辑有误，需要批量清理                       │
│                                                              │
│   区分要点：                                                   │
│   ├─ 清除标记 ≠ 撤销错误揭晓 → 只有用户主动画的 X 会被清除      │
│   └─ 红色 ✘（wrong 状态）是错误揭晓结果，清除标记不会影响它     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 4.3 状态机

```
           tap1              tap2（揭晓）
 [hidden] ────→ [marked:X] ────→ [revealed:pony]   ← 猜对了
     ▲          │             ────→ [revealed:wrong]  ← 猜错了 → 扣 1 颗心
     │          │
     ├── tap 取消 ──┘
     │
     ├── 滑动经过 ──┘ （toggle：hidden↔marked）
     │
     └── 「清除标记」按钮（批量：marked→hidden）
```

### 4.4 生命值系统（扣血 & 死亡 & 复活）

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   ❤️ ❤️   初始 2 颗心                                     │
│                                                              │
│   每次揭晓猜错 → 扣 1 颗心                                     │
│   ├─ 扣到 1 颗心 → 爱心闪烁警告                                │
│   └─ 扣到 0 颗心 → 弹出失败界面                                │
│                                                              │
│   失败界面：                                                   │
│   ┌──────────────────────────────────────────┐               │
│   │         💔 很遗憾，生命耗尽！               │               │
│   │                                          │               │
│   │   已找到 🐴：3 / 8                        │               │
│   │   错误次数：2                              │               │
│   │   用时：02:15                              │               │
│   │                                          │               │
│   │   ┌──────────────────────────────┐       │               │
│   │   │     📺 观看广告复活            │       │  复活按钮     │
│   │   └──────────────────────────────┘       │               │
│   │   ┌──────────────────────────────┐       │               │
│   │   │     放弃                       │       │  放弃按钮     │
│   │   └──────────────────────────────┘       │               │
│   └──────────────────────────────────────────┘               │
│                                                              │
│   复活流程：                                                   │
│   点击"观看广告复活" → 播放微信激励视频广告                      │
│   ├─ 广告完整观看 → 恢复 2 颗心 ❤️❤️，游戏继续                  │
│   └─ 广告中途退出 → 复活失败，留在失败界面                      │
│                                                              │
│   注意：每局游戏最多复活 1 次，防止滥用                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 4.5 广告集成方案

使用微信小程序**激励视频广告**（`wx.createRewardedVideoAd`），本游戏有两处广告入口：

| 场景 | 触发条件 | 奖励 | 广告单元 |
|------|----------|------|----------|
| 复活 | 生命耗尽 → 点击"观看广告复活" | 恢复满血（2 心） | adUnitId_A |
| 获得体力 | 首页点击"获得体力"按钮 | +60 体力（= 15×4） | adUnitId_B |

```javascript
// 广告初始化（app.js）
const AD_UNITS = {
  revive: 'adunit-xxxxxxxxxxxxxxxx',   // 复活广告位
  stamina: 'adunit-yyyyyyyyyyyyyyyy',   // 体力广告位
};

function createRewardedVideoAd(adUnitId) {
  const ad = wx.createRewardedVideoAd({ adUnitId });
  ad.onError((err) => console.error('广告加载失败', err));
  return ad;
}

// 通用播放方法
function showRewardedAd(ad, onRewarded) {
  if (!ad) return;
  ad.onClose((res) => {
    if (res && res.isEnded) {
      onRewarded(); // 完整观看 → 发放奖励
    } else {
      wx.showToast({ title: '需要观看完广告才能获得奖励哦', icon: 'none' });
    }
  });
  ad.show().catch(() => {
    ad.load().then(() => ad.show());
  });
}
```

### 4.6 关于自动排雷

**明确不引入**扫雷式的"点击空白自动展开"机制。原因：
- 本游戏的核心乐趣在于**逻辑推理**，而非运气试探；
- 自动展开会破坏推理节奏，降低成就感；
- 每个格子的揭晓都需要玩家主动决策。

### 4.7 体力系统

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   ⚡ 体力上限：150                                             │
│                                                              │
│   消耗规则：                                                   │
│   ├─ 每开一局游戏消耗 15 体力                                  │
│   └─ 体力不足时点击开始 → 提示"体力不足，去看看广告吧~"          │
│                                                              │
│   恢复规则：                                                   │
│   ├─ 自动恢复：每 3 分钟恢复 1 点体力                          │
│   │   （现实世界时间，后台也会计时）                             │
│   └─ 广告获取：看一次广告获得 60 体力（= 15×4）                 │
│       └─ 按钮标签名："获得体力"                                │
│                                                              │
│   每日上限：                                                   │
│   ├─ 自动恢复每日最多 150 点（= 24h × 20点/h ≈ 480点/天的上限   │
│   │   但上限为 150，回满即停）                                 │
│   └─ 广告获取无每日次数限制（受广告平台频次限制）                │
│                                                              │
│   存储：体力值和最后更新时间记录在 wx.Storage 中                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

```javascript
// 体力系统核心逻辑（utils/stamina.js）
const STAMINA_CONFIG = {
  MAX: 150,                    // 体力上限
  COST_PER_GAME: 15,           // 每局消耗
  RECOVER_INTERVAL: 3 * 60,    // 恢复间隔（秒）= 3 分钟
  AD_REWARD: 60,               // 看广告获得体力 = 15×4
};

function getStamina() {
  const data = wx.getStorageSync('stamina') || { value: STAMINA_CONFIG.MAX, lastUpdate: Date.now() };
  const elapsed = Math.floor((Date.now() - data.lastUpdate) / 1000);
  const recovered = Math.floor(elapsed / STAMINA_CONFIG.RECOVER_INTERVAL);
  return Math.min(data.value + recovered, STAMINA_CONFIG.MAX);
}

function consumeStamina(amount) {
  const current = getStamina();
  if (current < amount) return false;
  wx.setStorageSync('stamina', { value: current - amount, lastUpdate: Date.now() });
  return true;
}

function addStamina(amount) {
  const current = getStamina();
  wx.setStorageSync('stamina', { value: Math.min(current + amount, STAMINA_CONFIG.MAX), lastUpdate: Date.now() });
}
```

---

## 五、关卡生成算法设计

### 5.1 整体流程

```
输入：网格行数 R、列数 C、颜色种类 K
输出：合法的谜题配置（颜色分布 + 小马位置）

Step 1：颜色分配
  将 R×C 个格子随机分配 K 种颜色，确保每种颜色至少出现在若干行/列中

Step 2：小马放置（约束求解）
  使用回溯搜索 + 随机化，为每种颜色选 1 个格子放置小马
  放置过程必须满足 R1~R3

Step 3：验证与重试
  回溯成功 → 输出
  回溯失败 → 回到 Step 1 重新分配颜色（设定最大重试次数，如 100）
```

### 5.2 颜色分配策略

```
function assignColors(rows, cols, colorCount):
    cells = 二维数组[rows][cols]
    
    // 策略1：随机分配（简单快速）
    for each cell:
        cell.color = random(0, colorCount - 1)
    
    // 策略2：区域分配（让颜色分布更"自然"）
    将网格划分 colorCount 个区域，每个区域主用一种颜色
    边界处随机混合
    
    // 必须验证：每种颜色至少出现 2 次以上
    // 且分布在不同行/列，否则无法产生有效推理路径
    
    // 推荐：使用"分行/列交错"模式
    将 K 种颜色以棋盘状或条纹状分布
    确保每种颜色在多个行和列中都有出现
```

### 5.3 小马放置（回溯算法）

```
function placePonies(cells, colorCount):
    ponies = []  // 已放置的小马 [{row, col, color}]
    
    function backtrack(colorIndex):
        if colorIndex == colorCount:
            return true  // 所有颜色的小马都已放置
        
        // 找出所有颜色为 colorIndex 的格子
        candidates = findCellsByColor(cells, colorIndex)
        // 随机打乱以增加谜题多样性
        shuffle(candidates)
        
        for each (row, col) in candidates:
            if isValidPlacement(ponies, row, col):
                ponies.push({row, col, color: colorIndex})
                if backtrack(colorIndex + 1):
                    return true
                ponies.pop()
        
        return false
    
    if backtrack(0):
        return ponies
    else:
        return FAILURE

function isValidPlacement(ponies, newRow, newCol):
    for each p in ponies:
        // R1: 行唯一
        if p.row == newRow: return false
        // R2: 列唯一
        if p.col == newCol: return false
        // R3: 3×3 隔离
        if abs(p.row - newRow) <= 1 AND abs(p.col - newCol) <= 1:
            return false
    return true
```

### 5.4 可行性保证

- 网格越大，回溯成功率越高；
- 简单位（8×8）起步颜色数 ≥ 8，每种颜色的格子需分布在多行多列，确保有效推理路径；
- 建议每种颜色的格子数 ≥ 3，且至少覆盖 2 个不同行和 2 个不同列；
- 极端情况下（颜色过多），可能无解，需要降级处理（减少 1 种颜色重试）。

---

## 六、微信小程序技术架构

### 6.1 技术选型

| 层面 | 选择 | 理由 |
|------|------|------|
| 框架 | 原生微信小程序 | 无需额外框架，包体小，启动快 |
| 语言 | TypeScript / JavaScript | 小程序原生支持 |
| 渲染 | WXML + WXSS | 微信小程序标准方案 |
| Canvas | 可选（用于复杂绘制） | 格子网格可直接用 View + Flex 布局实现 |
| 状态管理 | 小程序 globalData 或简单 Store | 单页面游戏，不需要复杂状态管理 |
| 数据持久化 | wx.setStorageSync | 存储进度、最佳成绩 |

### 6.2 项目目录结构

```
pony-puzzle-miniapp/
├── app.js                        # 小程序入口
├── app.json                      # 小程序配置
├── app.wxss                      # 全局样式
│
├── pages/
│   ├── index/                    # 首页（体力显示、开始游戏、获得体力）
│   │   ├── index.js
│   │   ├── index.wxml
│   │   └── index.wxss
│   │
│   ├── game/                     # 游戏主页面
│   │   ├── game.js               # 游戏核心逻辑
│   │   ├── game.wxml             # 游戏界面
│   │   ├── game.wxss             # 游戏样式
│   │   └── game.wxs              # WXS 辅助函数（可选）
│   │
│   └── result/                   # 结算页面
│       ├── result.js
│       ├── result.wxml
│       └── result.wxss
│
├── components/                   # 自定义组件
│   ├── game-board/               # 游戏棋盘组件
│   │   ├── game-board.js
│   │   ├── game-board.wxml
│   │   ├── game-board.wxss
│   │   └── game-board.json
│   │
│   └── game-cell/                # 单个格子组件
│       ├── game-cell.js
│       ├── game-cell.wxml
│       ├── game-cell.wxss
│       └── game-cell.json
│
├── core/                         # 纯逻辑层（与 UI 无关，可单测）
│   ├── generator.js              # 谜题生成器（颜色分配 + 回溯）
│   ├── validator.js              # 约束校验器
│   └── types.js                  # 类型定义（JSDoc 或 TS 声明）
│
├── utils/
│   ├── storage.js                # 本地存储封装
│   ├── stamina.js                # 体力系统（消耗/恢复/广告获取）
│   └── constants.js              # 常量（颜色映射、网格配置等）
│
└── assets/
    ├── icons/                    # 图标素材
    │   ├── pony.png              # 小马图标
    │   ├── flag_x.png            # X 标记图标
    │   └── flag_red_x.png        # 红色 X 图标
    └── sounds/                   # 音效（可选）
        ├── mark.mp3
        ├── reveal_correct.mp3
        └── reveal_wrong.mp3
```

### 6.3 核心数据结构

```javascript
/**
 * 单个格子的状态
 */
const CellState = {
  HIDDEN:  'hidden',   // 覆盖中
  MARKED:  'marked',   // 已标记 X
  CORRECT: 'correct',  // 揭晓：是小马
  WRONG:   'wrong',    // 揭晓：不是小马
};

/**
 * @typedef {Object} Cell
 * @property {number}  row       - 行号
 * @property {number}  col       - 列号
 * @property {number}  colorId   - 颜色编号 (0 ~ colorCount-1)
 * @property {boolean} hasPony   - 是否藏有小马（生成时确定，玩家不可见）
 * @property {string}  state     - 显示状态：CellState 之一
 */

/**
 * @typedef {Object} GameConfig
 * @property {number} rows       - 行数
 * @property {number} cols       - 列数
 * @property {number} colorCount - 颜色种类数（= 小马数）
 */

/**
 * @typedef {Object} GameData
 * @property {GameConfig} config
 * @property {Cell[][]}  grid
 * @property {number}    totalPonies    - 小马总数
 * @property {number}    foundPonies    - 已正确找到的小马数
 * @property {number}    wrongAttempts  - 猜错次数
 * @property {number}    maxLives       - 最大生命值（固定为 2）
 * @property {number}    lives          - 当前剩余生命值（❤️ 数量）
 * @property {boolean}   hasRevived     - 本局是否已复活过（每局限 1 次）
 * @property {number}    startTime      - 开始时间戳
 * @property {string}    status         - 'playing' | 'won' | 'lost'
 */

/**
 * @typedef {Object} StaminaData
 * @property {number} value       - 当前体力值
 * @property {number} lastUpdate  - 最后更新时间戳（毫秒）
 */
```

### 6.4 颜色方案设计

```javascript
// 支持 7~12 种颜色，按索引映射
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
```

### 6.5 微信激励视频广告接入要点

| 步骤 | 说明 |
|------|------|
| 1. 开通流量主 | 小程序后台 → 流量主 → 开通（需满足 1000 UV 门槛，开发阶段可用测试广告位） |
| 2. 创建广告位 | 流量主 → 广告管理 → 新建广告位 → 选择「激励视频」→ 获取 `adUnitId` |
| 3. 测试广告位 | 开发调试期间使用测试 ID：`adunit-xxxxxxxxxxxxxxxx`（微信官方提供） |
| 4. 预加载策略 | 游戏开始时即调用 `rewardedVideoAd.load()` 预加载，避免点击复活时等待 |
| 5. 异常处理 | `onError` 回调时降级为「免费复活」或提示用户稍后再试 |

---

## 七、游戏流程

### 7.1 完整生命周期

```
                    ┌──────────┐
                    │  首页     │
                    │ 显示体力  │
                    │ [开始游戏] │
                    └────┬─────┘
                         │ 点击开始 → 检查体力 ≥ 15
                         │ ├─ 不足 → 提示"体力不足，去看看广告吧~"
                         │ └─ 足够 → 扣 15 体力，系统随机抽取难度
                         ▼
                    ┌──────────┐    生成谜题    ┌──────────┐
                    │  游戏页   │ ──────────→  │  游戏中   │
                    │  初始化   │              │  推理标记  │
                    └──────────┘              └────┬─────┘
                                                   │
                     ┌─────────────────────────────┼──────────────────────┐
                     │                             │                      │
                     ▼                             ▼                      ▼
              猜错（扣 ❤️）                    全部找到                  ❤️ = 0
                     │                             │                      │
                     │                             ▼                      ▼
                     │                      ┌──────────┐           ┌──────────┐
                     │                      │  胜利页面  │           │  失败弹窗  │
                     │                      │  🎉 庆祝  │           │  💔 生命  │
                     │                      └────┬─────┘           │  耗尽     │
                     │                           │                 └────┬─────┘
                     │                 ┌─────────┴─────────┐           │
                     │                 │                   │    ┌──────┴──────┐
                     │                 ▼                   ▼    │             │
                     │           ┌──────────┐      ┌──────────┐ ▼             ▼
                     │           │ 🔄 再来   │      │ 🏠 返回   │      ┌──────────┐
                     │           │   一局    │      │   主页    │      │ 📺 看广告 │
                     │           └────┬─────┘      └────┬─────┘      │   复活    │
                     │                │                 │            └────┬─────┘
                     │                │ 扣 15 体力       │                 │
                     │                │ 随机新难度        │          广告完整观看
                     │                │                 │          恢复 ❤️❤️
                     │                ▼                 ▼          游戏继续
                     │           ┌──────────┐      ┌──────────┐
                     │           │  游戏页   │      │  首页     │
                     │           │  新一局   │      │          │
                     │           └──────────┘      └──────────┘
                     │
                     │                ┌──────────┐
                     └────────────────│  放弃     │
                                      │          │ → 跳转结算页展示本局成绩
                                      └────┬─────┘
                                           ▼
                                      ┌──────────┐
                                      │  首页     │
                                      └──────────┘
```

### 7.2 胜利/失败条件

| 条件 | 判定 |
|------|------|
| **胜利** | 所有小马都被正确揭晓（foundPonies == totalPonies）→ 弹出胜利页面 |
| **失败** | 生命值归零（lives == 0），弹出失败弹窗 |
| **复活** | 每局限 1 次，观看完整激励视频广告后恢复满血（lives = 2），游戏继续 |
| **放弃** | 失败界面点击"放弃"，返回首页 |

### 7.3 胜利页面

```
┌──────────────────────────────────────┐
│                                      │
│             🎉  恭喜通关！            │
│                                      │
│       难度：简单（8×8）               │
│       🐴 小马：8 / 8                 │
│       ❤️ 剩余生命：1                  │
│       ⏱ 用时：02:35                  │
│                                      │
│   ┌────────────────────────────┐     │
│   │        🔄 再来一局           │     │ 扣 15 体力，系统随机新难度
│   └────────────────────────────┘     │
│   ┌────────────────────────────┐     │
│   │        🏠 返回主页           │     │
│   └────────────────────────────┘     │
│                                      │
└──────────────────────────────────────┘
```

### 7.4 扣血 & 开始游戏逻辑伪代码

```javascript
// 首页点击"开始游戏"
function onStartGame() {
  const stamina = getStamina();
  if (stamina < STAMINA_CONFIG.COST_PER_GAME) {
    wx.showToast({ title: '体力不足，去看看广告吧~', icon: 'none' });
    return;
  }
  consumeStamina(STAMINA_CONFIG.COST_PER_GAME); // 扣 15 体力
  const config = randomDifficulty();               // 系统随机抽取难度
  wx.navigateTo({ url: `/pages/game/game?rows=${config.rows}&cols=${config.cols}&colors=${config.colorCount}` });
}

// 随机难度
function randomDifficulty() {
  const rand = Math.random();
  if (rand < 0.40) return { rows: 8, cols: 8, colorCount: 8 };
  if (rand < 0.75) return { rows: 10, cols: 10, colorCount: 10 };
  return { rows: 12, cols: 12, colorCount: 12 };
}

function revealCell(row, col) {
  const cell = this.data.grid[row][col];

  if (cell.state !== CellState.HIDDEN && cell.state !== CellState.MARKED) {
    return; // 已揭晓的格子不可操作
  }

  if (cell.hasPony) {
    // 猜对了！
    cell.state = CellState.CORRECT;
    this.data.foundPonies += 1;

    if (this.data.foundPonies === this.data.totalPonies) {
      this.onWin(); // 胜利
    }
  } else {
    // 猜错了！
    cell.state = CellState.WRONG;
    this.data.wrongAttempts += 1;
    this.data.lives -= 1; // 扣 1 颗心

    // 扣血动画
    this.playHeartBreakAnimation();

    if (this.data.lives <= 0) {
      this.onDie(); // 弹出失败界面
    }
  }

  this.setData({
    grid: this.data.grid,
    foundPonies: this.data.foundPonies,
    wrongAttempts: this.data.wrongAttempts,
    lives: this.data.lives,
  });
}

function revivePlayer() {
  if (this.data.hasRevived) return;

  this.data.hasRevived = true;
  this.data.lives = this.data.maxLives; // 恢复满血

  this.setData({
    lives: this.data.lives,
    showFailModal: false, // 关闭失败弹窗
    status: 'playing',
  });
}
```

---

## 八、UI 布局设计

### 8.1 游戏主界面 — 分层布局

参考成熟推理手游的界面设计，游戏界面从上到下分为五个功能层：

```
┌────────────────────────────────────────────┐
│ 第一层：顶部资源栏（约 40px）                  │
│ 💰 金币 242     ❤️ ❤️       👤 … ⚙      │
├────────────────────────────────────────────┤
│ 第二层：规则常驻提示卡（白色卡片 + 淡蓝边框）       │
│ ┌────────────────────────────────────────┐ │
│ │ 🐴 每种颜色1匹 │ 📏 每行每列各1匹 │ 🚫 不能相邻 │ │
│ └────────────────────────────────────────┘ │
├────────────────────────────────────────────┤
│ 第三层：状态信息区（双卡并排）                  │
│ ┌──── 待找 ────┐  ┌──── 计时 ──────────┐  │
│ │ 🐴 剩余：8    │  │ ⏱ 剩余时间：171     │  │
│ └──────────────┘  └────────────────────┘  │
├────────────────────────────────────────────┤
│ 第四层：彩色网格（岛屿式圆角方块）               │
│ ┌─◆─◆─◆─◆─◆─◆─◆─◆─┐                     │
│ │ ◆  ◆  ◆  ◆  ◆  ◆  ◆  ◆│                     │
│ │  ◆  ◆  ◆  ◆  ◆  ◆  ◆  ◆│                     │
│ │  ...  8×8 圆角方块 + 4px 间隙 ...       │
│ └─◆─◆─◆─◆─◆─◆─◆─◆─┘                     │
├────────────────────────────────────────────┤
│ 第五层：底部操作栏（双行）                     │
│      🗑 清除    🔍 揭晓     💡 提示           │
│                   +           +             │
│                       👁 色盲  📍 坐标        │
└────────────────────────────────────────────┘
```

### 8.1.1 规则常驻提示卡

一张白色圆角卡片，分三栏展示游戏的三条核心规则，栏与栏之间用垂直虚线分隔。卡片位于网格正上方，**始终可见**，玩家无需点开教程即可随时温习规则。

```
┌──────────────────────────────────────────┐
│  🐴 每种颜色    │  📏 每行每列     │  🚫 小马不能    │
│   有且只有 1 匹  │   有且只有 1 匹  │   相邻（含对角） │
└──────────────────────────────────────────┘
   ↑ 三栏等宽，虚线分隔
```

| 属性 | 值 |
|------|------|
| 背景 | `#FFFFFF` 白色卡片 |
| 边框 | 淡蓝色描边（`#7dbcdb` 30% 透明度） |
| 圆角 | 10px |
| 投影 | 轻微 box-shadow（`rgba(0,0,0,0.06)` 4px blur） |
| 字号 | 12px，黑色 |
| 图标 | emoji 🐴 / 📏 / 🚫 |

### 8.1.2 状态信息双卡

两张大号白色圆角卡片并排显示，替代当前混在状态栏里的零散文字，让关键数据更醒目：

```
┌──────────────┐  ┌──────────────────┐
│ 🐴           │  │ ⏱               │
│ 剩余         │  │ 剩余时间         │
│    12        │  │     171         │
└──────────────┘  └──────────────────┘
```

| 卡片 | 内容 | 数字样式 |
|------|------|----------|
| 左卡：待找小马 | 🐴 图标 +「剩余」+ 大数字 | 红色 #C62828，bold 28px |
| 右卡：剩余时间 | ⏱ 图标 +「剩余时间」+ 大数字 | 蓝色 #1565C0，bold 28px |

> **注意**：这里的「剩余」= 总小马数 - 已找到的小马数，而非已标 ✕ 的数量。与当前状态栏的 `🐴 2/7  ✘ 1` 不同，新设计只关注两项核心数据。

### 8.1.3 彩色网格（岛屿式方块）

每个格子渲染为独立的圆角方块，方块之间有 **4px** 的背景色间隙，形成"独立岛屿"的视觉感受：

```
┌──────────────────────────────────────┐
│  ╭──╮ ╭──╮ ╭──╮ ╭──╮ ╭──╮           │
│  │  │ │  │ │  │ │  │ │  │           │
│  ╰──╯ ╰──╯ ╰──╯ ╰──╯ ╰──╯           │
│  ╭──╮ ╭──╮ ╭──╮ ╭──╮ ╭──╮           │
│  │🐴│ │  │ │  │ │  │ │  │           │
│  ╰──╯ ╰──╯ ╰──╯ ╰──╯ ╰──╯           │
│          ← 4px 间隙 →                 │
└──────────────────────────────────────┘
```

| 属性 | 值 |
|------|------|
| 方块边角 | 圆角 6px |
| 方块间距 | 4px（背景 `#f1f2f4` 自然分隔） |
| 背景填充 | 对应颜色 bg 值（高饱和度，不刺眼） |
| 描边 | 无（间隙替代边框） |
| 点击态 | 蓝色边框高亮 |

> **与当前区别**：当前使用实线边框 + 零间隙（棋盘格风格），改为岛屿式后视觉更柔和，有"拼图块"的感觉。

### 8.1.4 底部操作栏

两行结构，主操作按钮大而醒目，辅助按钮小巧：

```
首行（主按钮）：
  ┌──────┐    ┌────────────┐    ┌────────────┐    ┌────┐
  │  🗑   │    │  🔍 揭晓    │    │  💡 提示    │    │ 👁 │
  │ 清除  │    │  小马图标    │    │  灯泡图标    │    │色盲│
  └──────┘    └────────────┘    └────────────┘    │ 📍 │
                                                │坐标│
次行（次级 + 按钮）：                              └────┘
               [+]              [+]
```

| 按钮 | 类型 | 尺寸 | 说明 |
|------|------|------|------|
| 🗑 清除 | 小圆角按钮 | 48×48 | 灰色垃圾桶图标，点击清除所有 ✕ 标记 |
| 🔍 揭晓 | 大圆角卡片 | 60×60 | 小马头 + 放大镜图标，主功能按钮 |
| 💡 提示 | 大圆角卡片 | 60×60 | 灯泡图标，显示剩余次数（3→2→1→灰） |
| [+] 次级 | 小圆形 | 32×32 | 揭晓卡下方：查看已揭晓小马汇总；提示卡下方：使用提示 |
| 👁 色盲 | 小方形按钮 | 40×40 | 眼睛图标，切换色盲模式 |
| 📍 坐标 | 小方形按钮 | 40×40 | 网格图标，切换行列坐标显示 |

> **与当前区别**：当前为居中文字按钮（`🔄 再来一局`、`🗑 清除标记`），改为图标化 + 大触控面积 + 功能分区。

### 8.2 格子状态视觉

| 状态 | 显示内容 | 视觉效果 |
|------|----------|----------|
| hidden | 颜色背景（纯色填充） | 显示格子颜色，略圆角 |
| marked | 颜色背景 + 灰色 **X** | X 居中显示，半透明灰色 |
| correct | 颜色背景 + 🐴 小马 | 小马图标 + 绿色边框高亮 |
| wrong | 颜色背景 + 红色 **✘** | 红色 X + 浅红色边框/闪烁 |

### 8.3 首页设计

```
┌──────────────────────────────────────┐
│                                      │
│           🐴  小马谜题  🐴            │ 标题
│                                      │
│     逻辑推理 × 扫雷标记               │ 副标题
│                                      │
│         ⚡ 体力：120 / 150            │ 体力显示 + 恢复倒计时
│         ⏱ 3分钟后恢复 1 点            │ （可选展示）
│                                      │
│   ┌──────────────────────────────┐   │
│   │        🎮  开始游戏            │   │ 系统随机难度
│   │        消耗 15 体力            │   │
│   └──────────────────────────────┘   │
│                                      │
│   ┌──────────────────────────────┐   │
│   │      �  获得体力              │   │ 看广告 +60 体力
│   └──────────────────────────────┘   │
│                                      │
│         📖 玩法说明                   │ 规则入口
│                                      │
└──────────────────────────────────────┘
```

### 8.4 顶部资源栏（游戏内）

游戏界面最顶层的资源信息条，紧凑展示全局资源和社交入口：

```
┌────────────────────────────────────────────┐
│ 💰 242    ⚡ 120 [+]     ❤️ ❤️     👤 … ⚙  │
└────────────────────────────────────────────┘
```

| 位置 | 元素 | 说明 |
|------|------|------|
| 左1 | 💰 金币（242） | 游戏内货币，暂预留，后续可做奖励/购买 |
| 左2 | ⚡ 体力（120）+ [+] 按钮 | 全局体力余额，与首页共用 wx.Storage；[+] 点击播放激励视频广告获取体力 |
| 中间 | ❤️ ❤️ | 当前生命值（2 满 0 死），扣心时闪烁 |
| 右1 | 👤 头像/社交 | 预留，后续接入好友排行 |
| 右2 | … 更多 | 设置、规则说明等入口 |
| 右3 | ⚙ 设置 | 音效开关、色盲模式切换等 |

> **注意**：此处的 ⚡ 体力显示的是全局值（和首页同一个数据源），不是本局独立的。体力在开始游戏时已扣 15，此处展示扣后余额。

### 8.5 辅助功能区

#### 8.5.1 色盲模式

考虑到约 8% 的男性玩家存在色觉障碍，提供色盲辅助模式：

| 属性 | 值 |
|------|------|
| 触发 | 底部 👁 按钮切换 |
| 效果 | 每个格子内部显示颜色的**单字简称**（金/粉/绿/紫/橙/淡/天/浅/暖/丁/翠/湖） |
| 文字样式 | 白色半透明（`rgba(255,255,255,0.7)`），居中，字号 = 格子尺寸 × 0.35 |
| 状态持久化 | 通过 wx.Storage 记住用户选择 |

```
正常模式：                色盲模式：
╭──────╮                 ╭──────╮
│      │                 │  金  │
│  🐴  │                 │  🐴  │
╰──────╯                 ╰──────╯
```

#### 8.5.2 坐标显示

方便玩家讨论推理过程、截图分享到社交平台：

| 属性 | 值 |
|------|------|
| 触发 | 底部 📍 按钮切换 |
| 效果 | 网格左侧显示行号（1~12），上方显示列号（1~12） |
| 字号 | 10px，灰色 `#999` |
| 坐标体系 | 从 1 开始（非 0-based），符合玩家直觉 |

```
        1   2   3   4   5   6   7
      ┌───┬───┬───┬───┬───┬───┬───┐
    1 │   │   │   │   │   │   │   │
      ├───┼───┼───┼───┼───┼───┼───┤
    2 │   │   │   │   │   │   │   │
      ├───┼───┼───┼───┼───┼───┼───┤
    3 │   │🐴│   │   │   │   │   │
      └───┴───┴───┴───┴───┴───┴───┘
```

---

## 九、交互细节规范

### 9.1 触摸事件处理（滑动标记 vs 点击标记 vs 双击揭晓）

三种操作共用触摸事件，优先级如下：

```
                    指尖按下 (touchstart)
                           │
                    记录起始格子坐标
                           │
                 指尖移动 (touchmove)
                           │
              ┌────────────┴────────────┐
              │                         │
         跨越格子边界               未跨越格子
              │                         │
       进入滑动模式                  指尖抬起
              │                    (touchend)
     ┌───────┴───────┐                 │
     │               │          ┌──────┴──────┐
 手指滑过新格子    手指离开   位移 < 阈值    位移 ≥ 阈值
     │               │     (约半格宽度)    (约半格宽度)
     ▼               ▼          │              │
 标记/取消该格    滑动结束    视为 tap      视为短滑动
 (hidden↔marked)  清空滑动    进入双击      标记当前格
 (toggle 批量)    状态        检测逻辑      进入滑动
                                             标记
```

**判定规则**：

| 场景 | 判定条件 | 行为 |
|------|----------|------|
| 滑动标记 | touchmove 跨越到不同格子 | hidden → marked（连续批量） |
| 滑动取消 | touchmove 跨越到不同格子 | marked → hidden（连续批量 toggle） |
| 单点标记 | touchend 位移 < 阈值，300ms 内无第二次 tap | hidden → marked |
| 单点取消 | touchend 位移 < 阈值，300ms 内无第二次 tap | marked → hidden |
| 双击揭晓 | touchend 位移 < 阈值，300ms 内同格再次 tap | marked → 揭晓 |
| 滑过已揭晓 | touchmove 经过 correct/wrong 格 | 跳过，不操作 |
| 全部清除 | 点击「清除标记」按钮 | 所有 marked → hidden（批量） |

### 9.2 技术实现（WXML + JS）

```html
<!-- game.wxml -->
<view class="game-grid"
  bindtouchstart="onTouchStart"
  bindtouchmove="onTouchMove"
  bindtouchend="onTouchEnd"
>
  <view wx:for="{{grid}}" wx:for-item="row" wx:for-index="rowIdx" class="grid-row">
    <view wx:for="{{row}}" wx:for-item="cell" wx:for-index="colIdx"
      class="grid-cell"
      style="background-color: {{cell.colorBg}}"
      data-row="{{rowIdx}}"
      data-col="{{colIdx}}"
    >
      <text wx:if="{{cell.state === 'marked'}}" class="mark-x">X</text>
      <text wx:if="{{cell.state === 'correct'}}" class="mark-pony">🐴</text>
      <text wx:if="{{cell.state === 'wrong'}}" class="mark-wrong">✘</text>
    </view>
  </view>
</view>
```

```javascript
// game.js — 触摸事件 + 滑动标记 + 点击/双击
const SWIPE_THRESHOLD = 20; // 滑动判定阈值（px），小于此值视为点击

Page({
  data: {
    grid: [],
    cellSize: 0, // 单个格子实际像素大小（运行时根据屏幕计算）
    swipeMode: false,      // 是否处于滑动模式
    swipeStartRow: -1,     // 触摸起始行
    swipeStartCol: -1,     // 触摸起始列
    swipeLastRow: -1,      // 滑动上次经过的行
    swipeLastCol: -1,      // 滑动上次经过的列
    touchStartX: 0,
    touchStartY: 0,
    swipeChangedCells: [], // 本次滑动手势标记过的格子（用于批量 setData）
    // 双击检测
    lastTapRow: -1,
    lastTapCol: -1,
    lastTapTime: 0,
    tapTimer: null,
  },

  onTouchStart(e) {
    const touch = e.touches[0];
    const { row, col } = this.getCellByTouch(touch);
    if (row < 0 || col < 0) return;

    this.data.swipeMode = false;
    this.data.swipeStartRow = row;
    this.data.swipeStartCol = col;
    this.data.swipeLastRow = row;
    this.data.swipeLastCol = col;
    this.data.touchStartX = touch.clientX;
    this.data.touchStartY = touch.clientY;
    this.data.swipeChangedCells = [];
  },

  onTouchMove(e) {
    const touch = e.touches[0];
    const { row, col } = this.getCellByTouch(touch);
    if (row < 0 || col < 0) return;

    const dx = Math.abs(touch.clientX - this.data.touchStartX);
    const dy = Math.abs(touch.clientY - this.data.touchStartY);

    if (!this.data.swipeMode && (dx > SWIPE_THRESHOLD || dy > SWIPE_THRESHOLD)) {
      this.data.swipeMode = true; // 进入滑动模式
      clearTimeout(this.data.tapTimer); // 取消待处理的 tap
    }

    if (this.data.swipeMode) {
      // 只在跨越到新格子时标记
      if (row !== this.data.swipeLastRow || col !== this.data.swipeLastCol) {
        this.markCellBySwipe(row, col);
        this.data.swipeLastRow = row;
        this.data.swipeLastCol = col;
      }
    }
  },

  onTouchEnd(e) {
    if (this.data.swipeMode) {
      // 滑动结束，批量刷新 UI
      if (this.data.swipeChangedCells.length > 0) {
        this.applySwipeMarks();
      }
      this.data.swipeMode = false;
      this.data.swipeChangedCells = [];
      return;
    }

    // 非滑动 → 进入点击/双击检测
    const row = this.data.swipeStartRow;
    const col = this.data.swipeStartCol;
    if (row < 0 || col < 0) return;

    const now = Date.now();
    if (
      this.data.lastTapRow === row &&
      this.data.lastTapCol === col &&
      now - this.data.lastTapTime < 300
    ) {
      // 双击 → 揭晓
      clearTimeout(this.data.tapTimer);
      this.revealCell(row, col);
      this.data.lastTapRow = -1;
      this.data.lastTapCol = -1;
      this.data.lastTapTime = 0;
    } else {
      // 可能是单点 → 延迟 300ms 确认
      this.data.lastTapRow = row;
      this.data.lastTapCol = col;
      this.data.lastTapTime = now;
      this.data.tapTimer = setTimeout(() => {
        this.markCellByTap(row, col);
        this.data.lastTapTime = 0;
      }, 300);
    }
  },

  // 根据触摸坐标计算格子行列
  getCellByTouch(touch) {
    // 需要根据网格容器位置和 cellSize 计算
    // 具体实现依赖 getBoundingClientRect + scroll offset
    const query = wx.createSelectorQuery();
    // ... 返回 { row, col }
  },

  // 滑动经过时标记/取消（toggle，只收集，不立即 setData）
  markCellBySwipe(row, col) {
    const cell = this.data.grid[row][col];
    if (cell.state === 'hidden') {
      cell.state = 'marked';
      this.data.swipeChangedCells.push({ row, col });
    } else if (cell.state === 'marked') {
      cell.state = 'hidden'; // 取消标记（toggle）
      this.data.swipeChangedCells.push({ row, col });
    }
    // correct / wrong 状态跳过，不可操作
  },

  // 批量应用滑动标记
  applySwipeMarks() {
    const updates = {};
    this.data.swipeChangedCells.forEach(({ row, col }) => {
      updates[`grid[${row}][${col}].state`] = 'marked';
    });
    this.setData(updates);
  },

  // 点击标记
  markCellByTap(row, col) {
    const cell = this.data.grid[row][col];
    if (cell.state === 'hidden') {
      cell.state = 'marked';
      this.setData({ [`grid[${row}][${col}].state`]: 'marked' });
    } else if (cell.state === 'marked') {
      cell.state = 'hidden'; // 取消标记
      this.setData({ [`grid[${row}][${col}].state`]: 'hidden' });
    }
  },
  // 全部清除标记
  clearAllMarks() {
    const updates = {};
    let hasMarks = false;
    this.data.grid.forEach((row, rowIdx) => {
      row.forEach((cell, colIdx) => {
        if (cell.state === 'marked') {
          cell.state = 'hidden';
          updates[`grid[${rowIdx}][${colIdx}].state`] = 'hidden';
          hasMarks = true;
        }
      });
    });
    if (hasMarks) {
      this.setData(updates);
      wx.showToast({ title: '已清除所有标记', icon: 'none', duration: 1000 });
    } else {
      wx.showToast({ title: '没有可清除的标记', icon: 'none', duration: 1000 });
    }
  },
});
```

### 9.3 已揭晓格子的处理

- 正确揭晓（小马）→ 该格锁定，不可再次操作
- 错误揭晓（红色 ✘）→ 该格锁定，不可再次操作（错误已记录）
- 已标记（灰色 X）→ 可再次点击取消标记（回到 hidden）
- 已标记（灰色 X）→ 滑动经过时也会取消标记（toggle 回到 hidden）
- 已标记（灰色 X）→ 「清除标记」按钮可批量清除（回到 hidden）

### 9.4 反馈动画

| 事件 | 动画效果 |
|------|----------|
| 标记 X | 轻微缩放（scale 0.9 → 1.0），100ms |
| 滑动连续标记 | 每个格子依次出现 X，无延迟逐个点亮（视觉连续） |
| 揭晓正确 | 绿色边框闪烁 + 小马图标弹入（spring 弹性动画），300ms |
| 揭晓错误 | 红色边框闪烁 + 轻微震动，200ms |
| 全部完成 | 全屏撒花/星星动画，持续 2s |

---

## 十、开发任务分解

### Phase 1：基础框架搭建 ✅

| 序号 | 任务 | 描述 | 优先级 | 状态 |
|------|------|------|--------|------|
| 1.1 | 初始化小程序项目 | 创建项目结构，Canvas 渲染 | P0 | ✅ |
| 1.2 | 搭建首页 | 体力显示、开始游戏按钮、"获得体力"广告按钮、"玩法说明"、"设置" | P0 | ✅ |
| 1.3 | 创建游戏页骨架 | Canvas 全屏渲染架构 | P0 | ✅ |
| 1.4 | 实现体力系统 | 消耗/自然恢复/广告获取，wx.Storage 持久化 | P0 | ✅ |

### Phase 2：核心逻辑层 ✅

| 序号 | 任务 | 描述 | 优先级 | 状态 |
|------|------|------|--------|------|
| 2.1 | 实现随机难度抽取 | 按 40%/35%/25% 概率随机分配 8×8 / 10×10 / 12×12 | P0 | ✅ |
| 2.2 | 实现颜色分配算法 | 洪水填充 + 随机扩张 | P0 | ✅ |
| 2.3 | 实现回溯放置算法 | 约束满足求解器，迭代硬限制 50 万次 | P0 | ✅ |
| 2.4 | 实现约束校验器 | isValidPlacement（行/列/3×3 隔离） | P0 | ✅ |
| 2.5 | 唯一解验证 | `hasMultipleSolutions`（找 2 解即停），迭代硬限制 80 万次 | P1 | ✅ (v2.0) |

### Phase 3：游戏交互 ✅

| 序号 | 任务 | 描述 | 优先级 | 状态 |
|------|------|------|--------|------|
| 3.1 | 渲染彩色网格 | Canvas 渲染彩色圆角岛屿式网格 | P0 | ✅ |
| 3.2 | 实现触摸事件系统 | touchstart/touchmove/touchend | P0 | ✅ |
| 3.3 | 实现单/双击区分 | 300ms 延时判断标记 vs 揭晓 | P0 | ✅ |
| 3.4 | 实现滑动连续标记/取消 | toggle 模式，跳过已揭晓格子 | P0 | ✅ |
| 3.5 | 实现标记逻辑 | 白色圆角 ✕ 线条 | P0 | ✅ |
| 3.6 | 实现揭晓逻辑 | 🐴 正确 / 红色圆角 ✘ 错误 | P0 | ✅ |
| 3.7 | 实现扣血与生命值 UI | ❤❤ 闪烁警告 | P0 | ✅ |
| 3.8 | 实现失败弹窗 | 含复活 & 放弃 & 返回主页按钮 | P0 | ✅ |
| 3.9 | 实现胜负判定 | 全部找到→胜利、生命耗尽/超时→失败 | P0 | ✅ |
| 3.10 | 实现胜利页面 | 评分 + 再来一局 + 返回主页 | P0 | ✅ |
| 3.11 | 添加交互动画 | 标记弹跳/揭晓弹性弹跳/错误抖动 | P1 | ✅ |

### Phase 4：UI 界面重构 ✅

| 序号 | 任务 | 描述 | 优先级 | 状态 |
|------|------|------|--------|------|
| 4.0 | 实现规则常驻提示卡 | 三栏白色卡片，网格上方 | P1 | ✅ |
| 4.1 | 实现状态信息双卡 | 剩余小马数 + 倒计时 | P1 | ✅ |
| 4.2 | 实现岛屿式网格渲染 | 圆角方块 + 间隙，无边框 | P1 | ✅ |
| 4.3 | 重构底部操作栏 | 🗑清除 🐴揭晓 💡提示 📍坐标 四按钮 | P1 | ✅ |
| 4.4 | 实现色盲模式 | 格子内显示颜色单字简称 | P3 | ⬜ |
| 4.5 | 实现坐标显示 | 行列号标识，开关切换，适配曲面屏 | P3 | ✅ |
| 4.6 | 实现顶部资源栏 | 体力+生命+🏠+⚙️ | P2 | ✅ |

### Phase 5：广告与辅助功能

| 序号 | 任务 | 描述 | 优先级 | 状态 |
|------|------|------|--------|------|
| 5.1 | 激励视频广告集成 | ad.js 已写，等待 adUnitId 激活 | P0 | ⏸️ |
| 5.2 | 复活逻辑实现 | 点击直接满血复活（广告未接入时免费） | P0 | ✅ |
| 5.3 | 体力广告获取 | 点击直接 +1 体力（广告未接入时免费） | P0 | ✅ |
| 5.4 | 结算页面 | 评分 + 星级 + 用时 + 错误数 | P1 | ✅ |
| 5.5 | 本地存档 | 体力 + 设置持久化 | P1 | ✅ |
| 5.6 | 提示功能 | 智能提示（行/列独占 + 洪水填充排除 + 2候选排他） | P2 | ✅ |
| 5.7 | 计时器 | 倒计时 360 秒 | P1 | ✅ |
| 5.8 | 规则说明页 | 5 页图文教程 | P2 | ✅ |

### Phase 6：打磨与发布

| 序号 | 任务 | 描述 | 优先级 | 状态 |
|------|------|------|--------|------|
| 6.1 | 适配不同屏幕 | MARGIN 14×S 留白，坐标上移 | P1 | ✅ |
| 6.2 | 音效添加 | Web Audio API 合成 6 种音效 + 设置面板 | P2 | ✅ |
| 6.3 | 性能优化 | 12×12 渲染优化 | P2 | ⬜ |
| 6.4 | 微信审核准备 | 图标、描述、隐私合规 | P2 | ⬜ |
| 6.5 | 加载窗口 | 生成期间显示加载画面 | P1 | ✅ (v2.0) |

---

## v2.0 版本更新日志 (2026-05-23)

### 新增
- **唯一解验证**：`hasMultipleSolutions` 回溯器确保每题只有唯一解
- **加载窗口**：生成谜题时显示 "🐴 生成谜题中..." 带动态省略号
- **音频引擎** (`core/audio.js`)：纯 Web Audio API 合成，6 种音效（标记/揭晓/正确/错误/胜利/失败）
- **设置面板** (`js/runtime/settings.js`)：音效开关 + 音量滑块，首页/游戏中 ⚙️ 入口
- **规则说明页** (`js/runtime/tutorial.js`)：5 页图文教程
- **智能提示**：行/列独占判断 + 2 候选排他推理
- **揭晓按钮**：每局 3 次直接揭晓小马
- **复活按钮**：失败页面直接复活

### 优化
- MARGIN 增加到 14×S，左右留白更宽
- X 标记改为 Canvas 手画圆角白色线条
- 错误 ✘ 改为圆角红色线条（不改变格子底色）
- 正确 🐴 去掉绿色边框
- 提示弹窗暗层覆盖全屏，高亮格不受影响
- 倒计时统一 360 秒
- 底部按钮清除靠左、坐标靠右
- 坐标字体 10px，Y 轴上移适配曲面屏
- 体力/提示/揭晓用完直接免费获得（广告未接入时）

### 修复
- 回溯迭代硬限制（placePonies 50万 / hasMultipleSolutions 80万次）
- Loading 画面先用双 rAF 确保渲染
- 提示不标记 hasPony 的格子
- 设置面板弹窗点击空白处正确关闭
- 生命耗尽后按钮跳转正确

## 十一、关键技术难点与解决方案

### 11.1 生成算法的鲁棒性

**问题**：回溯可能在极端参数下无解（如颜色太少导致无法满足 3×3 隔离）。

**方案**：
1. 设置最大重试次数（如 100 次），每次重试重新随机分配颜色；
2. 若连续失败，自动减少 1 种颜色后重试；
3. 预计算合法配置的"安全参数范围"，避免用户选择无解配置。

### 11.2 单双击区分在小程序端的兼容性

**问题**：微信小程序没有原生的双击事件。

**方案**：
- 使用 `bindtap` + `setTimeout` 实现 300ms 双击检测；
- 单次点击后，格子立即显示一个轻量视觉反馈（如边框高亮），避免用户感觉"没反应"；
- 参考微信小程序社区 `double-tap` 实现模式。

### 11.3 大网格渲染性能

**问题**：12×12 = 144 个格子，如果每个格子都是独立组件，可能影响滑动/点击性能。

**方案**：
- 使用 WXML 的 `wx:for` 嵌套循环直接渲染（而非自定义组件）；
- 使用 `wx:key` 优化 diff；
- 仅在数据变化时局部更新（`this.setData` 只传变化的格子）；
- 必要时考虑 Canvas 渲染（仅在 12×12 网格出现明显卡顿时启用）。

### 11.4 触摸坐标到格子的精确映射

**问题**：滑动标记需要将 `touch.clientX/Y` 精确映射到格子行列，且需要考虑滚动偏移、设备像素比等。

**方案**：

```javascript
// 初始化时计算网格容器位置信息
function calcGridRect() {
  const query = wx.createSelectorQuery();
  query.select('.game-grid').boundingClientRect((rect) => {
    this.gridRect = rect; // { left, top, width, height }
    this.cellWidth = rect.width / this.data.config.cols;
    this.cellHeight = rect.height / this.data.config.rows;
  }).exec();
}

// 触摸坐标 → 格子行列
function getCellByTouch(touch) {
  if (!this.gridRect) return { row: -1, col: -1 };
  const x = touch.clientX - this.gridRect.left;
  const y = touch.clientY - this.gridRect.top;
  const col = Math.floor(x / this.cellWidth);
  const row = Math.floor(y / this.cellHeight);
  if (row < 0 || row >= this.data.config.rows) return { row: -1, col: -1 };
  if (col < 0 || col >= this.data.config.cols) return { row: -1, col: -1 };
  return { row, col };
}
```

---

## 十二、扩展想法（V2 展望）

| 想法 | 描述 | 阶段 |
|------|------|------|
| 每日挑战 | 每天一题，全局排行榜 | V2 |
| 自定义难度 | 玩家自定义网格尺寸和颜色数 | V2 |
| 关卡模式 | 预设 50 关，循序渐进 | V2 |
| 步数统计 | 记录推理步数，追求最少步数通关 | V2 |
| 多彩小马皮肤 | 收集不同外观的小马 | V2 |
| 分享功能 | 分享成绩卡片到微信群 | V2 |

---

## 十三、开发环境与工具

| 工具 | 用途 |
|------|------|
| 微信开发者工具 | 小程序开发、调试、预览 |
| VS Code | 代码编辑 |
| Git | 版本控制 |
| Node.js (可选) | 核心算法可以先用 Node.js 跑单元测试，再移植到小程序 |

---

> *文档版本：v2.0 | 最后更新：2026-05-23*
