import { _decorator, Node, tween, v3, instantiate, Label } from 'cc';
import { gridCmpt } from '../game/item/gridCmpt';
import BaseDialog from '../Common/view/BaseDialog';
import AudioManager from '../Common/AudioManager';
import GameData from '../Common/GameData';
import { GridType } from '../Tools/enumConst';
import ViewManager from '../Common/view/ViewManager';
import LoaderManeger from '../sysloader/LoaderManeger';
import { upgradeFruitItem } from './upgradeFruitItem';

const { ccclass, property } = _decorator;
@ccclass('upgradeFruit')
export class upgradeFruit extends BaseDialog {

    gridNodeS: Node = null;
    Itemss: Node = null;

    onLoad() {
        super.onLoad();
        this.gridNodeS = this.viewList.get('win/target');
        this.Itemss = this.viewList.get('win/itmes');
        this.initFruitItems();
    }

    // 初始化水果升级项
    initFruitItems() {
        if (!this.Itemss) return;

        // 按照GridType顺序获取所有水果类型
        const gridTypes = [
            GridType.KIWIFRUIT,
            GridType.MANGOSTEEN,
            GridType.WATERMELON,
            GridType.APPLE,
            GridType.ORANGE
        ];

        // 获取Itemss下的所有子节点
        const children = this.Itemss.children;
        
        // 为每个子节点设置对应的水果类型
        for (let i = 0; i < gridTypes.length && i < children.length; i++) {
            const type = gridTypes[i];
            const itemNode = children[i];
            
            // 设置水果类型
            const itemCom = itemNode.getComponent(upgradeFruitItem);
            if (itemCom) {
                itemCom.setGridType(type);
            }
        }
    }

    onClick_guanbiBtn_End() {
        AudioManager.getInstance().playSound('button_click');
        this.dismiss();
    }

    onClick_SendReward_End() {
        AudioManager.getInstance().playSound('button_click');
        this.dismiss();
    }

    onClick_guanbiBtn() {
        this.dismiss();
    }

}
