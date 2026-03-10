import { _decorator, instantiate, Label, Node, tween, v3 } from 'cc';
        
import { App } from '../Controller/app';


import { EventName } from '../Tools/eventName';
import CM from '../channel/CM';
import ChannelDB from '../channel/ChannelDB';
import BaseDialog from '../Common/view/BaseDialog';
import AudioManager from '../Common/AudioManager';
import EventManager from '../Common/view/EventManager';
import GameData from '../Common/GameData';
import ViewManager from '../Common/view/ViewManager';
import LoaderManeger from '../sysloader/LoaderManeger';
import { SkinManager } from '../game/Skin/SkinManager';
import { getSkinConfig } from '../game/Skin/SkinConfig';
import { HeroSkillType } from '../Tools/enumHero';
const { ccclass, property } = _decorator;

// 游戏失败界面
@ccclass('gameOver')
export class gameOver extends BaseDialog  {

    private level: number = 0;
    private goldnum: number = 0;
    goldnumlb: Node = null;
    onLoad() {
        super.onLoad();
        this.goldnumlb = this.viewList.get('goldnumlb');
        // 处理数据
        if (this._data) {
            this.handleData();
        }

    }

    setData(data: any) {
        super.setData(data);
        
        // 如果 viewList 已经初始化，立即处理数据
        if (this.viewList.size > 0) {
            this.handleData();
        }
    }

    private handleData() {
        if (!this._data) return;
        
        let { currentLayer, totalLayer, goldReward } = this._data;
        
        // 计算奖励金币
        // 规则：通关奖励来自配置 goldReward (如果没有则默认1000)
        // 失败奖励 = (currentLayer / totalLayer) * goldReward
        
        const winReward = goldReward || 1000;
        let finalGoldReward = 0;
        
        if (totalLayer > 0) {
            finalGoldReward = Math.floor((currentLayer / totalLayer) * winReward);
        }
        
        // 皮肤加成逻辑
        try {
            const currentSkinId = SkinManager.getInstance().getCurrentSkinId();
            const skinConfig = getSkinConfig(currentSkinId);
            if (skinConfig && skinConfig.passiveSkill) {
                // 百分比加成
                if (skinConfig.passiveSkill.type === HeroSkillType.PASSIVE_GOLD_BONUS) {
                    const bonus = skinConfig.passiveSkill.value || 0;
                    finalGoldReward = Math.floor(finalGoldReward * (1 + bonus));
                } 
                // 固定数值加成
                else if (skinConfig.passiveSkill.type === HeroSkillType.PASSIVE_EXTRA_GOLD) {
                    finalGoldReward += (skinConfig.passiveSkill.value || 0);
                }
            }
        } catch (e) {
            console.warn("Failed to pre-calculate gold bonus for UI", e);
        }

        this.goldnum = finalGoldReward;
        
        console.log(`GameOver: CurrentLayer=${currentLayer}, TotalLayer=${totalLayer}, BaseReward=${winReward}, FinalReward=${finalGoldReward}`);
        
        // 增加金币到玩家账户
        // 注意：这里我们手动计算了加成，所以不能再调用会自动加成的 GameData.addGold
        // 而是直接修改 Gold 数据
        let currentGold = Number(GameData.loadData(GameData.Gold, 0));
        GameData.saveData(GameData.Gold, currentGold + finalGoldReward);

        AudioManager.getInstance().playSound('lose');
        
        this.showgoldnum();
    }
    
    showgoldnum() {
        if (this.goldnumlb) {
            this.goldnumlb.getComponent(Label).string = this.goldnum.toString();
        }
    }

    handleLose() {
        // 失败处理逻辑
    }
    
    onClick_NextLevelBtn() {
        AudioManager.getInstance().playSound('button_click');
        // 发送事件
        EventManager.emit(EventName.Game.NextLevel);
        this.dismiss();
    }

    handleWin(rewardBombs: {type: number, count: number}[]) {
        this.showgoldnum();
    }

    onClick_continueVideoBtn() {
        AudioManager.getInstance().playSound('button_click');
        
        const cost = 200;
        if (GameData.spendGold(cost)) {
            // 复活成功
            EventManager.emit(EventName.Game.ContinueGame);
            this.dismiss();
        } else {
            // 金币不足
             LoaderManeger.instance.loadPrefab('prefab/ui/getGold').then((prefab) => {
                let getGold = instantiate(prefab);
                ViewManager.show({
                    node: getGold,
                    name: "GetGold"
                });
            });
        }
    }
    
    /** 分享 */
    onClick_shareBtn() {
        AudioManager.getInstance().playSound('button_click');
        
        if (CM.mainCH) {
            CM.mainCH.share((success: boolean) => {
                if (success) {
                    // 分享成功，复活游戏
                    console.log("分享成功，复活游戏");
                    EventManager.emit(EventName.Game.ContinueGame);
                    this.dismiss();
                } else {
                    // 分享失败
                    ViewManager.toast("分享失败");
                }
            });
        }
    }

    onClick_RestartGameBtn() {
        AudioManager.getInstance().playSound('button_click');
        EventManager.emit(EventName.Game.RestartGame);
        this.dismiss();
    }
    
    onClick_backStartbtn() {
        AudioManager.getInstance().playSound('button_click');
        App.backStart(true);
        this.dismiss();
    }

    onClick_upgridBtn() {
        AudioManager.getInstance().playSound('button_click');
        LoaderManeger.instance.loadPrefab('prefab/ui/upgradeFruit').then((prefab) => {
            let gridUpView = instantiate(prefab);
            ViewManager.show({
                node: gridUpView,
                name: "UpgradeFruit"
            });
        });
    }
}