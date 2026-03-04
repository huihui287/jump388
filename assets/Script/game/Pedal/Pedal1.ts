import { _decorator, Component, Node } from 'cc';
import { Pedal } from './Pedal';
import { PedalType } from '../../Tools/enumConst';
const { ccclass, property } = _decorator;

@ccclass('Pedal1')  
export class Pedal1 extends Pedal {
    onLoad(): void {
        super.onLoad();
        this.setType(PedalType.PEDAL1);
    }
    start() {

    }

    update(deltaTime: number) {

    }
}


