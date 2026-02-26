import { _decorator, input, Input, EventTouch, Component } from 'cc';

import EventManager from './view/EventManager';
import { EventName } from '../Tools/eventName';
const { ccclass, property } = _decorator;
/**
 * 射线碰撞检测
 */
@ccclass('TouchCmpt')
export class TouchCmpt extends Component {
    private isCanDo: boolean = false;
    onLoad() {
        
    }
    start() {
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    onTouchStart(event: EventTouch) {
        if (this.isCanDo) return;
        this.isCanDo = true;
        // App.event.emit(EventName.Game.TouchStart, event.getUILocation());
        EventManager.emit(EventName.Game.TouchStart, event.getUILocation());
    }

    onTouchMove(event: EventTouch) {
        if (!this.isCanDo) {
            this.isCanDo = true;
            return;
        }
        // App.event.emit(EventName.Game.TouchMove, event.getUILocation());
        EventManager.emit(EventName.Game.TouchMove, event.getUILocation());
    }

    onTouchEnd(event: EventTouch) {
        this.isCanDo = false;
        // App.event.emit(EventName.Game.TouchEnd, event.getUILocation());
        EventManager.emit(EventName.Game.TouchEnd, event.getUILocation());
    }

}