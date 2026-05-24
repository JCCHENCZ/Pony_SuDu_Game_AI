// ============================================================
// 广告模块（暂注释，需要开通流量主并拿到 adUnitId 后启用）
//
// 接入步骤：
//   1. 在 mp.weixin.qq.com 后台 → 功能 → 流量主 → 开通
//   2. 创建激励视频广告位 → 复制 adUnitId
//   3. 把下面的 AD_UNIT_ID 替换为实际 ID
//   4. 去掉本文件首尾的注释标记
// ============================================================

import StaminaManager from './stamina';

const AD_UNIT_ID = 'YOUR_AD_UNIT_ID';

let rewardedVideoAd = null;

function initAd() {
  if (rewardedVideoAd) return;
  rewardedVideoAd = wx.createRewardedVideoAd({ adUnitId: AD_UNIT_ID });

  rewardedVideoAd.onLoad(() => {
    console.log('[ad] 激励视频加载成功');
  });

  rewardedVideoAd.onError((err) => {
    console.error('[ad] 激励视频错误', err);
  });

  rewardedVideoAd.onClose((res) => {
    if (res.isEnded) {
      typeof onRewarded === 'function' && onRewarded();
      onRewarded = null;
    }
  });
}

let onRewarded = null;

function watchAdForStamina(staminaMgr) {
  initAd();

  if (!rewardedVideoAd) {
    wx.showToast({ title: '广告暂不可用', icon: 'none', duration: 1500 });
    return;
  }

  rewardVideoAd.show()
    .then(() => {
      console.log('[ad] 开始播放');
    })
    .catch(() => {
      rewardVideoAd.load()
        .then(() => rewardVideoAd.show())
        .catch(() => {
          wx.showToast({ title: '暂无广告，请稍后再试', icon: 'none', duration: 1500 });
        });
    });

  onRewarded = () => {
    staminaMgr.stamina = Math.min(staminaMgr.getMax(), staminaMgr.stamina + 1);
    staminaMgr.save();
    wx.showToast({ title: '体力 +1', icon: 'success', duration: 1000 });
  };
}

function watchAdForRevive(main) {
  initAd();

  if (!rewardedVideoAd) {
    main.isFailed = true;
    main.endTime = Date.now();
    return;
  }

  rewardVideoAd.show()
    .then(() => {
      console.log('[ad] 复活广告播放中...');
    })
    .catch(() => {
      rewardVideoAd.load()
        .then(() => rewardVideoAd.show())
        .catch(() => {
          main.isFailed = true;
          main.endTime = Date.now();
        });
    });

  onRewarded = () => {
    main.lives = 1;
    wx.showToast({ title: '复活！剩余 1 心', icon: 'none', duration: 1000 });
  };
}

export { initAd, watchAdForStamina, watchAdForRevive };
