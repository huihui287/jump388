import { _decorator, Component, Node, Label, SubContextView } from 'cc';
import CM from '../../channel/CM';
import GameData from '../../Common/GameData';
import { LevelConfig } from '../../Tools/levelConfig';
import BaseDialog from '../../Common/view/BaseDialog';
const { ccclass, property } = _decorator;

/**
 * 微信渠道排行榜子视图
 * 使用微信开放数据域实现好友排行榜功能
 */
@ccclass('RankSubView')
export class RankSubView extends BaseDialog {

    onLoad() {
        super.onLoad();
        // 初始化微信排行榜
    }

    update(deltaTime: number) {

    }

    onClick_CloseBtn() {
        this.dismiss();
    }

    start() {
        // 初始化微信排行榜
        this.showFriendRank();
    }

    // 检查是否在微信小游戏环境
    // 2. 点击排行榜按钮，通知开放域显示好友排行榜
    showFriendRank() {
        if (CM.mainCH) {
            CM.mainCH.postMessage();
        }
    }

}