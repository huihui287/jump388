import { _decorator, Component, Node, Sprite } from 'cc';
import { Pedal } from './Pedal';
import { PedalType } from '../../Tools/enumConst';
const { ccclass, property } = _decorator;

@ccclass('goldPedal')
export class goldPedal extends Pedal {

    /** 金币数量 */
    @property(Sprite)
    public goldSprite: Sprite = null!;

    onLoad() {
        super.onLoad();
        this.setType(PedalType.GOLD_PEDAL);
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


