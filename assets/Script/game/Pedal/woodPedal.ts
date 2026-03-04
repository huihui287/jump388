import { _decorator, Component, Node } from 'cc';
import { Pedal } from './Pedal';
import { PedalType } from '../../Tools/enumConst';
const { ccclass, property } = _decorator;

@ccclass('woodPedal')
export class woodPedal extends Pedal {

    onLoad() {
        super.onLoad();
        this.setType(PedalType.WOOD);
    }   
    
    start() {

    }

    update(deltaTime: number) {
        
    }
}


