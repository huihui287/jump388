import { _decorator, Label, Node, tween, v3, instantiate } from 'cc';

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

@ccclass('UpTurret')
export class UpTurret extends BaseDialog {
    Label001: Node = null;
    Label001next: Node = null;

    maxCapacity = 50;
    description: Node = null;
       descriptionnext: Node = null;
    LabelupBtn: Label = null;
    
    onLoad() {
        super.onLoad();
        this.Label001 = this.viewList.get('bg/Label001');
        this.Label001next = this.viewList.get('bg/Label001/Label002');

        this.description = this.viewList.get('bg/description');
        this.descriptionnext = this.viewList.get('bg/description/description001');

        this.LabelupBtn = this.viewList.get('btn/upBtn').getChildByName('LabelupBtn').getComponent(Label);
        this.upTurretLevel();

    }

    upTurretLevel() {
        let turretLevel = GameData.loadData(GameData.TurretLevel, 1);
        this.Label001.getComponent(Label).string = '当前炮塔等级：' + turretLevel;
        this.Label001next.getComponent(Label).string = '' + turretLevel + 1;
        
        // 计算下一级所需的金币数量
        const basePrice = 100;
        const nextLevelPrice = turretLevel * basePrice;
        
        // 计算下一级的容量增加
        const capacityIncrease = 50 * turretLevel;
        
        // 更新描述文本
        this.description.getComponent(Label).string = `当前炮塔容量：${this.maxCapacity}`;
        this.descriptionnext.getComponent(Label).string = `${this.maxCapacity + capacityIncrease}`;
        
        // 更新升级按钮上的价格显示
        if (this.LabelupBtn) {
            this.LabelupBtn.string = `${nextLevelPrice}金币`;
        }
    }
    
    onClick_upBtn() {
        AudioManager.getInstance().playSound('button_click');
        
        // 获取当前炮塔等级
        let turretLevel = GameData.loadData(GameData.TurretLevel, 1);
        
        // 计算升级价格
        const basePrice = 100;
        const upgradePrice = turretLevel * basePrice;
        
        if (GameData.spendGold(upgradePrice)) {
            // 升级炮塔
            this.setupTurretLevel();
            
            // 提示成功
            ViewManager.toast(`升级成功，花费 ${upgradePrice} 金币`);
        } else {
            // 金币不足
            ViewManager.toast(`金币不足，需要 ${upgradePrice} 金币`);
            LoaderManeger.instance.loadPrefab('prefab/ui/getGold').then((prefab) => {
                let getGold = instantiate(prefab);
                ViewManager.show({
                    node: getGold,
                    name: "GetGold"
                });
            });
        }
    }
    
    setupTurretLevel() {
        let turretLevel = GameData.loadData(GameData.TurretLevel, 1);
        turretLevel++;
        GameData.saveData(GameData.TurretLevel, turretLevel);

        this.upTurretLevel();
    }

    onClick_closeBtn() {
        AudioManager.getInstance().playSound('button_click');
        this.dismiss();
    }
}