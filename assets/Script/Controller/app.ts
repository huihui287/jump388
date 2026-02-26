// import { NetManager } from "../network/netManager";
import CM from "../channel/CM";
import ViewManager from "../Common/view/ViewManager";
import LoaderManeger from "../sysloader/LoaderManeger";
import { LevelConfig } from "../Tools/levelConfig";
import { GameCtr } from "./GameCtr";
import { SingletonClass } from "./singletonClass";
import { director } from "cc";

/**
 * App管理
 */
class GameApp extends SingletonClass<GameApp> {
    event: any;

    get gameCtr() {
        return GameCtr.getInstance<GameCtr>(GameCtr);
    }
    protected async onInit(canvas: Node) {
    }

    addEvent() {
        // view.setResizeCallback(this.evtResizeCallback.bind(this));
    }

    backStart(isStart: boolean = false, pageIdx: number = 2) {
        // 旧代码：
        // 使用Cocos Creator的director API实现场景跳转
        // director.loadScene("home"); // 跳转到主场景

        if (CM.mainCH) {
            CM.mainCH.hideBannerAd();
        }
        // 修改为使用项目中实际存在的开始场景
        director.loadScene("startScene"); // 跳转到开始场景
    }
    GoGame(isStart: boolean = false, pageIdx: number = 2) {
        // 旧代码：
        // App.view.openView(ViewName.Single.eGameView, isStart, pageIdx);
        // App.audio.play('background', SoundType.Music, true);
        if (CM.mainCH) {
            CM.mainCH.hideBannerAd();
        }
        // 使用Cocos Creator的director API实现场景跳转
        director.loadScene("gameScene"); // 跳转到游戏场景
    }

    setBackLobby() {
        // 旧代码：
        // 使用Cocos Creator的director API实现场景跳转
        // director.loadScene("lobby"); // 跳转到大厅场景
        
        // 修改为使用项目中实际存在的地图场景
        director.loadScene("map"); // 跳转到地图场景
    }

    //窗口大小变化监听
    evtResizeCallback() {
        // App.event.emit(EventName.Lobby.SCROLLING);
    }

    // async showTips(str: string) {
    //     let pre = await ResLoadHelper.loadCommonAssetSync('ui/tipsView', Prefab);

    // }
}

export const App: GameApp = GameApp.getInstance<GameApp>(GameApp);
// 原生调js需要
window["JsApp"] = App;



