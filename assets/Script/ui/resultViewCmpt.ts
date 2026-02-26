import { _decorator, instantiate, Label, Node, tween, v3 } from 'cc';
        
import { App } from '../Controller/app';
import { LevelConfig } from '../Tools/levelConfig';
import { gridCmpt } from '../game/item/gridCmpt';

import { EventName } from '../Tools/eventName';
import CM from '../channel/CM';
import ChannelDB from '../channel/ChannelDB';
import BaseDialog from '../Common/view/BaseDialog';
import AudioManager from '../Common/AudioManager';
import EventManager from '../Common/view/EventManager';
import GameData from '../Common/GameData';
import ViewManager from '../Common/view/ViewManager';
import LoaderManeger from '../sysloader/LoaderManeger';
const { ccclass, property } = _decorator;

@ccclass('resultViewCmpt')
export class ResultViewCmpt extends BaseDialog  {
    private isWin: boolean = false;
    private level: number = 0;
    private goldnum: number = 0;
    private rewardBombs: {type: number, count: number}[] = [];

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
        if (this.viewList.size > 0) {
            this.handleData();
        }
    }

    private handleData() {
        if (!this._data) return;
        
        let { level, isWin, rewardBombs } = this._data;
        this.level = level;
        this.rewardBombs = rewardBombs || [];
        this.isWin = isWin;
        
        if (isWin) {
            AudioManager.getInstance().playSound('win');
        } else {
            AudioManager.getInstance().playSound('lose');
        }
        
        this.viewList.get('animNode/win').active = isWin;
        this.viewList.get('animNode/lose').active = !isWin;
        this.goldnumlb = this.viewList.get('animNode/win/coin8/goldnumlb');
        if (isWin) {
            if (CM.mainCH) {
                CM.mainCH.setImRankData_Num(GameData.getCurLevel());
            }
            if (CM.mainCH) {
                CM.mainCH.setUserCloudStorage(GameData.getCurLevel());
            }
            this.handleWin(this.rewardBombs);
        } else {
            this.handleLose();
        }
    }
    
    showgoldnum() {
        // 2026-01-22: 利用 MaxLevel 判断首通奖励
        // 逻辑：如果当前通关的等级 >= 历史最大解锁等级，说明是首通（因为结算时尚未更新 MaxLevel）
        const maxLv = GameData.getMaxLevel();
        if (this.level >= maxLv) {
            // 首通奖励
            this.goldnum = 200;
        } else {
            // 重复通关奖励（根据需求设为0）
            this.goldnum = 1;
        }
        
        // this.goldnum = 100 * GameData.loadData(GameData.Level, 1);
        this.goldnumlb.getComponent(Label).string = this.goldnum.toString();
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

    onClick_guanbiBtn() {
        if (this.isWin) {
            if (this.level == GameData.getCurLevel()) {
                GameData.nextLevel();
            }
        }
        GameData.addGold(this.goldnum);
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
    
    onClick_upTurretBtn() {
        AudioManager.getInstance().playSound('button_click');
        LoaderManeger.instance.loadPrefab('prefab/ui/UpTurret').then((prefab) => {
            let gridUpView = instantiate(prefab);
            ViewManager.show({
                node: gridUpView,
                name: "UpTurret"
            });
        });
    }
}