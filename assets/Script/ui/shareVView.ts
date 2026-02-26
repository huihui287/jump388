import { _decorator, Component, Node } from 'cc';
import BaseDialog from '../Common/view/BaseDialog';
import AudioManager from '../Common/AudioManager';
import CM from '../channel/CM';
import GameData from '../Common/GameData';
import ViewManager from '../Common/view/ViewManager';
const { ccclass, property } = _decorator;

@ccclass('shareVView')
export class shareVView extends BaseDialog {

    start() {

    }

    update(deltaTime: number) {

    }

    onLoad() {
        super.onLoad();
    }

    onClick_shareVBtn() {
        AudioManager.getInstance().playSound('button_click');
        let self = this;
        let call = (resp: any) => {
            if (resp) {
                console.log('分享成功', resp);
                const goldReward = 200; // 可以根据实际需求调整奖励数量
                GameData.addGold(goldReward);
                ViewManager.toast(`分享成功，获得 ${goldReward} 金币`);
            } else {
                console.log('分享失败');
            }
        }
        CM.mainCH.recordShare(call);
        self.dismiss();
    }

    onClick_guanbiBtn() {
        AudioManager.getInstance().playSound('button_click');
        this.dismiss();
    }

}


