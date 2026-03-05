import { _decorator, Component, Node } from 'cc';
import { Pedal } from './Pedal';
import { PedalType } from '../../Tools/enumConst';
const { ccclass, property } = _decorator;
// 云踏板
@ccclass('cloudPedal')
export class cloudPedal extends Pedal {
    onLoad(): void {
        super.onLoad();
        this.setType(PedalType.CLOUD);
    }
    start() {

    }

    update(deltaTime: number) {

    }
}


