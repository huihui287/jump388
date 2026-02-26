
import TTCH from "./script/TTCH";
import WxCH from "./script/WxCH";
import BaseCH from "./script/BaseCH";

/**
 * 渠道管理类 
 */
export default class CM {

    /**主渠道 */
    static mainCH: BaseCH = null;

    /**微信 */
    static CH_WEIXIN = 'WX';
    /**QQ */
    static CH_QQ = 'QQ';
    /**字节跳动 */
    static CH_ZJ = 'ZJ';
    /**百度 */
    static CH_BAIDU = 'BD';
    /**VIVO */
    static CH_VIVO = 'VIVO';
    /**OPPO */
    static CH_OPPO = 'OPPO';
    /**华为 */
    static CH_HUAWEI = 'HW';
    /**小米 */
    static CH_XIAOMI = 'XM';
    /**魅族 */
    static CH_MZ = 'MZ';
    /**UC */
    static CH_UC = 'UC';
    /**平台 默认为微信 */
    private static platform = CM.CH_WEIXIN;


    constructor(platform) {
         CM.platform = platform;
         this.initPlatform();
        //  CM.mainCH.getSystem();
        //  CM.mainCH.getLaunchOptions();
        //  CM.mainCH.onShowAlways();
        // CM.mainCH.createBannerAd();
        // CM.mainCH.createVideoAd();
        // CM.mainCH.createInterstitialAd();//wx qq oppo vivo
        // CM.mainCH.checkUpdate();//wx tt qq
        // CM.mainCH.setShareAppMessage();//wx qq
        // CM.mainCH.installShortcut();//oppo vivo
        // CM.mainCH.getGameRecorderManager();//tt
        // CM.mainCH.createAppBox();//qq
    }

    private initPlatform() {
        console.log("CM.platform:", CM.platform)
        if (CM.platform == CM.CH_WEIXIN)
            CM.mainCH = new WxCH(CM.onWindow()) as any
        // else if (CM.platform == CM.CH_QQ)
        //     CM.mainCH = new QQCH(CM.onWindow()) as any
        else if (CM.platform == CM.CH_ZJ)
            CM.mainCH = new TTCH(CM.onWindow()) as any
        // else if (CM.platform == CM.CH_BAIDU)
        //     CM.mainCH = new BDCH(CM.onWindow()) as any
        // else if (CM.platform == CM.CH_OPPO)
        //     CM.mainCH = new OppoCH(CM.onWindow()) as any
        // else if (CM.platform == CM.CH_VIVO)
        //     CM.mainCH = new VivoCH(CM.onWindow()) as any
        // else if (CM.platform == CM.CH_MZ)
        //     CM.mainCH = new MzCH(CM.onWindow()) as any
        // else if (CM.platform == CM.CH_UC)
        //     CM.mainCH = new UcCH(CM.onWindow()) as any
    }

    /**判断window对象 */
    static onWindow() {
        if (CM.platform == CM.CH_WEIXIN)
            // return Laya.Browser.window.wx;
            return window.wx;
        else if (CM.platform == CM.CH_QQ)
            // return Laya.Browser.window.qq;
            return window.qq;
        else if (CM.platform == CM.CH_ZJ)
            // return Laya.Browser.window.tt;
            return window.tt;
        else if (CM.platform == CM.CH_BAIDU)
            // return Laya.Browser.window.swan;
            return window.swan;
        else if (CM.platform == CM.CH_OPPO)
            // return Laya.Browser.window.qg;
            return window.qg;
        else if (CM.platform == CM.CH_VIVO)
            // return Laya.Browser.window.qg;
            return window.qg;
        else if (CM.platform == CM.CH_XIAOMI)
            // return Laya.Browser.window.qg;
            return window.qg;
        else if (CM.platform == CM.CH_HUAWEI)
            // return Laya.Browser.window.hbs;
            return window.hbs;
        else if (CM.platform == CM.CH_MZ)
            // return Laya.Browser.window.mz;
            return window.mz;
        else if (CM.platform == CM.CH_UC)
            // return Laya.Browser.window.uc;
            return window.uc;
        console.log("CM:", 4)
    }

    /**判断运行平台 */
    static onMiniGame() {
        const ua = navigator.userAgent;
        switch(CM.platform) {
            case CM.CH_WEIXIN:
                return ("wx" in window && ua.indexOf('MiniGame') > -1) || ua.indexOf('MicroMessenger') > -1;
            case CM.CH_QQ:
                return "qq" in window && ua.indexOf('MiniGame') > -1;
            case CM.CH_ZJ:
                return "tt" in window && (ua.indexOf('ToutiaoMicroApp') > -1 || ua.indexOf('DouyinMicroApp') > -1);
            case CM.CH_BAIDU:
                return "swan" in window && ua.indexOf('swan/') > -1;
            case CM.CH_OPPO:
                return "qg" in window && ua.indexOf('quickgame') > -1;
            case CM.CH_VIVO:
                return "qg" in window && ua.indexOf('quickgame') > -1;
            case CM.CH_XIAOMI:
                return "qg" in window && ua.indexOf('quickgame') > -1;
            case CM.CH_HUAWEI:
                return "hbs" in window;
            case CM.CH_MZ:
                return "mz" in window && ua.indexOf('mz_jsb') > -1;
            case CM.CH_UC:
                return "uc" in window && ua.indexOf('UCGame') > -1;
            default:
                return false;
        }
    }

    /**获取当前平台 */
    static getPlatform() {
        return this.platform;
    }

    /**判断当前平台 */
    static isPlatform(platform) {
        return (platform == this.platform);
    }

    /**
     * 全局分包加载方法
     * @param name 分包名称
     * @param callback 加载完成回调
     * @param progressCallback 进度更新回调 (progress: number, totalBytesWritten: number, totalBytesExpectedToWrite: number)
     */
    static loadSubPackages(name: string, callback: Function, progressCallback?: Function): any {
        console.log("CM loadSubPackages:", name);
        if (CM.mainCH) {
            return CM.mainCH.loadSubPackages(name, callback, progressCallback);
        } else {
            console.error("CM mainCH is not initialized");
            if (callback) callback(false, "channel not initialized");
            return null;
        }
    }

}



