import { _decorator, Component, instantiate, Node, ProgressBar } from 'cc';
import CM from '../channel/CM';
import LoaderManeger from '../sysloader/LoaderManeger';
import GameData from '../Common/GameData';
import { BaseNodeCom } from './BaseNodeCom';
import AudioManager from '../Common/AudioManager';
import ViewManager from '../Common/view/ViewManager';
import ChannelDB from '../channel/ChannelDB';
import EventManager from '../Common/view/EventManager';
import { EventName } from '../Tools/eventName';
const { ccclass, property } = _decorator;
@ccclass('Start')
export class Start extends BaseNodeCom {

    //侧边框的按钮
    SideBorderBtn: Node = null;

    //菜单中侧边框的奖励图标
    Icon_Menu_Reword: Node = null;

    //菜单中侧边框的引导图标
    Icon_Menu_Guide: Node = null;

    //订阅按钮
    Subscribebtn: Node = null;

    //添加到桌面快捷方式按钮
    addShortBtn: Node = null;
    
    protected start() {
        this.checkSidebarState();
        this.checkDesktopShortcut();
        //this.showSubscribebtn();
    }

    protected onLoad(): void {
        super.onLoad();
        this.SideBorderBtn = this.viewList.get('homeView/SideBorderBtn');
        this.Icon_Menu_Reword = this.viewList.get('homeView/SideBorderBtn/Icon_Menu_Reword');
        this.Icon_Menu_Guide = this.viewList.get('homeView/SideBorderBtn/Icon_Menu_Guide');
        this.Subscribebtn = this.viewList.get('homeView/Subscribebtn');
        this.addShortBtn = this.viewList.get('homeView/addShortBtn');
        // 默认隐藏侧边栏按钮，检测后再显示
        if (this.SideBorderBtn) this.SideBorderBtn.active = false;

        // 监听侧边栏启动/恢复事件
        EventManager.on(EventName.Game.LaunchFromSidebar, this.onLaunchFromSidebar, this);
        
        // 监听桌面快捷方式添加成功事件
        EventManager.on(EventName.Game.ShortcutAdded, this.onShortcutAdded, this);
    }

    public onDestroy(): void {
        super.onDestroy();
        EventManager.off(EventName.Game.LaunchFromSidebar, this.onLaunchFromSidebar, this);
        EventManager.off(EventName.Game.ShortcutAdded, this.onShortcutAdded, this);
    }

    /**
     * 处理桌面快捷方式添加成功事件
     */
    onShortcutAdded() {
        console.log('Start: onShortcutAdded event received');
        if (this.addShortBtn) this.addShortBtn.active = false;
    }

    /**
     * 处理侧边栏启动事件
     */
    onLaunchFromSidebar() {
        console.log('Start: onLaunchFromSidebar event received');
        if (this.SideBorderBtn) this.SideBorderBtn.active = false;
        // 切换到侧边栏状态
        this.handleSidebarLaunch();
    }

    // 检查侧边栏状态
    checkSidebarState() {
        if (!CM.isPlatform(CM.CH_ZJ)) {
            // 非字节平台隐藏按钮
            if (this.SideBorderBtn) this.SideBorderBtn.active = false;
            return;
        }

        // 检测侧边栏是否支持
        if (CM.mainCH && CM.mainCH.checkSideBar) {
            CM.mainCH.checkSideBar((isExist) => {
                if (!isExist) {
                    if (this.SideBorderBtn) this.SideBorderBtn.active = false;
                    return;
                }

                // 侧边栏存在，显示按钮
                if (this.SideBorderBtn) this.SideBorderBtn.active = true;

                // 判断是否从侧边栏启动 (021036)
                const isFromSidebar = ChannelDB.sourceScene === '021036';
                console.log('Is launch from sidebar:', isFromSidebar);

                if (isFromSidebar) {
                    // 从侧边栏进入
                    this.handleSidebarLaunch();
                } else {
                    // 普通启动
                    this.handleNormalLaunch();
                }
            });
        }
    }

    // 处理从侧边栏启动的逻辑
    handleSidebarLaunch() {
        // 显示奖励图标状态
        if (this.Icon_Menu_Reword) this.Icon_Menu_Reword.active = true;
        if (this.Icon_Menu_Guide) this.Icon_Menu_Guide.active = false;

        // 检查今日是否已领取
        if (!GameData.isSidebarRewardClaimedToday()) {
            console.log('Sidebar reward available!');
            // 自动发放奖励
            this.claimSidebarReward();
        } else {
            console.log('Sidebar reward already claimed today.');
            // ViewManager.toast('今日奖励已领取，明天再来吧~');
        }
    }

    // 处理普通启动的逻辑
    handleNormalLaunch() {
        // 显示引导图标状态
        if (this.Icon_Menu_Reword) this.Icon_Menu_Reword.active = false;
        if (this.Icon_Menu_Guide) this.Icon_Menu_Guide.active = true;
    }

    // 领取侧边栏奖励
    claimSidebarReward() {
        // 标记今日已领
        GameData.setSidebarRewardClaimed();

        // 发放奖励 (例如: 100金币)
        const rewardGold = 300;
        GameData.addGold(rewardGold);

        // 弹出奖励提示 (复用GetGold弹窗或通用提示)
        // 这里使用简单的Toast或者通用弹窗
        ViewManager.toast(`侧边栏专属奖励: 金币+${rewardGold}`);

        // 刷新UI
        // EventManager.emit(EventName.Game.UpdateGold); // 如果有这个事件的话
    }

    //点击侧边框按钮
    onClick_SideBorderBtn() {
        AudioManager.getInstance().playSound('button_click');

        const isFromSidebar = ChannelDB.sourceScene === '021036';

        if (isFromSidebar) {
            // 如果是从侧边栏进来的，再次点击按钮
            if (GameData.isSidebarRewardClaimedToday()) {
                ViewManager.toast("今日奖励已领取，明天再来吧~");
            } else {
                // 理论上自动发放了，这里作为补救
                this.claimSidebarReward();
            }
        } else {
            // 如果不是从侧边栏进来的，弹出引导弹窗
            LoaderManeger.instance.loadPrefab('prefab/SideBorder/SideBorderView').then((prefab) => {
                let guideView = instantiate(prefab);
                ViewManager.show({
                    node: guideView,
                    name: "SideBorderView"
                });
            });
        }
    }

    //点击分享按钮
    onClick_shareBtn() {
        AudioManager.getInstance().playSound('button_click');
        CM.mainCH.share();
    }
    
    onClick_startBtn() {
        LoaderManeger.instance.loadPrefab('prefab/ui/levelSelect').then((prefab) => {
            let levelSelect = instantiate(prefab);
            ViewManager.show({
                node: levelSelect,
                name: "LevelSelect"
            });
        });
        // App.gameCtr.curLevel = LevelConfig.getCurLevel();
        // App.GoGame();
    }

    onClick_settingBtn() {
        AudioManager.getInstance().playSound('button_click');
        // App.view.openView(ViewName.Single.eSettingView);
        LoaderManeger.instance.loadPrefab('prefab/ui/settingGameView').then((prefab) => {
            let setting = instantiate(prefab);
            ViewManager.show({
                node: setting,
                name: "SettingGameView"
            });
        });
    }
    onClick_uppaotaBtn() {
        AudioManager.getInstance().playSound('button_click');
        // App.view.openView(ViewName.Single.eSettingView);
        LoaderManeger.instance.loadPrefab('prefab/ui/UpTurret').then((prefab) => {
            let uppaota = instantiate(prefab);
            ViewManager.show({
                node: uppaota,
                name: "UpTurret"
            });
        });
    }

    onClick_upgradeFruitBtn() {
        AudioManager.getInstance().playSound('button_click');
        LoaderManeger.instance.loadPrefab('prefab/ui/upgradeFruit').then((prefab) => {
            let upgradeFruit = instantiate(prefab);
            ViewManager.show({
                node: upgradeFruit,
                name: "UpgradeFruit"
            });
        });
    }

    onClick_levelBtn() {
        AudioManager.getInstance().playSound('button_click');
        LoaderManeger.instance.loadPrefab('prefab/ui/levelSelect').then((prefab) => {
            let levelSelect = instantiate(prefab);
            ViewManager.show({
                node: levelSelect,
                name: "LevelSelect"
            });
        });
    }

    onClick_LeaderboardBtn() {
        AudioManager.getInstance().playSound('button_click');
         console.log('当前渠道不支持排行榜功能1');
        // 根据不同渠道显示排行榜
        if (CM.isPlatform(CM.CH_ZJ)) {
            // 抖音渠道：使用原生排行榜
            if (CM.mainCH && CM.mainCH.getImRankList_Num) {
                CM.mainCH.getImRankList_Num();
            } else {
                console.log('抖音渠道不支持原生排行榜');
            }
        } else {
            // 其他渠道：可以添加对应的排行榜逻辑
            CM.mainCH.getSetting((success, data, error) => {
                if (success) {
                    console.log('当前渠道不支持排行榜功能');
                    LoaderManeger.instance.loadPrefab('prefab/ui/RankSubView').then((prefab) => {
                        let rankSubView = instantiate(prefab);
                        ViewManager.show({
                            node: rankSubView,
                            name: "RankSubView"
                        });
                    });
                } else {
                    console.log('用户未授权');
                }
            });


        }
    }

    /**
     * 检查并添加桌面快捷启动（仅安卓平台和抖音渠道）
     */
    private checkDesktopShortcut() {
        // 1. 检查是否为抖音渠道
        if (!CM.isPlatform(CM.CH_ZJ)) {
            console.log('CheckDesktopShortcut: 非抖音渠道，跳过检查');
            if (this.addShortBtn) this.addShortBtn.active = false;
            return;
        }

        // 2. 检查是否为安卓平台
        let isAndroid = false;
        if (CM.mainCH?.isAndroid) {
            // 优先使用渠道提供的平台检测方法
            isAndroid = CM.mainCH.isAndroid();
        } else {
            // 回退到 navigator.userAgent 检测
            isAndroid = /android/i.test(navigator.userAgent);
        }

        if (!isAndroid) {
            console.log('CheckDesktopShortcut: 非安卓平台，跳过检查');
            if (this.addShortBtn) this.addShortBtn.active = false;
            return;
        }

        // 3. 检查是否有桌面快捷启动的 API
        if (!CM.mainCH  || !CM.mainCH.addShortcut) {
            console.log('CheckDesktopShortcut: 抖音渠道不支持桌面快捷启动 API');
            if (this.addShortBtn) this.addShortBtn.active = false;
            return;
        }

        // 4. 检查桌面上是否已经有快捷启动
        let Exist = CM.mainCH.isShortcutexist();
        if (Exist == false) {
            // 未添加到桌面，显示addShortBtn
            if (this.addShortBtn) this.addShortBtn.active = true;
        } else {
            // 已添加到桌面，隐藏addShortBtn
            if (this.addShortBtn) this.addShortBtn.active = false;
        }
    }   
    
    onClick_addShortBtn() {
        AudioManager.getInstance().playSound('button_click');
        LoaderManeger.instance.loadPrefab('prefab/ui/addShortcutView').then((prefab) => {
            let addShortcutView = instantiate(prefab);
            ViewManager.show({
                node: addShortcutView,
                name: "AddShortcutView"
            });
        });
    }

    showSubscribebtn() {
        // 1. 检查是否为抖音渠道
        if (!CM.isPlatform(CM.CH_ZJ)) {
            console.log('CheckDesktopShortcut: 非抖音渠道，跳过检查');
            this.Subscribebtn.active = false;
            return;
        }
        if (CM.mainCH.CheckFeedSubscribeAllScene()) {
            this.Subscribebtn.active = true;
        }
        else {
            this.Subscribebtn.active = false;
        }
    }

    onClick_Subscribebtn() {
        AudioManager.getInstance().playSound('button_click');
        LoaderManeger.instance.loadPrefab('prefab/ui/SubscribeView').then((prefab) => {
            let SubscribeView = instantiate(prefab);
            ViewManager.show({
                node: SubscribeView,
                name: "SubscribeView"
            });
        });
    }

}
