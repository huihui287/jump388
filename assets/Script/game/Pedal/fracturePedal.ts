import { _decorator } from 'cc';
import { Pedal } from './Pedal';
import { PedalType } from '../../Tools/enumPedal';
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

    releaseSkill() {
        super.releaseSkill();
        this.applyFractureEffect();
    }

    /**
     * 断裂效果
     */
    applyFractureEffect() {
        // 断裂效果实现
        console.log("Applying FRACTURE effect");
        // 这里可以添加具体的断裂逻辑，例如改变踏板的物理属性、播放断裂动画等

        // 延迟一秒后释放技能（发送释放对象消息）
        this.scheduleOnce(this.releaseObject, 1.0);

    }

}


