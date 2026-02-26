import { _decorator, Component, Node } from 'cc';
import BaseDialog from '../Common/view/BaseDialog';
import AudioManager from '../Common/AudioManager';
import CM from '../channel/CM';
import GameData from '../Common/GameData';
import ViewManager from '../Common/view/ViewManager';
const { ccclass, property } = _decorator;

@ccclass('SubscribeView')
export class SubscribeView extends BaseDialog {

    
    start() {

    }

    update(deltaTime: number) {

    }

    onLoad() {
        super.onLoad();
    }

    onClick_SubscribetBtn() {
        AudioManager.getInstance().playSound('button_click');
        let self = this;
        let call = (resp: any) => {
            if (resp) {
                const goldReward = 1000; // 可以根据实际需求调整奖励数量
                GameData.addGold(goldReward);   
                ViewManager.toast(`订阅成功，获得 ${goldReward} 金币`);
                self.dismiss();
            } else {
                ViewManager.toast("您已订阅，无需重复添加");
            }
        }
        CM.mainCH.requestFeedSubscribeAllScene(call, null);
    }

    onClick_guanbiBtn() {
        AudioManager.getInstance().playSound('button_click');
        this.dismiss();
    }

}


