import { _decorator, Component, Node, UITransform, Vec3, tween, Tween } from 'cc';
import { PedalType, PedalSkill, Constant } from '../../Tools/enumConst';
const { ccclass, property } = _decorator;


  
@ccclass('Pedal')
export class Pedal extends Component {
    
    /**
     * 踏板类型枚举值
     * 与资源命名一致，用于从对象池/预制体映射中取出对应节点
     */
    public _type: PedalType = PedalType.WOOD;
    /**
     * UITransform 缓存
     * 用于读取宽高、锚点等数值，避免频繁 getComponent
     */
    private _uiTransform: UITransform = null!;

    /** 踏板提供的跳跃力度 (决定跳跃高度) */
    @property
    public jumpForce: number = 600;

    /** 踏板提供的跳跃速度 (决定上升时间) */
    @property
    public jumpSpeed: number = 1.45; // 对应 Tween 的 duration

    /** 踏板提供的重力加速度 */
    @property
    public _gravity: number = -2000;
    
    @property
    public skill: PedalSkill = PedalSkill.NONE;
    
    /** 踏板ID 就是层数*/
    public layer: number = 0;

    /**
     * 生命周期：组件加载
     * 缓存 UITransform 组件引用
     */
    onLoad() {
        this._uiTransform = this.getComponent(UITransform);

    }   


    /**
     * 生命周期：首次启用
     */
    start() {

    }

    /**
     * 生命周期：逐帧更新
     * @param deltaTime 帧间隔（秒）
     */
    update(deltaTime: number) {
        
    }

    /**
     * 设置踏板类型
     * @param type 踏板类型（PedalType）
     */
    setType(type: PedalType) {
        this._type = type;
    }
    
    /**
     * 获取踏板类型
     * @returns 踏板类型（PedalType）
     */
    getType(): PedalType {
        return this._type;
    }

    /**
     * 获取踏板宽度（像素）
     * @returns 宽度
     */
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
     * @param _gravity 提供的重力加速度
     */
    init(position: Vec3, jumpForce: number = 600, jumpSpeed: number = 1.45, _gravity: number = -2000) {
        this.node.position = position;
        this.node.active = true;
        this.jumpForce = jumpForce;
        this.jumpSpeed = jumpSpeed;
        this._gravity = _gravity;

    }
    
    /**
     * 开启左右移动
     * @param speed 移动速度 (像素/秒)
     * @param time 单程移动时间 (秒)
     * @param distance 单程移动距离 (像素)
     */
    startMove(speed: number, time: number, distance: number) {

    }
    
    
    
    /**
     * 获取踏板高度（像素）
     * @returns 高度
     */
    getPedalHeight(): number {
        if (!this._uiTransform) {
            this._uiTransform = this.getComponent(UITransform)!;
        }
        return this._uiTransform ? this._uiTransform.height : 20; // 默认高度
    }
    /** 
* 设置踏板ID
* @param layer 踏板ID
*/
    setLayer(layer: number) {
        this.layer = layer;
    }
   /** 释放技能
    * @param pedal 踏板
    */
    releaseSkill() {
    }

}


