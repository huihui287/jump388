import ChannelDB from "../ChannelDB";
import { BaseINT } from "./BaseINT";
// import Global from "../../global/Global";
// // import TotalTypeManager from "../../script/TotalTypeManager";
// import TotalTypeManager from "../../dbmodule/TotalTypeManager";
/**
 * 通用渠道接口
 */
export default class BaseCH implements BaseINT {
    showInterstitialAd(arg0: () => void) {
        throw new Error("Method not implemented.");
    }
    postMessage() {
        throw new Error('Method not implemented.');
    }
    getOpenDataContext() {
        throw new Error('Method not implemented.');
    }
    getSetting(arg0: (success: any, data: any, error: any) => void) {
        throw new Error('Method not implemented.');
    }
    initData() {
        throw new Error('Method not implemented.');
    }
    login(arg0: () => void) {
        throw new Error('Method not implemented.');
    }
    requestFeedSubscribeAllScene(call: (resp: any) => void, arg1: null) {
        throw new Error('Method not implemented.');
    }
    CheckFeedSubscribeAllScene() {
     
        return false;
    }
    isShortcutexist(): boolean {
       return false;
    }
    addShortcut(scb: Function, fcb: Function) {
       
    }
    startGameRecorderManager() {
       
    }
    stopGameRecorderManager() {
      
    }
    setImRankData_Num(level: number) {
       
    }
    getImRankList_Num() {
       
    }
    recordShare(call: (resp: any) => void) {
        
    }

    /**当前渠道 */
    ch = null;
    
    /**视频广告实例 */
    videoAd = null;

    constructor(channel) {
        this.ch = channel;
    }


    /**获取系统参数*/
    getSystem() {
        if (this.ch) {
            let data = ChannelDB.systemInfo = this.ch.getSystemInfoSync();
            ChannelDB.platform = data.platform;
            ChannelDB.appName = ChannelDB.systemInfo.appName;
            ChannelDB.screenWidth = data.screenWidth;
            ChannelDB.screenHeight = data.screenHeight;
            ChannelDB.devicePixelRatio = data.devicePixelRatio;
            console.log("系统参数：", data);
        }
    }

    /**获取小程序启动参数*/
    getLaunchOptions() {
        if (this.ch) {
            let data = ChannelDB.launchOption = this.ch.getLaunchOptionsSync();
            console.log("启动参数：", data);

            if (data) {
                data.referrerInfo || (data.referrerInfo = {}); //补全
                ChannelDB.sourceScene = ChannelDB.launchOption.scene;
                ChannelDB.sourceAppId = ChannelDB.launchOption.query.source_appid ? ChannelDB.launchOption.query.source_appid : ChannelDB.launchOption.referrerInfo.appId;
            }
        }
    }

    /**监听小游戏回到前台的事件 总是*/
    onShowAlways() {
        if (this.ch) {
            let call = (res) => {
                console.log("监听回到前台事件 总是:", res);
                if (res && res.scene) {
                    ChannelDB.sourceScene = res.scene;
                }
                // AddPhysical.initData();
            };
            this.ch.onShow(call);
        }
    }

    /**监听小游戏回到前台的事件 单次*/
    onShow(callback = null) {
        if (this.ch) {
            let call = (res) => {
                console.log("监听回到前台事件 单次:", res);
                this.ch.offShow(call);//移除有回调的监听事件 避免监听堆积
                if (callback) callback();
            };
            this.ch.offShow(call);
            this.ch.onShow(call);
        }
    }

    /**监听小游戏退出前台 总是*/
    onHide(callback = null) {
        if (this.ch) {
            this.ch.onHide(() => {
                console.log("监听退出事件");
                // TotalTypeManager.setLastLeavlTime();
                // TotalTypeManager.setOffTime();
                // TotalTypeManager.saveData();
                if (callback) callback();
            });
        }
    }

    /**显示加载框*/
    showLoading(time = 3000, callback = null) {
    }
    
    /**创建视频广告*/
    createVideoAd() {
    }
    
    /**显示视频广告*/
    showVideoAd(callback = null) {
    }
    
    /**创建banner广告*/
    createBannerAd() {
    }
    
    /**销毁banner广告*/
    destroyBannerAd() {
    }
    
    /**显示banner广告*/
    showBannerAd() {
    }
    
    /**隐藏banner广告*/
    hideBannerAd() {
    }
    /**分享*/
    share(callback: Function = null) {}
    
    /**分包加载*/
    loadSubPackages(name: string, callback: Function, progressCallback?: Function) {
        if (this.ch) {
            // 调用渠道的分包加载方法
            if (this.ch.loadSubpackage) {
                this.ch.loadSubpackage({
                    name: name,
                    success: () => {
                        console.log('分包加载成功:', name);
                        if (callback) callback(true);
                    },
                    fail: (err) => {
                        console.error('分包加载失败:', name, err);
                        if (callback) callback(false, err);
                    },
                    progress: (res) => {
                        if (progressCallback) {
                            progressCallback(res.progress, res.totalBytesWritten, res.totalBytesExpectedToWrite);
                        }
                    }
                });
            } else {
                // 没有分包加载方法，直接调用回调
                console.warn('当前渠道不支持分包加载');
                if (callback) callback(true);
            }
        } else {
            // 渠道未初始化
            console.error('渠道未初始化，无法加载分包');
            if (callback) callback(false, 'channel not initialized');
        }
    }

    /**隐藏加载框*/
    hideLoading() {
        if (this.ch) {
            this.ch.hideLoading({
                success(res) {
                    if (this.loadingTimeoutId) {
                        clearTimeout(this.loadingTimeoutId);
                        this.loadingTimeoutId = null;
                    }
                },
            })
        }
    }

    /**
    * 显示lToast提示框
    * @param title 
    * @param icon  success成功图标  loading加载图标  none不显示图标
    */
    showToast(title: string, icon: string = 'none', time = 2000) {
        if (this.ch) {
            this.ch.showToast({
                title: title,
                icon: icon,
                duration: time
            })
        }
    }

    /**显示模拟对话框*/
    showModal(title: string, content: string, showCancel = true, callback = null) {
        if (this.ch) {
            this.ch.showModal({
                title: title,
                content: content,
                showCancel: showCancel,
                success(res) {
                    if (res.confirm) {
                        console.log("玩家点击确定");
                        if (callback) callback(true);
                    }
                    else if (res.cancel) {
                        console.log("玩家点击取消");
                        if (callback) callback(false);
                    }
                }
            })
        }
    }

    /**手机振动 15ms*/
    vibrateShort() {
        if (this.ch && this.ch.vibrateShort) {
            this.ch.vibrateShort({
                success() { },
                fail() { },
                complete() { }
            });
        }
    }

    /**手机振动 400ms*/
    vibrateLong() {
        if (this.ch && this.ch.vibrateLong) {
            this.ch.vibrateLong({
                success() { },
                fail() { },
                complete() { }
            });
        }
    }

    /**
     * 写入用户云存储数据
     */
    setUserCloudStorage(game_level: number) {
        if (!this.ch || !this.ch.setUserCloudStorage) {
            return;
        }
        this.ch.setUserCloudStorage({
            KVDataList: [
                {
                    key: "game_level",
                    value: JSON.stringify(game_level),
                },
            ],
            success: (res) => {
                console.log("setUserCloudStorage success", res);
            },
            fail: (res) => {
                console.log("setUserCloudStorage fail", res);
            },
            complete: (res) => {
                console.log("setUserCloudStorage complete", res);
            },
        });
    }

    /**
     * 读取用户云存储数据
     * @param keyList 需要读取的 key 列表
     * @param callback 读取完成回调，参数为平台返回的 KVDataList 或 null
     */

    // KVDataList: {
    //     "score": 100,
    //     "progress": 10
    // }

    getUserCloudStorage( callback?: (data:string) => void) {
        if (!this.ch || !this.ch.getUserCloudStorage ) {
            if (callback) {
                callback(null);
                console.log(" callback(null)");
            }
            return;
        }
         console.log(" callback(null)22222");
        this.ch.getUserCloudStorage({
           keyList: ["ONE"],
            success: (res) => {
                console.log("getUserCloudStorage success", res);
                if (callback) {
                    callback(res.KVDataList || null);
                }
            },
            fail: (res) => {
                console.log("getUserCloudStorage fail", res);
                if (callback) {
                    callback(null);
                }
            },
            complete: (res) => {
                console.log("getUserCloudStorage complete", res);
            },
        });
    }

    /**
     * 检测侧边栏是否存在 (Douyin only)
     * @param callback 
     */
    checkSideBar(callback: (isExist: boolean) => void) {
        console.log("BaseCH checkSideBar: not implemented");
        if (callback) callback(false);
    }

    /**
     * 跳转到侧边栏 (Douyin only)
     * @param callback 
     */
    navigateToSideBar(callback: (success: boolean) => void) {
        console.log("BaseCH navigateToSideBar: not implemente");
        if (callback) callback(false);
    }

    /**
     * 判断是否为安卓平台
     * @returns boolean 是否为安卓平台
     */
    isAndroid(): boolean {  
        // 优先使用 ChannelDB 中存储的平台信息
        if (ChannelDB.platform) {
            return ChannelDB.platform === 'android';
        }

        // 如果 ChannelDB 中没有平台信息，使用 navigator.userAgent 检测
        const userAgent = navigator.userAgent.toLowerCase();
        return userAgent.indexOf('android') > -1;
    }

    /**
     * 判断是否为 iOS 平台
     * @returns boolean 是否为 iOS 平台
     */
    isIOS(): boolean {
        // 优先使用 ChannelDB 中存储的平台信息
        if (ChannelDB.platform) {
            return ChannelDB.platform === 'ios';
        }

        // 如果 ChannelDB 中没有平台信息，使用 navigator.userAgent 检测
        const userAgent = navigator.userAgent.toLowerCase();
        return userAgent.indexOf('iphone') > -1 || userAgent.indexOf('ipad') > -1 || userAgent.indexOf('ipod') > -1;
    }

}
