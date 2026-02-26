import BaseCH from "./BaseCH";
import { BaseINT } from "./BaseINT";
import ChannelDB from "../ChannelDB";

/**
 * oppo渠道
 */
export default class WxCH extends BaseCH implements BaseINT {

    //视频
    public videoAd = null;
    public videoId = "adunit-09683c162d6d860f";
    //banner
    public bannerAd = null;
    public banIndex = 0;
    public bannerId = ["adunit-f41e43c0ef97e349", "adunit-7071fda069ba5bed","adunit-bcd7c8a9f2bb4406","adunit-c1a6287208b9f21e","adunit-24ed064f25396cf4","adunit-5217ce8d1749b493"];
    //插屏广告
    public insertAd = null;
    public insertId = "adunit-4b9ebda4f0b36a86";
    // 插屏广告刷新定时器
    private insertAdRefreshTimer = null;
    //插屏广告创建时间
    private insertAdCreateTime = 0;
    // 插屏广告上次展示时间
    private lastInsertAdShowTime = 0;
    // 插屏广告可展示时间（30秒，冷启动时间）
    private readonly INSERT_AD_AVAILABLE_TIME = 30 * 1000;
    // 插屏广告刷新间隔（60秒）
    private readonly INSERT_AD_REFRESH_INTERVAL = 60 * 1000;
    // 插屏广告展示冷却时间（60秒）
    private readonly INSERT_AD_SHOW_COOLDOWN = 60 * 1000;

    //分享 开始的时间
    private share_start_time: number = 0;
    //分享 结束的时间
    private share_end_time: number = 0;
    //分享延时时间
    private share_interval_time: number = 3000;

    //banner是否是显示中
    public isBannerShow = false;
    //banner 广告创建时间
    public bannerAdCreateTime = 0;

    //显示视频回调
    public videoCallback = null;

    constructor(ch) {
        super(ch);

    }
    initData(): void {
        this.getSystem();
        this.getLaunchOptions();
        this.onShowAlways();
        // this.createBannerAd();
        // this.createVideoAd();
        this.createInterstitialAd();
        this.setShareAppMessage();
        this.checkUpdate();
        this.onHide();
        console.log("微信渠道初始化完成");
    }

        /**登录微信*/
    login(callback = null) {
        if (this.ch) {
            this.ch.login({
                success: (res) => {
                    if (callback) callback(true, res);
                    console.log("登录成功", res);
                },
                fail: (res) => {
                    if (callback) callback(false, res);
                    console.log("登录失败", res);
                }
            })
        }
    }

    /**创建视频广告*/
    createVideoAd() {
        if (this.ch) {
            this.videoAd = this.ch.createRewardedVideoAd({ adUnitId: this.videoId });
            this.videoAd.onLoad(() => {
                console.log("视频创建成功");
                ChannelDB.videoEnable = true;
                this.videoAd.offLoad();
            });
            this.videoAd.onError(err => {
                console.log("视频创建错误：", err);
                ChannelDB.videoEnable = false;
            });
            this.videoAd.load();

            //关闭视频回调
            let call = (res) => {
                if (res && res.isEnded) {
                    // 正常播放结束，可以下发游戏奖励
                    console.info("视频观看成功");
                    if (this.videoCallback) this.videoCallback(true);
                } else {
                    // 播放中途退出，不下发游戏奖励
                    console.log("视频观看失败");
                    if (this.videoCallback) this.videoCallback(false)
                }
            }
            this.videoAd.onClose(call);
        }
    }

    /***显示视频*/
    showVideoAd(callback = null) {
        if (this.ch && this.videoAd) {
            this.videoCallback = callback;
            this.videoAd.show().catch((err) => {
                this.showToast("暂无广告，请稍后再试");
                if (callback) callback(false);
            });
        }
    }

    /**创建banner*/
    createBannerAd() {
        if (this.ch) {
            let banId = this.refreshBanId();
            this.bannerAd = this.ch.createBannerAd({
                adUnitId: banId,
                adIntervals: 30,
                style: {
                    left: 80,
                    top: ChannelDB.screenHeight - 80,
                    width: 300,
                }
            });
            this.bannerAd.onLoad(() => {
                console.log("banner创建成功 id=", banId)
                this.bannerAd.offLoad();
            });
            this.bannerAd.onResize(() => {
                try {
                    console.log("Resize", this.bannerAd);
                    if (this.bannerAd && typeof this.bannerAd.style === 'object' && typeof this.bannerAd.style.realWidth === 'number' && typeof this.bannerAd.style.realHeight === 'number') {
                        this.bannerAd.style.left = (ChannelDB.screenWidth - this.bannerAd.style.realWidth) / 2;
                        this.bannerAd.style.top = ChannelDB.screenHeight - this.bannerAd.style.realHeight;
                    }
                } catch (error) {
                    console.warn('WxCH.onResize: Failed to update banner style:', error);
                    // 样式修改失败不影响其他功能，继续执行
                } finally {
                    // 无论是否成功，都关闭 resize 监听
                    try {
                        if (this.bannerAd && typeof this.bannerAd.offResize === 'function') {
                            this.bannerAd.offResize();
                        }
                    } catch (offError) {
                        console.warn('WxCH.onResize: Failed to offResize:', offError);
                    }
                }
            });
            this.bannerAd.onError(err => {
                console.log("创建banner失败: ", err)
            });
            if (this.isBannerShow) {
                this.showBannerAd();
            } else {
                this.hideBannerAd();
            }
            
            // 更新 banner 广告创建时间
            this.bannerAdCreateTime = Date.now();

        }
    }

    /**刷新BannerId*/
    private refreshBanId() {
        this.banIndex++;
        this.banIndex > this.bannerId.length - 1 && (this.banIndex = 0);
        return this.bannerId[this.banIndex];
    }

    /**销毁banner*/
    destroyBannerAd() {
        if (this.bannerAd) {
            console.log("销毁 banner");
            this.bannerAd.destroy();
            this.bannerAd = null;
        }
    }

    /**刷新显示banner*/
    resetBannerAd() {
        if (this.ch) {
            console.log("刷新 banner");
            this.destroyBannerAd();
            this.createBannerAd();
        }
    }

    /**显示banner*/
    showBannerAd() {
        this.isBannerShow = true;
        //&& SwitchManager.game_banner
        if (this.ch && this.bannerAd ) {
            // 检查 banner 广告创建时间是否超过 2 分钟
            const now = Date.now();
            const twoMinutes = 2 * 60 * 1000;
            if (now - this.bannerAdCreateTime > twoMinutes) {
                // 如果超过 2 分钟，重置 banner 广告
                this.resetBannerAd();
                return;
            }
            console.log("显示 banner");
            this.bannerAd.show();
        }
    }

    /**隐藏banner*/
    hideBannerAd() {
        this.isBannerShow = false;
        if (this.ch && this.bannerAd) {
            console.log("隐藏 banner");
            this.bannerAd.hide();
        }
    }


    /**创建插屏广告*/
    createInterstitialAd() {
        console.log("WxCH.createInterstitialAd: 创建插屏广告");
        
        // 销毁之前的插屏广告实例
        this.destroyInterstitialAd();
        
        // 延迟1秒后创建新的插屏广告
        setTimeout(() => {
            console.log("WxCH.createInterstitialAd: 延迟1秒后创建新的插屏广告");
            
            if (this.ch && typeof this.ch.createInterstitialAd === 'function') {
                try {
                    this.insertAd = this.ch.createInterstitialAd({
                        adUnitId: this.insertId
                    });
                    this.insertAd.onLoad(() => {
                        this.insertAd.offLoad();
                        console.log("WxCH.createInterstitialAd: 插屏广告加载完毕");
                    });
                    this.insertAd.onError((err) => {
                        this.insertAd.offError();
                        console.log("WxCH.createInterstitialAd: 插屏广告错误", err);
                    });
                    
                    // 记录创建时间
                    this.insertAdCreateTime = Date.now();
                    console.log("WxCH.createInterstitialAd: 记录创建时间:", this.insertAdCreateTime);
                } catch (error) {
                    console.warn('WxCH.createInterstitialAd: Failed to create interstitial ad:', error);
                }
            } else {
                console.warn('WxCH.createInterstitialAd: createInterstitialAd interface not available');
            }
        }, 1000); // 延迟1秒
    }

    /**展示插屏广告*/
    showInterstitialAd() {
        console.log("WxCH.showInterstitialAd: 尝试显示插屏广告");

        const now = Date.now();

        // 检查是否在可展示时间内（广告创建后60秒）
        if (now - this.insertAdCreateTime < this.INSERT_AD_AVAILABLE_TIME) {
            const remainingTime = Math.ceil((this.INSERT_AD_AVAILABLE_TIME - (now - this.insertAdCreateTime)) / 1000);
            console.warn(`WxCH.showInterstitialAd: 插屏广告还在创建冷却期内，还需 ${remainingTime} 秒`);

            return;
        }

        // 检查是否在展示冷却期内（上次展示后60秒）
        if (now - this.lastInsertAdShowTime < this.INSERT_AD_SHOW_COOLDOWN) {
            const remainingTime = Math.ceil((this.INSERT_AD_SHOW_COOLDOWN - (now - this.lastInsertAdShowTime)) / 1000);
            console.warn(`WxCH.showInterstitialAd: 插屏广告还在展示冷却期内，还需 ${remainingTime} 秒`);

            return;
        }

        console.log("WxCH.showInterstitialAd: this.ch:", !!this.ch);
        console.log("WxCH.showInterstitialAd: this.insertAd:", !!this.insertAd);

        if (this.ch && this.insertAd) {
            this.insertAd.onClose(() => {
                console.log("WxCH.showInterstitialAd: 插屏广告关闭");
                try {
                    this.insertAd.offClose();
                } catch (error) {
                    console.warn('WxCH.showInterstitialAd: Failed to offClose:', error);
                }
                
                // 记录上次展示时间
                this.lastInsertAdShowTime = Date.now();
                console.log("WxCH.showInterstitialAd: 记录上次展示时间:", this.lastInsertAdShowTime);
                
                // 广告关闭时，重新创建插屏广告
                console.log("WxCH.showInterstitialAd: 广告关闭，重新创建插屏广告");
                this.createInterstitialAd();

            });
        }
        try {
            let promise = this.insertAd.show();
            console.log("WxCH.showInterstitialAd: 调用 show() 方法");
            promise.then(() => {
                    console.log("WxCH.showInterstitialAd: 插屏广告显示成功");
                    
                    // 插屏广告实例仅能展示一次，成功展示后需销毁重建才可再次展示
                    // 但根据用户要求，这里不销毁实例，由定时器管理广告的创建和刷新
                }).catch((reject) => {
                console.error("WxCH.showInterstitialAd: 插屏广告显示失败:", reject);
                console.log(`errCode:${reject.errCode}, errMsg:${reject.errMsg}`);
                // 广告显示失败时也调用回调，确保流程继续

            });
        } catch (error) {
            console.error('WxCH.showInterstitialAd: 调用 show() 方法出错:', error);

        }
    } 
    
    /**销毁插屏广告*/
    destroyInterstitialAd() {
        if (this.insertAd) {
            try {
                console.log("WxCH.destroyInterstitialAd: 销毁插屏广告");
                this.insertAd.destroy();
                this.insertAd = null;
            } catch (error) {
                console.warn('WxCH.destroyInterstitialAd: Failed to destroy:', error);
                this.insertAd = null;
            }
        }
    }

    //显转发按钮
    showShareMenu() {
        if (this.ch) {
            this.setShareAppMessage();
            this.ch.showShareMenu({
                withShareTicket: false,
            });
            console.log("显示转发按钮");
        }
    }

    //设置转发信息（右上角按钮点击->转发）
    public setShareAppMessage() {
        if (this.ch) {
            console.log("设置转发信息");
            this.ch.onShareAppMessage(() => {
                return {
                    title: "好玩的水果消除游戏，快来挑战吧！",
                    imageUrl: "", // 默认分享图
                    success: (res) => {
                        console.log("转发成功");
                    },
                    fail: (res) => {
                        console.log("转发失败");
                    }
                }
            });
        }
    }


    /**普通分享*/
    share(callback = null) {
        if (this.ch) {
            //记录分享开始时间
            this.share_start_time = Date.now();
            
            //设置分享后回调行为 (通过 onShow 检测)
            let call: Function = (res) => {
                //记录分享结束时间
                this.share_end_time = Date.now();
                if (this.share_end_time - this.share_start_time >= this.share_interval_time) {
                    //分享成功 (模拟)
                    if (callback) callback(true);
                } else {
                    //分享失败
                    if (callback) callback(false);
                }
            }
            this.onShow(call);

            //拉起分享
            let sn = Date.now() + "" + ~~((0.1 + Math.random() / 2) * 10000);
            this.ch.shareAppMessage({
                title: "好玩的水果消除游戏，快来挑战吧！",
                imageUrl: "",
                query: "&sn=" + sn,
            });
        }
    }

    /**检查更新*/
    checkUpdate() {
        if (this.ch) {
            //获取全局唯一的版本更新管理器，用于管理小程序更新
            let updateManager = this.ch.getUpdateManager();
            //监听向微信后台请求检查更新结果事件。微信在小程序冷启动时自动检查更新，不需由开发者主动触发。
            updateManager.onCheckForUpdate((res) => {
                //请求完新版本信息的回调
                console.log("是否有新版本:", res.hasUpdate);
            });
            //监听小程序更新失败事件。小程序有新版本，客户端主动触发下载（无需开发者触发），下载失败（可能是网络原因等）后回调
            updateManager.onUpdateFailed(() => {
                this.showToast("新版本下载失败");
            });
            //监听小程序有版本更新事件。客户端主动触发下载（无需开发者触发），下载成功后回调
            updateManager.onUpdateReady(() => {
                this.showModal('更新提示', '新版本已经准备好，是否重启应用？', true, (res) => {
                    if (res) {
                        // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                        updateManager.applyUpdate();
                    }
                });
            })
        }
    }

    /**导航到其他小程序*/
    gotoOther(adv_id: string, pkgName: string, path: string, callback = null) {
        if (this.ch) {
            if (pkgName) {
                this.ch.navigateToMiniProgram({
                    appId: pkgName,
                    path: path,
                    success(res) {
                        console.log('打开成功: appid = ', pkgName);
                        if (callback) callback(true);
                    },
                    fail(err) {
                        console.log('打开失败: appid = ', pkgName);
                        if (callback) callback(false);
                    },
                })
            }
        }
    }

    /**
     * 分包加载
     * @param name 分包名称
     * @param callback 加载完成回调
     */
    loadSubPackages(name: string, callback: Function, progressCallback?: Function) {
        console.log("WxCH loadSubPackages:", name);
        if (!this.ch) {
            if (callback) callback(false, "channel not available");
            return;
        }

        let loadAttempts = 0;
        const maxAttempts = 3;
        const load = () => {
            loadAttempts++;
            console.log(`WxCH loadSubPackages attempt ${loadAttempts}/${maxAttempts}: ${name}`);
            
            const loadTask = this.ch.loadSubpackage({
                name: name,
                success: (res) => {
                    console.log(`WxCH loadSubPackages success: ${name}, errMsg: ${res.errMsg}`);
                    if (callback) callback(true, null, 100);
                },
                fail: (res) => {
                    console.error(`WxCH loadSubPackages failed (${loadAttempts}/${maxAttempts}):`, res);
                    if (loadAttempts < maxAttempts) {
                        setTimeout(load, 1000);
                    } else {
                        console.error(`WxCH loadSubPackages failed after ${maxAttempts} attempts: ${name}`);
                        if (callback) callback(false, res);
                    }
                }
            });
            
            // 使用loadTask.onProgressUpdate方式监听进度
            if (loadTask && loadTask.onProgressUpdate) {
                loadTask.onProgressUpdate(res => {
                    console.log(`WxCH loadSubPackages progress: ${name} - ${res.progress}%`);
                    console.log(`WxCH loadSubPackages bytes: ${res.totalBytesWritten}/${res.totalBytesExpectedToWrite}`);
                    if (progressCallback) {
                        // 传递更详细的进度信息
                        progressCallback(res.progress, res.totalBytesWritten, res.totalBytesExpectedToWrite);
                    }
                });
            }
        };
        
        load();
    }

    /**获取用户授权*/
    getSetting(callback?: (success: boolean, data?: any, error?: any) => void) {
        const that = this; // 保存当前实例引用
        console.log('getSetting');
        
        if (that.ch) {
            that.ch.getSetting({
                success(res) {
                    console.log('getSetting2', res);
                    if (!res.authSetting['scope.WxFriendInteraction']) {
                        that.ch.authorize({
                            scope: 'scope.WxFriendInteraction',
                            success() {
                                if (callback) callback(true, null, null);
                                console.log('用户已授权好友互动');
                                // 用户已经同意保存到相册功能，后续调用 wx.saveImageToPhotosAlbum 接口不会弹窗询问
                                //   wx.saveImageToPhotosAlbum()
                            },
                            fail(err) {
                                console.log('授权失败：', err);
                                if (callback) callback(false, null, err);
                            }
                        })
                    } else {
                        if (callback) callback(true, null, null);
                        console.log('用户已授权好友互动');
                    }
                },
                fail(err) {
                    console.log('获取设置失败：', err);
                    if (callback) callback(false, null, err);
                }
            })
        } else {
            console.log('通道未初始化');
            if (callback) callback(false, null, { message: '通道未初始化' });
        }
    }

    postMessage() {
        if (!this.ch) return;
        // 获取开放数据域实例
        const openDataContext = this.ch.getOpenDataContext();
        // 向开放域发送消息（触发拉取排行榜）
        console.log('postMessage');
        openDataContext.postMessage({
            type: 'showFriendRank',
            key: 'game_level'
        });
    }
}
