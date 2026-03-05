import { _decorator, Component, Node } from 'cc';
import { Pedal } from './Pedal';
import { PedalSkill, PedalType } from '../../Tools/enumConst';
import EventManager from '../../Common/view/EventManager';
import { EventName } from '../../Tools/eventName';
const { ccclass, property } = _decorator;

@ccclass('fracturePedal')
export class fracturePedal extends Pedal {

    onLoad() {
        super.onLoad();
        this.setType(PedalType.FRACTURE_PEDAL);

        this.addSkill([PedalSkill.FRACTURE]);
    }   
    
    start() {

    }

    update(deltaTime: number) {
        
    }

}


