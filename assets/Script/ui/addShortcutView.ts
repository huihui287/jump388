import { _decorator, Component, Node } from 'cc';
import BaseDialog from '../Common/view/BaseDialog';
import AudioManager from '../Common/AudioManager';
import CM from '../channel/CM';
import GameData from '../Common/GameData';
import ViewManager from '../Common/view/ViewManager';
import EventManager from '../Common/view/EventManager';
import { EventName } from '../Tools/eventName';
const { ccclass, property } = _decorator;

@ccclass('addShortcutView')
export class addShortcutView extends BaseDialog {

    private goldReward: number = 200;

    start() {

    }

    update(deltaTime: number) {

    }

    onLoad() {
        super.onLoad();
    }

    onClick_addShortBtn() {
        AudioManager.getInstance().playSound('button_click');
        let call = () => {

            // 添加成功，给予金币奖励
            GameData.addGold(this.goldReward);
            ViewManager.toast(`添加成功，获得 ${this.goldReward} 金币`);

            // 发送事件通知，让Start.ts更新按钮状态
            EventManager.emit(EventName.Game.ShortcutAdded);

            this.dismiss();
        }
        CM.mainCH.addShortcut(call, null);
    }

    onClick_guanbiBtn() {
        AudioManager.getInstance().playSound('button_click');
        this.dismiss();
    }

}


