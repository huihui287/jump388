import { _decorator, Component, Node } from 'cc';
import BaseDialog from '../Common/view/BaseDialog';
import AudioManager from '../Common/AudioManager';
import CM from '../channel/CM';
import GameData from '../Common/GameData';
import ViewManager from '../Common/view/ViewManager';
import { HeroType } from '../Tools/enumHero';
import { getSkinConfig } from '../game/Skin/SkinConfig';
import { waSkin } from '../game/item/waSkin';
const { ccclass, property } = _decorator;

@ccclass('shareVView')
export class shareVView extends BaseDialog {

    //蛙皮肤节点
    @property({type: Node})
    ndwaS: Node = null;

    start() {

    }

    update(deltaTime: number) {

    }

    onLoad() {
        super.onLoad();
        this.initSkins();
    }

    initSkins() {
        if (!this.ndwaS) return;
        
        let children = this.ndwaS.children;
        let index = 0;

        // 遍历 HeroType
        for (let key in HeroType) {
            // 过滤掉字符串 key，只保留数字 value
            if (isNaN(Number(key))) continue;   
            
            let heroId = Number(key);
            let config = getSkinConfig(heroId);
            
            if (config && index < children.length) {
                let item = children[index];
                item.active = true;
                
                let waSkinComp = item.getComponent(waSkin);
                if (waSkinComp) {
                    waSkinComp.setSkin(config);
                }
                index++;
            }
        }
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


