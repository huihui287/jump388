import { _decorator, Component, Node } from 'cc';
import { Pedal } from './Pedal';
const { ccclass, property } = _decorator;

@ccclass('woodPedal')
export class woodPedal extends Pedal {

    onLoad() {
        super.onLoad();
    }   
    
    start() {

    }

    update(deltaTime: number) {
        
    }
}


