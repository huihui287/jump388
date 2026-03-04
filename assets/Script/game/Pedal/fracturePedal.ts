import { _decorator, Component, Node } from 'cc';
import { Pedal } from './Pedal';
import { PedalType } from '../../Tools/enumConst';
const { ccclass, property } = _decorator;

@ccclass('fracturePedal')
export class fracturePedal extends Pedal {

    onLoad() {
        super.onLoad();
        this.setType(PedalType.FRACTURE_PEDAL);
    }   
    
    start() {

    }

    update(deltaTime: number) {
        
    }
}


