/**
 * JoystickControl.ts
 * 虚拟摇杆/触摸控制器 (仅用于 X 轴调试)
 */
import { _decorator, Component, EventTouch, Vec3, v3, Input, input } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('JoystickControl')
export class JoystickControl extends Component {

    /** 灵敏度 */
    @property
    public sensitivity: number = 0.05;

    /** 输入方向向量 */
    private readonly _inputVector = v3();
    
    /** 上次触摸位置的 X */
    private _lastTouchX: number = 0;
    /** 是否正在触摸 */
    private _isTouching: boolean = false;

    protected onLoad(): void {
        this.registerTouchEvents();
    }

    protected onDestroy(): void {
        this.unregisterTouchEvents();
    }

    private registerTouchEvents(): void {
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    private unregisterTouchEvents(): void {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.off(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    private onTouchStart(event: EventTouch): void {
        this._isTouching = true;
        this._lastTouchX = event.getUILocation().x;
        this._inputVector.x = 0;
    }

    private onTouchMove(event: EventTouch): void {
        if (!this._isTouching) return;

        const currentX = event.getUILocation().x;
        const deltaX = currentX - this._lastTouchX;

        // 更新上次位置，实现“增量式”滑动（指哪打哪）
        this._lastTouchX = currentX;

        // 计算输入强度。只要有移动就产生 X 轴方向。
        // 为了丝滑，我们可以直接根据 deltaX 计算一个强度。
        this._inputVector.x = deltaX * this.sensitivity;
    }

    private onTouchEnd(): void {
        this._isTouching = false;
        this._inputVector.x = 0;
    }

    /**
     * 获取输入向量
     */
    public getInputVector(): Vec3 {
        return this._inputVector;
    }

    /**
     * 获取是否正在操作
     */
    public isOperating(): boolean {
        return this._isTouching;
    }
}
