import { _decorator, Component, Node } from 'cc';
import { Pedal } from './Pedal';
import { PedalType } from '../../Tools/enumConst';
import EventManager from '../../Common/view/EventManager';
import { EventName } from '../../Tools/eventName';
const { ccclass, property } = _decorator;

@ccclass('spikePedal')
export class spikePedal extends Pedal {

    onLoad() {
        super.onLoad();
        this.setType(PedalType.SPIKE_PEDAL);
    }   
    
    start() {

    }

    update(deltaTime: number) {
        
    }

    /** 释放技能
 * @param pedal 踏板
 */
    releaseSkill() {
        
    }


}


