import { _decorator, Component, Label, Node, instantiate } from 'cc';
import BaseDialog from '../Common/view/BaseDialog';
import AudioManager from '../Common/AudioManager';
import CM from '../channel/CM';
import GameData from '../Common/GameData';
import ViewManager from '../Common/view/ViewManager';
import { HeroType } from '../Tools/enumHero';

import { getSkinConfig } from '../game/Skin/SkinConfig';
import { waSkin } from '../game/item/waSkin';
import EventManager from '../Common/view/EventManager';
import { EventName } from '../Tools/eventName';
import { SkinManager } from '../game/Skin/SkinManager';
import LoaderManeger from '../sysloader/LoaderManeger';
const { ccclass, property } = _decorator;

@ccclass('skinView')
export class skinView extends BaseDialog {

    //蛙皮肤节点
    ndwaS: Node = null;

    //蛙皮肤技能描述
    private skillDescLabel: Label = null;


        // 当前选中的 waSkin 组件
    private _currentSelectedSkin: waSkin = null;

    // 使用/购买按钮及其文本
    private btnUse: Node = null;
    private lblUse: Label = null;

    start() {

    }

    update(deltaTime: number) {

    }

    onLoad() {
        super.onLoad();

        this.ndwaS = this.viewList.get("animNode/waS");
        this.skillDescLabel = this.viewList.get("animNode/skillDesc").getComponent(Label);
        
        // 获取按钮和标签
        this.btnUse = this.viewList.get("animNode/usebtn");
        if (this.btnUse) {
             // 假设 Label 是按钮的子节点
            this.lblUse = this.btnUse.getComponentInChildren(Label);
        }

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

        const currentSkinId = SkinManager.getInstance().getCurrentSkinId();
        let equippedSkinConfig = null;
        let equippedSkinComp = null;

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
                    // 设置皮肤信息
                    waSkinComp.setSkin(config, (clickedConfig, clickedSkin) => {
                        this.onSkinClicked(clickedConfig, clickedSkin);
                    });

                    // 更新解锁状态显示
                    const isUnlocked = SkinManager.getInstance().isSkinUnlocked(heroId);
                    waSkinComp.setUnlocked(isUnlocked);

                    // 检查是否是当前装备的皮肤
                    if (heroId === currentSkinId) {
                        equippedSkinConfig = config;
                        equippedSkinComp = waSkinComp;
                    }
                    
                    waSkinComp.setSelected(false);
                }
                index++;
            }
        }

        // 默认选中当前装备的皮肤，如果没有找到则选中第一个
        if (equippedSkinConfig && equippedSkinComp) {
            this.onSkinClicked(equippedSkinConfig, equippedSkinComp);
        } else if (children.length > 0) {
            let firstItem = children[0];
            let firstComp = firstItem.getComponent(waSkin);
            if (firstComp && firstComp._skinConfig) {
                this.onSkinClicked(firstComp._skinConfig, firstComp);
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
        
        // 更新按钮状态
        this.updateButtonState(config);
    }

    updateButtonState(config: any) {
        if (!this.lblUse) return;

        const isUnlocked = SkinManager.getInstance().isSkinUnlocked(config.id);
        const currentSkinId = SkinManager.getInstance().getCurrentSkinId();
        
        if (isUnlocked) {
            if (currentSkinId === config.id) {
                this.lblUse.string = "已装备";
                // 可选：禁用按钮
                // this.btnUse.getComponent(Button).interactable = false;
            } else {
                this.lblUse.string = "使用";
                // this.btnUse.getComponent(Button).interactable = true;
            }
        } else {
            if (config.price > 0) {
                this.lblUse.string = `${config.price}金币`;
            } else {
                this.lblUse.string = "看视频解锁";
            }
            // this.btnUse.getComponent(Button).interactable = true;
        }
    }

    onClick_guanbiBtn() {
        AudioManager.getInstance().playSound('button_click');
        this.dismiss();
    }

    onClick_usebtn() {
        AudioManager.getInstance().playSound('button_click');
        if (!this._currentSelectedSkin) return;

        const config = this._currentSelectedSkin._skinConfig;
        const skinId = config.id;
        const isUnlocked = SkinManager.getInstance().isSkinUnlocked(skinId);

        if (isUnlocked) {
            // 已解锁，直接装备
            SkinManager.getInstance().setCurrentSkinId(skinId);
            EventManager.emit(EventName.Game.SkinChanged);
            this.dismiss();
        } else {
            // 未解锁，尝试购买
            if (SkinManager.getInstance().unlockSkin(skinId)) {
                ViewManager.toast(`成功解锁: ${config.name}`);
                // 刷新状态
                this._currentSelectedSkin.setUnlocked(true);
                this.updateButtonState(config);
            } else {
                ViewManager.toast("金币不足！");
                // 可以弹出获取金币界面
                LoaderManeger.instance.loadPrefab('prefab/ui/getGold').then((prefab) => {
                        ViewManager.show({ node: instantiate(prefab), name: "GetGold" });
                });
            }
        }
    }

}


