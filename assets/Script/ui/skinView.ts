import { _decorator, Component, Label, Node } from 'cc';
import BaseDialog from '../Common/view/BaseDialog';
import AudioManager from '../Common/AudioManager';
import CM from '../channel/CM';
import GameData from '../Common/GameData';
import ViewManager from '../Common/view/ViewManager';
import { HeroType } from '../Tools/enumConst';
import { getSkinConfig } from '../game/Skin/SkinConfig';
import { waSkin } from '../game/item/waSkin';
import EventManager from '../Common/view/EventManager';
import { EventName } from '../Tools/eventName';
import { SkinManager } from '../game/Skin/SkinManager';
const { ccclass, property } = _decorator;

@ccclass('skinView')
export class skinView extends BaseDialog {

    //蛙皮肤节点
    ndwaS: Node = null;

    //蛙皮肤技能描述
    private skillDescLabel: Label = null;


        // 当前选中的 waSkin 组件
    private _currentSelectedSkin: waSkin = null;

    start() {

    }

    update(deltaTime: number) {

    }

    onLoad() {
        super.onLoad();

        this.ndwaS = this.viewList.get("animNode/waS");
        this.skillDescLabel = this.viewList.get("animNode/skillDesc").getComponent(Label);

        this.initSkins();
    }

    // 设置技能描述
    setSkillDesc(desc: string) {

        if (this.skillDescLabel) {
            this.skillDescLabel.string = desc;
        }
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
                    // 传递回调函数
                    waSkinComp.setSkin(config, (clickedConfig, clickedSkin) => {
                        this.onSkinClicked(clickedConfig, clickedSkin);
                    });

                    // 默认选中第一个
                    if (index === 0) {
                        this.onSkinClicked(config, waSkinComp);
                    } else {
                        waSkinComp.setSelected(false);
                    }
                }
                index++;
            }
        }
    }

    onSkinClicked(config: any, waSkinComp: waSkin) {
        console.log("Selected skin:", config.name);
        
        // 更新选中状态
        if (this._currentSelectedSkin) {
            this._currentSelectedSkin.setSelected(false);
        }
        this._currentSelectedSkin = waSkinComp;
        if (this._currentSelectedSkin) {
            this._currentSelectedSkin.setSelected(true);
        }

        this.setSkillDesc(config.description);
    }

    onClick_guanbiBtn() {
        AudioManager.getInstance().playSound('button_click');
        this.dismiss();
    }

    onClick_usebtn() {
        AudioManager.getInstance().playSound('button_click');
        if (this._currentSelectedSkin) {
            SkinManager.getInstance().setCurrentSkinId(this._currentSelectedSkin._skinConfig.id);
            EventManager.emit(EventName.Game.SkinChanged);//发送更改皮肤的消息
            this.dismiss();
        }
    }

}


