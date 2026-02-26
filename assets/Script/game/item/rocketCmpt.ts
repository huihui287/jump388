import { _decorator, Component, Node, tween, v3 } from 'cc';
import { BaseNodeCom } from '../BaseNodeCom';
import { Bomb } from '../../Tools/enumConst';
import EventManager from '../../Common/view/EventManager';
import { EventName } from '../../Tools/eventName';
const { ccclass, property } = _decorator;

@ccclass('rocketCmpt')
export class rocketCmpt extends BaseNodeCom {
    onLoad() {
        super.onLoad();
    }

    initData(type: Bomb) {
        this.reset();
        this.viewList.get('down').active = type == Bomb.ver;
        this.viewList.get('up').active = type == Bomb.ver;
        this.viewList.get('right').active = type == Bomb.hor;
        this.viewList.get('left').active = type == Bomb.hor;
        let time = 0.6;
        if (type == Bomb.ver) {
            tween(this.viewList.get('down')).to(time, { position: v3(0, -800, 1) }).start();
            tween(this.viewList.get('up')).to(time, { position: v3(0, 800, 1) }).call(() => {
                EventManager.emit(EventName.Game.RecycleRocket, this.node);
            }).start();
        }
        else if (type == Bomb.hor) {
            tween(this.viewList.get('right')).to(time, { position: v3(720, 0, 1) }).start();
            tween(this.viewList.get('left')).to(time, { position: v3(-720, 0, 1) }).call(() => {
                EventManager.emit(EventName.Game.RecycleRocket, this.node);
            }).start();
        }
    }

    /**
     * 重置火箭状态
     */
    reset() {
        // 重置所有方向节点的位置到初始状态
        if (this.viewList.get('down')) {
            this.viewList.get('down').position = v3(0, 0, 1);
            this.viewList.get('down').active = false;
        }
        if (this.viewList.get('up')) {
            this.viewList.get('up').position = v3(0, 0, 1);
            this.viewList.get('up').active = false;
        }
        if (this.viewList.get('right')) {
            this.viewList.get('right').position = v3(0, 0, 1);
            this.viewList.get('right').active = false;
        }
        if (this.viewList.get('left')) {
            this.viewList.get('left').position = v3(0, 0, 1);
            this.viewList.get('left').active = false;
        }
    }
}


