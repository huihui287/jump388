import { _decorator, Component, Node, UITransform, Vec3 } from 'cc';
import { PedalType } from '../../Tools/enumConst';
const { ccclass, property } = _decorator;

@ccclass('Pedal')
export class Pedal extends Component {
    
    private _type: PedalType = PedalType.WOOD;
    private _uiTransform: UITransform = null!;

    /** 踏板提供的跳跃力度 (决定跳跃高度) */
    @property
    public jumpForce: number = 600;

    /** 踏板提供的跳跃速度 (决定上升时间) */
    @property
    public jumpSpeed: number = 1.45; // 对应 Tween 的 duration

    /** 踏板提供的重力加速度 */
    @property
    public gravity: number = -2000;
    
    onLoad() {
        this._uiTransform = this.getComponent(UITransform);
    }   

    start() {

    }

    update(deltaTime: number) {
        
    }

    setType(type: PedalType) {
        this._type = type;
    }
    
    getType(): PedalType {
        return this._type;
    }

    getPedalWidth(): number {
        if (!this._uiTransform) {
            this._uiTransform = this.getComponent(UITransform)!;
        }
        return this._uiTransform ? this._uiTransform.width : 100;
    }

    /**
     * 初始化踏板
     * @param position 初始位置
     * @param jumpForce 提供的跳跃力度
     * @param jumpSpeed 提供的跳跃速度 (上升时间)
     * @param gravity 提供的重力加速度
     */
    init(position: Vec3, jumpForce: number = 600, jumpSpeed: number = 1.45, gravity: number = -2000) {
        this.node.position = position;
        this.node.active = true;
        this.jumpForce = jumpForce;
        this.jumpSpeed = jumpSpeed;
        this.gravity = gravity;
    }
    
    getPedalHeight(): number {
        if (!this._uiTransform) {
            this._uiTransform = this.getComponent(UITransform)!;
        }
        return this._uiTransform ? this._uiTransform.height : 20; // 默认高度
    }
}


