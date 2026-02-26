/**
 * 渠道相关数据
 */
export default class ChannelDB {

    //系统参数
    static systemInfo = null;
    //操作系统类型 "ios" | "android"	已转成小写
    static platform: any;
    //今日头条：Toutiao  抖音短视屏：Douyin  西瓜视频：XiGua  头条极速版：news_article_lite
    static appName = "";
    //手机物理高度
    // static screenWidth = Laya.Browser.clientWidth;
    static screenWidth = window.innerWidth || 0;
    //手机物理宽度
    // static screenHeight = Laya.Browser.clientHeight;
    static screenHeight = window.innerHeight || 0;
    //设备像素比
    // static devicePixelRatio = Laya.Browser.pixelRatio;
    static devicePixelRatio = window.devicePixelRatio || 1;

    //启动参数
    static launchOption = null;
    //来源场景值
    static sourceScene = null;
    //来源Id
    static sourceAppId = null;

    //视频是否可用
    static videoEnable = false;
}



