import { _decorator, Component, Label, Node, instantiate } from 'cc';
import { GridType } from '../Tools/enumConst';
import GameData from '../Common/GameData';
import { gridCmpt } from '../game/item/gridCmpt';
import AudioManager from '../Common/AudioManager';
import ViewManager from '../Common/view/ViewManager';
import LoaderManeger from '../sysloader/LoaderManeger';
import { BaseNodeCom } from '../game/BaseNodeCom';
const { ccclass, property } = _decorator;

@ccclass('upgradeFruitItem')
export class upgradeFruitItem extends BaseNodeCom {
    
    gridTypeValue: GridType = GridType.KIWIFRUIT;
    gridNode: Node = null;
    fnt: Label = null; // 当前等级
    fntnext: Label = null; // 下一等级
    priceLabel: Label = null; // 下一等级所需金币
    addButton: Node = null; // 升级按钮

    onLoad() {
        super.onLoad();
        this.gridNode = this.node.getChildByName('grid');   
        this.fnt = this.gridNode.getChildByName('lb').getComponent(Label);
        this.fntnext = this.node.getChildByName('lb-001').getComponent(Label);

        this.addButton = this.node.getChildByName('add0');
        this.priceLabel = this.addButton.getChildByName('fnt').getComponent(Label);
        this.initData();
    }

    // 设置水果类型
    setGridType(type: GridType) {
        this.gridTypeValue = type;
    }

    // 初始化数据
    initData() {
        // 设置grid图片
        let gridComponent = this.gridNode.getComponent(gridCmpt);
        if (gridComponent) {
            gridComponent.setType(this.gridTypeValue);
        }

        // 获取当前等级
        const gridTypeTemp = 'LVAttack' + this.gridTypeValue;
        const currentLevel = GameData.loadData(gridTypeTemp, 1);

        // 显示当前等级
        if (this.fnt) {
            this.fnt.string = `当前等级:   ${currentLevel}`;
        }

        // 显示下一等级
        if (this.fntnext) {
            this.fntnext.string = ` ${currentLevel + 1}`;
        }

        // 计算并显示下一等级所需金币
        const basePrice = 100;
        const nextLevelPrice = currentLevel * basePrice;
        if (this.priceLabel) {
            this.priceLabel.string = `${nextLevelPrice}`;
        }
    }

    // 升级按钮点击事件
    onClick_add0() {
        AudioManager.getInstance().playSound('button_click');
        
        // 获取当前攻击等级
        const gridTypeTemp = 'LVAttack' + this.gridTypeValue;
        const currentLevel = GameData.loadData(gridTypeTemp, 1);
        
        // 根据等级计算购买价格
        const basePrice = 100;
        const buyPrice = currentLevel * basePrice;
        
        // 检查金币是否足够
        const currentGold = GameData.getGold();
        if (currentGold < buyPrice) {
            ViewManager.toast(`金币不足，需要 ${buyPrice} 金币`);
            // 弹出购买金币界面
            LoaderManeger.instance.loadPrefab('prefab/ui/getGold').then((prefab) => {
                let getGoldNode = instantiate(prefab);
                ViewManager.show({
                    node: getGoldNode,
                    name: "GetGold"
                });
            });
            return;
        }
        
        // 花费金币
        const spendSuccess = GameData.spendGold(buyPrice);
        if (!spendSuccess) {
            ViewManager.toast("购买失败");
            return;
        }
        
        // 提升攻击等级
        GameData.saveData(gridTypeTemp, currentLevel + 1);
        ViewManager.toast(`购买成功，攻击提升到等级 ${currentLevel + 1}，花费 ${buyPrice} 金币`);
        
        // 更新界面显示
        this.initData();
    }
}
