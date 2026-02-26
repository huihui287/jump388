import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BulletParticle')
export class BulletParticle extends Component {
      public attack: number = 1; // 攻击
    start() {

    }

    update(deltaTime: number) {
        
    }
    setAttack(attack: number) {
        this.attack = attack;
    }
    getAttack() {
        return this.attack;
    }
}


