import BaseCH from "./BaseCH";
import { BaseINT } from "./BaseINT";
import ChannelDB from "../ChannelDB";
import { director } from "cc";
import EventManager from "../../Common/view/EventManager";
import { EventName } from "../../Tools/eventName";
import { Utils } from "../../Tools/Utils";

/**
 * 头条渠道
 */
export default class TTCH extends BaseCH implements BaseINT {

    //视频
    public videoAd = null;
    public videoId = "9qr4riccib8282614a";
    //banner
    public bannerAd = null;
    public banIndex = 0;
    public bannerId = ["2h43c55imi7a1j0355",
        "43fhd3bb89i0eae57f","col6bcbkbgqb616062","167h0j0dwr1895k0ee"];  
    //插屏广告
    public insertAd = null;
    public insertId = "g4ri74adl741qjk5dk";
    // 插屏广告刷新定时器
    private insertAdRefreshTimer = null;
    // 插屏广告创建时间
    private insertAdCreateTime = 0;
    // 插屏广告上次展示时间
    private lastInsertAdShowTime = 0;
    // 插屏广告可展示时间（30秒，冷启动时间）
    private readonly INSERT_AD_AVAILABLE_TIME = 30 * 1000;
    // 插屏广告刷新间隔（60秒）
    private readonly INSERT_AD_REFRESH_INTERVAL = 60 * 1000;
    // 插屏广告展示冷却时间（60秒）
    private readonly INSERT_AD_SHOW_COOLDOWN = 60 * 1000;

    //更多游戏组件
    public btnMoreGame = null;

    //录屏组件
    public gameRecorderManager = null;
    //是否正在录制
    public isRecording = false;
    //录制起始时间
    public recordingBeginTime = 0;
    //录制结束时间
    public recordingEndTime = 0;
    //banner 广告创建时间
    public bannerAdCreateTime = 0;
    //剪辑索引列表
    public clipIndexList = [];
    //录制结束时获得的视频信息
    public recordResp = null;

    //录屏总时长
    public recordTime = 0;

    //显示视频回调
    public videoCallback = null;

    // 抖音侧边栏场景值 (02=抖音, 1036=侧边栏)
    private readonly SIDEBAR_SCENE_ID = '021036';

    //添加到桌面没 false 未添加 true 已添加
    public Shortcutexist = false;
    
     //是否订阅
    public isFeedSubscribeSuc: boolean = false;
    
    constructor(ch) {
        super(ch);
    }

    initData() {
        this.getSystem();
        this.getLaunchOptions();
        this.onShowAlways();
        this.setShareAppMessage();
        this.createBannerAd();
        this.createVideoAd();
        this.createInterstitialAd();
        this.getGameRecorderManager();
        this.checkUpdate();
        this.onHide();
        this.checkShortcut();
        this.checkFeedSubscribeStatus();
          console.log("头条渠道初始化完成");
    }
    /**登录抖音*/
    login(callback = null) {
        if (this.ch) {
            this.ch.login({
                success: (res) => {
                    if (callback)
                        callback();
                    console.log("登录成功", res);
                },
                fail: (res) => {

                    console.log("登录失败", res);
                }
            })
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

    /**
     * 分享
     */
    public share(callback = null, channel = "article", extra = {}): void {
        if (!this.ch) return;

        // 默认分享配置 (替代 OperationManager)
        const defaultShareData = {
            title: "好玩的水果消除游戏，快来挑战吧！",
            img_url: "", // 如果有默认分享图URL可填入，否则留空或使用截图
            id: "default_share_id"
        };

        let title = defaultShareData.title;
        let imageUrl = defaultShareData.img_url;
        let shareId = defaultShareData.id;
        let sn = Date.now() + "" + ~~((0.1 + Math.random() / 2) * 10000);

        const shareParams: any = {
            title: title,
            imageUrl: imageUrl,
            query: `sn=${sn}&share_id=${shareId}`,
            extra: extra,
            success() {
                console.log("分享成功");
                if (callback) callback(true);
            },
            fail(e) {
                console.log("分享失败", e);
                if (callback) callback(false);
            }
        };

        // 抖音/头条特殊处理
        if (channel !== "article") {
            shareParams.channel = channel;
        }

        this.ch.shareAppMessage(shareParams);
    }

    /**创建视频广告*/
    createVideoAd() {
        if (this.ch) {
            this.videoAd = this.ch.createRewardedVideoAd({ adUnitId: this.videoId });
            this.videoAd.onLoad(() => {
                //console.log("视频创建成功");
                ChannelDB.videoEnable = true;
            });
            this.videoAd.onError(err => {
                //console.log("视频创建错误：", err);
                ChannelDB.videoEnable = false;
            });
            this.videoAd.load();

            //关闭视频回调
            let call = (res) => {
                if (res && res.isEnded) {
                    // 正常播放结束，可以下发游戏奖励
                    //console.log("视频观看成功");
                    if (this.videoCallback) this.videoCallback(true);
                } else {
                    // 播放中途退出，不下发游戏奖励
                    //console.log("视频观看失败");
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
                this.showToast("暂无视频，请稍后再试");
                this.videoAd.load();
                // if (callback) callback(false);
            });
        }else{
            this.showToast("暂无视频，请稍后再试");
             if (callback) callback(false);
        }
    }

    /**创建banner*/
    createBannerAd() {
        if (this.ch) {
            let banId = this.refreshBanId();

            let width = 150;
            // Laya.Browser.width / Laya.Browser.height < 0.5 ? width = 250 : width = 150;
            ChannelDB.screenWidth / ChannelDB.screenHeight < 0.5 ? width = 250 : width = 150;

            this.bannerAd = this.ch.createBannerAd({
                adUnitId: banId,
                style: {
                    width: width,
                    top: ChannelDB.screenHeight - (width / 16 * 9) - 50, // 根据系统约定尺寸计算出广告高度，向下移动10
                },
            });

            this.bannerAd.onLoad(() => {
                //console.log("创建banner成功")
                this.hideBannerAd();
            });

            this.bannerAd.onError(err => {
                //console.log("创建banner广告报错: ", err)
            });

            this.bannerAd.onResize(res => {
                try {
                    // 尝试修改样式，添加错误处理
                    if (this.bannerAd && typeof this.bannerAd.style === 'object') {
                        this.bannerAd.style.top = ChannelDB.screenHeight - res.height - 50;
                        this.bannerAd.style.left = (ChannelDB.screenWidth - res.width) / 2; // 水平居中
                    }
                } catch (error) {
                    console.warn('TTCH.onResize: Failed to update banner style:', error);
                    // 样式修改失败不影响其他功能，继续执行
                }
            });
            
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
            //console.log("销毁 banner");
            this.bannerAd.destroy();
            this.bannerAd = null;
        }
    }

    /**刷新显示banner*/
    resetBannerAd() {
        if (this.ch) {
            //console.log("刷新 banner");
            this.destroyBannerAd();
            this.createBannerAd();
            this.showBannerAd();
        }
    }

    /**显示banner*/
    showBannerAd() {
        if (this.ch && this.bannerAd) {
            // 检查 banner 广告创建时间是否超过 2 分钟
            const now = Date.now();
            const twoMinutes = 1 * 60 * 1000;
            if (now - this.bannerAdCreateTime > twoMinutes) {
                // 如果超过 2 分钟，重置 banner 广告
                this.resetBannerAd();
                return;
            }
            //console.log("显示 banner");
            this.bannerAd.show();
        }
    }

    /**隐藏banner*/
    hideBannerAd() {
        if (this.bannerAd) {
            //console.log("隐藏 banner");
            this.bannerAd.hide();
        }
    }

    /**创建插屏广告*/
    createInterstitialAd() {
        console.log("TTCH.createInterstitialAd: 创建插屏广告");
        
        // 销毁之前的插屏广告实例
        this.destroyInterstitialAd();
        
        // 延迟1秒后创建新的插屏广告
        setTimeout(() => {
            console.log("TTCH.createInterstitialAd: 延迟1秒后创建新的插屏广告");
            
            // 移除对应用名称的限制，尝试在所有场景下创建插屏广告
            if (this.ch && typeof this.ch.createInterstitialAd === 'function') {
                try {
                    this.insertAd = this.ch.createInterstitialAd({
                        adUnitId: this.insertId
                    });
                    this.insertAd.onLoad(() => {
                        this.insertAd.offLoad();
                        console.log("TTCH.createInterstitialAd: 插屏广告加载完毕");
                    });
                    this.insertAd.onError((err) => {
                        this.insertAd.offError();
                        console.log("TTCH.createInterstitialAd: 插屏广告错误", err);
                    });
                    
                    // 记录创建时间
                    this.insertAdCreateTime = Date.now();
                    console.log("TTCH.createInterstitialAd: 记录创建时间:", this.insertAdCreateTime);
                } catch (error) {
                    console.warn('TTCH.createInterstitialAd: Failed to create interstitial ad:', error);
                }
            } else {
                console.warn('TTCH.createInterstitialAd: createInterstitialAd interface not available');
            }
        }, 1000); // 延迟1秒
    }

    /**展示插屏广告*/
    showInterstitialAd() {
        console.log("TTCH.showInterstitialAd: 尝试显示插屏广告");

        const now = Date.now();
        // 检查是否在可展示时间内（广告创建后60秒）
        if (now - this.insertAdCreateTime < this.INSERT_AD_AVAILABLE_TIME) {
            const remainingTime = Math.ceil((this.INSERT_AD_AVAILABLE_TIME - (now - this.insertAdCreateTime)) / 1000);
            console.warn(`TTCH.showInterstitialAd: 插屏广告还在创建冷却期内，还需 ${remainingTime} 秒`);
            return;
        }

        // 检查是否在展示冷却期内（上次展示后60秒）
        if (now - this.lastInsertAdShowTime < this.INSERT_AD_SHOW_COOLDOWN) {
            const remainingTime = Math.ceil((this.INSERT_AD_SHOW_COOLDOWN - (now - this.lastInsertAdShowTime)) / 1000);
            console.warn(`TTCH.showInterstitialAd: 插屏广告还在展示冷却期内，还需 ${remainingTime} 秒`);
            return;
        }

        //console.log("TTCH.showInterstitialAd: this.ch:", !!this.ch);
      //  console.log("TTCH.showInterstitialAd: this.insertAd:", !!this.insertAd);

        if (this.ch && this.insertAd) {
            this.insertAd.onClose(() => {
              //  console.log("TTCH.showInterstitialAd: 插屏广告关闭");
                try {
                    this.insertAd.offClose();
                    
                } catch (error) {
              //      console.warn('TTCH.showInterstitialAd: Failed to offClose:', error);
                }
                
                // 记录上次展示时间
                this.lastInsertAdShowTime = Date.now();
               // console.log("TTCH.showInterstitialAd: 记录上次展示时间:", this.lastInsertAdShowTime);
                
                // 广告关闭时，重新创建插屏广告
             //   console.log("TTCH.showInterstitialAd: 广告关闭，重新创建插屏广告");
                this.createInterstitialAd();
            });
        }
        try {
            let promise = this.insertAd.show();
        //    console.log("TTCH.showInterstitialAd: 调用 show() 方法");
            promise.then(() => {
                    console.log("TTCH.showInterstitialAd: 插屏广告显示成功");
                }).catch((reject) => {
                // console.error("TTCH.showInterstitialAd: 插屏广告显示失败:", reject);
                // console.log(`errCode:${reject.errCode}, errMsg:${reject.errMsg}`);
                // 广告显示失败时也调用回调，确保流程继续
            });
        } catch (error) {

        }
    }

    /**销毁插屏广告*/
    destroyInterstitialAd() {
        if (this.insertAd) {
            try {
                //console.log("TTCH.destroyInterstitialAd: 销毁插屏广告");
                this.insertAd.destroy();
                this.insertAd = null;
            } catch (error) {
             //   console.warn('TTCH.destroyInterstitialAd: Failed to destroy:', error);
                this.insertAd = null;
            }
        }
    }

    /**获取录屏组件*/
    getGameRecorderManager() {
        if (this.ch) {
            this.gameRecorderManager = this.ch.getGameRecorderManager();
            //console.log("获取录屏组件：", this.gameRecorderManager);

            this.gameRecorderManager.onError(res => {
                //console.log('获取录屏组件错误', res);
            });

            this.gameRecorderManager.onInterruptionBegin(res => {
                this.showToast("录屏中断");
            });

            this.gameRecorderManager.onInterruptionEnd(res => {
                this.showToast("录屏中断");
            });

            this.gameRecorderManager.onStart(res => {
                //console.log('录屏开始');
                this.recordResp = null;
                this.isRecording = true;
                this.recordingBeginTime = new Date().getTime();
            })

            this.gameRecorderManager.onStop(resp => {
                //console.log('录屏结束');
                this.recordResp = resp;
                this.isRecording = false;
                this.recordingEndTime = new Date().getTime();
                this.recordClip();
            });
        }
    }

    /**开始录屏*/
    startGameRecorderManager() {
        if (this.ch) {
            this.gameRecorderManager.start({
                duration: 60,
            })
        }
    }

    /**结束录屏*/
    stopGameRecorderManager() {
        if (this.ch) {
            this.gameRecorderManager.stop();
        }
    }

    /**剪辑录屏*/
    recordClip() {
        if (this.ch) {
            this.recordTime = Math.floor((this.recordingEndTime - this.recordingBeginTime) / 1000);
            //console.log("录屏总时间：", this.recordTime);
            this.gameRecorderManager.recordClip({
                timeRange: [this.recordTime, 0],
            });
        }
    }


    /**录屏分享*/
    recordShare(callback = null) {
        if (this.ch) {
            //console.log("录屏分享：", this.recordResp)
            //发起视频分享
            if (this.recordTime > 3) {
                this.share((res) => { if (callback) callback(res) }, "video", { videoPath: this.recordResp.videoPath });
            } else {
                this.showToast("录屏时间不足")
            }

        };
    }

    /**
     * 创建更多游戏按钮
     * @param imgUrl  图片路径 图片打包类型=不打包 "img/tt/more_games_btn.png"
     * @param width   宽度
     * @param height  高度
     */
    createBtnMoreGame(imgUrl: string, width: number, height: number) {
        //头条不支持iOS 屏蔽
        if (this.ch) {
            //console.log("创建更多游戏按钮");
            // let ratiox = Laya.Browser.width / 640;
            let ratiox = ChannelDB.screenWidth / 640;
            let y = 450;
            // Laya.Browser.width / Laya.Browser.height < 0.5 ? y = 550 : y = 450;
            ChannelDB.screenWidth / ChannelDB.screenHeight < 0.5 ? y = 550 : y = 450;

            this.btnMoreGame = this.ch.createMoreGamesButton({
                type: "image",
                image: imgUrl,//
                style: {
                    left: 0,
                    // top: y * ratiox / Laya.Browser.pixelRatio,
                    top: y * ratiox / ChannelDB.devicePixelRatio,
                    // width: width * ratiox / Laya.Browser.pixelRatio,
                    width: width * ratiox / ChannelDB.devicePixelRatio,
                    // height: height * ratiox / Laya.Browser.pixelRatio,
                    height: height * ratiox / ChannelDB.devicePixelRatio,
                    lineHeight: 0,
                    backgroundColor: "#00000000",
                    textColor: "#00000000",
                    textAlign: "center",
                    fontSize: 16,
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: '#00000000'
                },
                appLaunchOptions: [],
                onNavigateToMiniGame(res) {
                    //console.log("跳转其他小游戏", res)
                }
            });

            this.btnMoreGame.onTap(() => {
                //console.log("点击更多游戏")
            });
        }
    }

    showBtnMoreGame() {
        if (this.ch && this.btnMoreGame) {
            //console.log("显示更多游戏按钮");
            this.btnMoreGame.show();
        }
    }

    /**
     * 弹出互跳弹窗
     */
    showMoreGamesModal() {
        if (this.ch ) {
            //console.log("打开互跳弹窗")
            // 打开互跳弹窗
            this.ch.showMoreGamesModal({
                appLaunchOptions: [
                    // {
                    // appId: "tt39374f8aa61d459b",
                    // query: "foo=bar&baz=qux",
                    // extraData: {}
                    // }
                    // {...}
                ],
                success(res) {
                    //console.log("success", res.errMsg);
                },
                fail(res) {
                    //console.log("fail", res.errMsg);
                },
                onNavigateToMiniGame(res) {
                    //console.log("跳转其他小游戏", res)
                }
            });
        }
    }

    hideBtnMoreGame() {
        if (this.ch && this.btnMoreGame) {
            //console.log("隐藏更多游戏按钮");
            this.btnMoreGame.hide()
        }
    }

    //检查更新
    checkUpdate() {
        if (this.ch) {
            //获取全局唯一的版本更新管理器，用于管理小程序更新
            let updateManager = this.ch.getUpdateManager();
            //监听向微信后台请求检查更新结果事件。微信在小程序冷启动时自动检查更新，不需由开发者主动触发。
            updateManager.onCheckForUpdate((res) => {
                //请求完新版本信息的回调
                //console.log("是否有新版本:", res.hasUpdate);
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

    /**
     * 分包加载
     * @param name 分包名称
     * @param callback 加载完成回调
     */
    loadSubPackages(name: string, callback: Function, progressCallback?: Function) {
        console.log("TTCH loadSubPackages:", name);
        if (!this.ch) {
            if (callback) callback(false, "channel not available");
            return;
        }

        let loadAttempts = 0;
        const maxAttempts = 3;
        const load = () => {
            loadAttempts++;
            console.log(`TTCH loadSubPackages attempt ${loadAttempts}/${maxAttempts}: ${name}`);
            
            const loadTask = this.ch.loadSubpackage({
                name: name,
                success: (res) => {
                    console.log(`TTCH loadSubPackages success: ${name}, errMsg: ${res.errMsg}`);
                    if (callback) callback(true, null, 100);
                },
                fail: (res) => {
                    console.error(`TTCH loadSubPackages failed (${loadAttempts}/${maxAttempts}):`, res);
                    if (loadAttempts < maxAttempts) {
                        setTimeout(load, 1000);
                    } else {
                        console.error(`TTCH loadSubPackages failed after ${maxAttempts} attempts: ${name}`);
                        if (callback) callback(false, res);
                    }
                }
            });
            
            // 使用loadTask.onProgressUpdate方式监听进度
            if (loadTask && loadTask.onProgressUpdate) {
                loadTask.onProgressUpdate(res => {
                    console.log(`TTCH loadSubPackages progress: ${name} - ${res.progress}%`);
                    console.log(`TTCH loadSubPackages bytes: ${res.totalBytesWritten}/${res.totalBytesExpectedToWrite}`);
                    if (progressCallback) {
                        // 传递更详细的进度信息
                        progressCallback(res.progress, res.totalBytesWritten, res.totalBytesExpectedToWrite);
                    }
                });
            }
        };
        
        load();
    }

    /**
     * 重写 onShowAlways 以支持侧边栏检测和 director.resume
     */
    onShowAlways() {
        if (this.ch) {
            let call = (res) => {
                console.log("TTCH 监听回到前台事件:", res);
                if (res && res.scene) {
                    ChannelDB.sourceScene = res.scene;
                    
                    // 侧边栏复访特殊处理
                    if (res.scene === this.SIDEBAR_SCENE_ID) {
                        console.log("TTCH: Launch/Resume from sidebar");
                        // 确保游戏恢复运行 (Fix for some Douyin pausing issues)
                        director.resume();
                        // 发送侧边栏启动事件
                        EventManager.emit(EventName.Game.LaunchFromSidebar);
                    }
                }
            };
            this.ch.onShow(call);
        }
    }

    /**
     * 检测侧边栏是否存在
     * @param callback (isExist: boolean) => void
     */
    checkSideBar(callback: (isExist: boolean) => void) {
        if (!this.ch || !this.ch.checkScene) {
            console.log('[TTCH] checkSideBar: Not supported');
            if (callback) callback(false);
            return;
        }

        this.ch.checkScene({
            scene: "sidebar",
            success: (res: any) => {
                console.log("[TTCH] checkScene success:", res.isExist);
                if (callback) callback(!!res.isExist);
            },
            fail: (res: any) => {
                console.warn("[TTCH] checkScene fail:", res);
                if (callback) callback(false);
            }
        });
    }

    /**
     * 跳转到侧边栏
     * @param callback (success: boolean) => void
     */
    navigateToSideBar(callback: (success: boolean) => void) {
        if (!this.ch) {
            console.warn("[TTCH] navigateToSideBar: Channel not initialized");
            if (callback) callback(false);
            return;
        }

        this.ch.navigateToScene({
            scene: "sidebar",
            success: () => {
                console.log("[TTCH] navigateToScene success");
                if (callback) callback(true);
            },
            fail: (res: any) => {
                console.error("[TTCH] navigateToScene failed:", res);
                if (callback) callback(false);
            },
        });
    }

    /**
     * 设置 抖音排行榜  数字类型排行榜
     * @param value     数值
     */
    setImRankData_Num(level: number) {
        if (!this.ch) return;
        const sysinfo = this.ch.getSystemInfoSync();
        const sdkversion = sysinfo.SDKVersion;
        let appname = sysinfo.appName;
        let appVersion = sysinfo.version;
        console.log(`sdkversion: ${sdkversion}`);
        console.log(`appname: ${appname}`);
        console.log(`appVersion: ${appVersion}`);
        if (Utils.compareVersion(sdkversion, '2.70.0') >= 0
            && (appname == 'Douyin' || appname == 'douyin_lite')
            && Utils.compareVersion(appVersion, '23.2.0') >= 0) {
            this.ch.setImRankData({
                dataType: 0, //成绩为数字类型
                value: "" + level, //该用户得了999999分
                priority: 0, //dataType为数字类型，不需要权重，直接传0
                extra: "extra",
                success(res) {
                    console.log(`setImRankData success res: ${res}`);
                },
                fail(res) {
                    console.log(`setImRankData fail res: ${res.errMsg}`);
                },
            });
        }
    }

    /**
     * 获取数字类型原生排行榜
     */
    getImRankList_Num() {
        if (!this.ch) return;
        const sysinfo = this.ch.getSystemInfoSync();
        const sdkversion = sysinfo.SDKVersion;
        let appname = sysinfo.appName;
        let appVersion = sysinfo.version;
        console.log(`sdkversion: ${sdkversion}`);
        console.log(`appname: ${appname}`);
        console.log(`appVersion: ${appVersion}`);
        if (Utils.compareVersion(sdkversion, '2.70.0') >= 0
            && (appname == 'Douyin' || appname == 'douyin_lite')
            && Utils.compareVersion(appVersion, '23.2.0') >= 0) {
            this.ch.getImRankList({
                relationType: "default", //只展示好友榜
                dataType: 0, //只圈选type为数字类型的数据进行排序
                rankType: "day", //每月1号更新，只对当月1号到现在写入的数据进行排序
                suffix: "关", //数据后缀，成绩后续默认带上 “分”
                rankTitle: "游戏排行榜", //标题
                success(res) {
                    console.log(`getImRankData success res: ${res}`);
                },
                fail(res) {
                    console.log(`getImRankData fail res: `, res.errMsg);
                },
            });
        } else {

        }
    }

    /**
     * 添加桌面
     * @param scb 
     * @param fcb 
     */
    addShortcut(scb: Function, fcb: Function) {
        if (!this.ch) return;
        this.ch.addShortcut({
            success() {
                console.log('添加桌面成功');
                if (scb) scb();
            },
            fail(err) {
                console.log('添加桌面失败', err.errMsg);
                if (fcb) fcb();
            },
        });
    }
    
    /**
     * 检测是否添加到桌面 
     * @returns true 不支持 或者 已添加
     */
    checkShortcut(){ 
        if (!this.ch) return;
        const version = this.ch.getSystemInfoSync().SDKVersion;
        if (Utils.compareVersion(version, '2.46.0') >= 0) {
            this.ch.checkShortcut({
                success(res) {
                    console.log("检查快捷方式", res.status);
                    this.Shortcutexist = res.status.exist;
                },
                fail(res) {
                    console.log("检查快捷方式失败", res.errMsg);
                },
            });
        }
    }

    isShortcutexist(){
        return this.Shortcutexist;
    }

    //检查订阅
    checkFeedSubscribeStatus() {
        // if (!this.ch) return;
        // if (!this.CheckFeedSubscribeAllScene()) return;
        // this.ch.checkFeedSubscribeStatus({
        //     type: "play",
        //     allScene: true,
        //     success(res) {
        //         console.log("检查订阅", res);
        //         this.isFeedSubscribeSuc = res.status.exist;
        //     },
        //     fail(res) {
        //         console.log("检查订阅失败", res.errMsg);
        //     },
        // });
    }

     //是否已经订阅
    isCheckFeedSubscribeSuc() {
        return this.isFeedSubscribeSuc;
    }

    //是否存在全局订阅
    CheckFeedSubscribeAllScene() {
        if (!this.ch) return;
        if (this.ch.canIUse("checkFeedSubscribeStatus.object.allScene")) {
            return true;
        }
        return false;
    }

    requestFeedSubscribeAllScene(successCallback: Function, failCallback: Function) {
        if (!this.ch) return;
        this.ch.requestFeedSubscribe({
            type: "play",
            allScene: true,
            success(res) {
                console.log(res.success)
                if (successCallback) successCallback(res);
            },
            fail(res) {
                console.log(res.errMsg)
                if (failCallback) failCallback(res);
            },
        })
    }

    //上报场景数据
    reportScene() {
        if (!this.ch) return;
        this.ch.reportScene({
            sceneId: 1000,
            costTime: 50,
            dimension: {
                d1: '2.1.0', // value仅支持传入String类型。若value表示Boolean，请将值处理为'0'、'1'进行上报；若value为Number，请转换为String进行上报
            },
            metric: {
                m1: '546', // value仅支持传入数值且需要转换为String类型进行上报
            },
            success(res) {
                // 上报接口执行完成后的回调，用于检查上报数据是否符合预期
                console.log(res)
            },
            fail(res) {
                // 上报报错时的回调，用于查看上报错误的原因：如参数类型错误等
                console.log(res)
            }
        })

    }

    onFeedStatusChange() {
        if (!this.ch) return;
        this.ch.onFeedStatusChange(({ type }) => {
            if (type === 'feedEnter') {
                console.log('触发从Feed流进入小游戏事件回调')
            }
            if (type === 'feedExit') {
                console.log('触发从小游戏退回到Feed流事件回调')
            }
        })
    }
}
