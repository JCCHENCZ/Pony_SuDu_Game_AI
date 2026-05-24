GameGlobal.canvas = wx.createCanvas();

var sysInfo = wx.getSystemInfoSync ? wx.getSystemInfoSync() : wx.getWindowInfo();

var dpr = sysInfo.pixelRatio || 1;
var logicalW = sysInfo.screenWidth;
var logicalH = sysInfo.screenHeight;

canvas.width = logicalW * dpr;
canvas.height = logicalH * dpr;

export const SCREEN_WIDTH = logicalW;
export const SCREEN_HEIGHT = logicalH;
export const SCREEN_DPR = dpr;
export const STATUS_BAR_HEIGHT = sysInfo.statusBarHeight || 20;

var rawScale = logicalW / 375;
export const SCREEN_SCALE = rawScale < 0.85 ? 0.85 : (rawScale > 1.35 ? 1.35 : rawScale);
