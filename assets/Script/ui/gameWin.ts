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

// 游戏胜利界面
@ccclass('gameWin')
export class gameWin extends BaseDialog {
    private level: number = 0;
    private goldnum: number = 0;

    // 通过获得金币数更新显示
    @property(Node)
    goldnumlb: Node = null;

    onLoad() {
        super.onLoad();
        // 处理数据

        if (this._data) {
            this.handleData();
        }

    }

    setData(data: any) {
        super.setData(data);

        // 如果 viewList 已经初始化，立即处理数据
        if (this.viewList && this.viewList.size > 0) {
            this.handleData();
        }
    }

    private handleData() {
        if (!this._data) return;

        this.level = GameData.getCurLevel();
        let baseGold = this._data.goldReward || 0;

        // 皮肤加成逻辑
        try {
            const currentSkinId = SkinManager.getInstance().getCurrentSkinId();
            const skinConfig = getSkinConfig(currentSkinId);
            if (skinConfig && skinConfig.passiveSkill) {
                // 百分比加成
                if (skinConfig.passiveSkill.type === HeroSkillType.PASSIVE_GOLD_BONUS) {
                    const bonus = skinConfig.passiveSkill.value || 0;
                    baseGold = Math.floor(baseGold * (1 + bonus));
                } 
                // 固定数值加成
                else if (skinConfig.passiveSkill.type === HeroSkillType.PASSIVE_EXTRA_GOLD) {
                    baseGold += (skinConfig.passiveSkill.value || 0);
                }
            }
        } catch (e) {
            console.warn("Failed to calculate gold bonus for GameWin", e);
        }

        this.goldnum = baseGold;

        AudioManager.getInstance().playSound('win');

        // 查找 goldnumlb 节点
        let goldLabelNode = this.goldnumlb;
        if (!goldLabelNode && this.viewList) {
             // 尝试查找名为 goldnumlb 的节点
             for (let [path, n] of this.viewList) {
                if (n.name === 'goldnumlb') {
                    goldLabelNode = n;
                    break;
                }
            }
        }

        if (goldLabelNode) {
            const label = goldLabelNode.getComponent(Label);
            if (label) {
                label.string = `+${this.goldnum}`;
            }
        }

        if (CM.mainCH) {
            CM.mainCH.setImRankData_Num(GameData.getCurLevel());
            CM.mainCH.setUserCloudStorage(GameData.getCurLevel());
        }
    }
    
    onClick_NextLevelBtn() {
        AudioManager.getInstance().playSound('button_click');
        // 发送事件
        EventManager.emit(EventName.Game.NextLevel);
        this.dismiss();
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

    onClick_guanbiBtn() {

        if (this.level == GameData.getCurLevel()) {
            GameData.nextLevel();
        }

        // 使用 saveData 直接保存，避免 GameData.addGold 再次计算加成
        // GameData.addGold(this.goldnum);
        let currentGold = Number(GameData.loadData(GameData.Gold, 0));
        GameData.saveData(GameData.Gold, currentGold + this.goldnum);

        this.dismiss();
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