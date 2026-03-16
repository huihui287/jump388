import { _decorator, Component, Node, UITransform, Vec3, Enum } from 'cc';
import EventManager from '../../Common/view/EventManager';
import { EventName } from '../../Tools/eventName';
import GameData from '../../Common/GameData';
import { PedalSkill, PedalType } from '../../Tools/enumPedal';
import { Constant } from '../../Tools/enumConst';
import { PedalSkillRegistry } from '../Skill/PedalSkillRegistry';

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
    
    @property({ type: Enum(PedalSkill) })
    public skill: PedalSkill = PedalSkill.NONE;
    
    /** 踏板ID 就是层数*/
    public layer: number = 0;

    /** 原始重力加速度（无技能） */
    private _originalGravity: number = 0;

    /** 技能节点映射 */
    private _skillNodes: Map<PedalSkill, Node> = new Map();

    /** Y轴间隔最小值 下一个pedal与当前pedal的最小间隔*/
    private minYInterval: number=100;
    /** Y轴间隔最大值 下一个pedal与当前pedal的最大间隔*/
    private maxYInterval: number=200;

    public moveSpeed: number = 0;
    public moveTime: number = 0;
    public moveDistance: number = 0;

    private _moveDirection: number = 1;
    private _leftLimit: number = 0;
    private _rightLimit: number = 0;
    private _isMoving: boolean = false;

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
        if (!this._isMoving) return;
        let newX = this.node.position.x + this.moveSpeed * this._moveDirection * deltaTime;
        if (newX >= this._rightLimit) {
            newX = this._rightLimit;
            this._moveDirection = -1;
        } else if (newX <= this._leftLimit) {
            newX = this._leftLimit;
            this._moveDirection = 1;
        }
        this.node.setPosition(newX, this.node.position.y, this.node.position.z);
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
     * @param jumpForce 提供的跳跃力度xx
     * @param jumpSpeed 提供的跳跃速度 (上升时间)
     * @param _gravity 提供的重力加速度
     */
    init(
        position: Vec3,
        jumpForce: number = 600,
        jumpSpeed: number = 1.45,
        _gravity: number = -2000,
        type: PedalType = PedalType.WOOD,
        minYInterval: number = 0,
        maxYInterval: number = 0,
        moveSpeed: number = 0,
        moveTime: number = 0,
        moveDistance: number = 0
    ) {
        this.setSkill(PedalSkill.NONE);
        this.node.position = position;
        this.node.active = true;
        this.jumpForce = jumpForce;
        this.jumpSpeed = jumpSpeed;
        this._gravity = _gravity;
        // 设置Y轴间隔
        this.minYInterval = minYInterval || 100;
        this.maxYInterval = maxYInterval || 200;
        
        this.setType(type);
        
        // 记录原始属性（因为后续可能会被技能修改）
        this._originalGravity = _gravity;

        this._isMoving = false;
        this.moveSpeed = 0;
        this.moveTime = 0;
        this.moveDistance = 0;
        this.startMove(moveSpeed, moveTime, moveDistance);
    }
    
    /**
     * 开启左右移动
     * @param speed 移动速度 (像素/秒)
     * @param time 单程移动时间 (秒)
     * @param distance 单程移动距离 (像素)
     */
    startMove(speed: number, time: number, distance: number) {
        this._isMoving = false;
        this.moveSpeed = 0;
        this.moveTime = time;
        this.moveDistance = distance;

        if (speed === 0) {
            return;
        }
        if (distance <= 0) {
            return;
        }

        if (speed > 0) {
            this.moveSpeed = speed;
        } else if (time > 0) {
            this.moveSpeed = distance / time;
        } else {
            this.moveSpeed = 100;
        }

        const startX = this.node.position.x;
        const screenHalfWidth = Constant.Width / 2;
        const pedalHalfWidth = this.getPedalWidth() / 2;
        const minX = -screenHalfWidth + pedalHalfWidth;
        const maxX = screenHalfWidth - pedalHalfWidth;

        const leftLimit = Math.max(startX - distance, minX);
        const rightLimit = Math.min(startX + distance, maxX);

        if (leftLimit >= rightLimit) {
            return;
        }

        this._leftLimit = leftLimit;
        this._rightLimit = rightLimit;
        this._moveDirection = Math.random() > 0.5 ? 1 : -1;
        this._isMoving = true;
    }
    
    /**
     * 移除特定技能
     * @param skill 要移除的技能
     */
    removeSkill(skill: PedalSkill) {
        if (skill === PedalSkill.NONE) return;
        if (this.skill !== skill) return;
        this.setSkill(PedalSkill.NONE);
    }

    /**
     * 添加技能节点
     */
    addSkillNode(skill: PedalSkill, node: Node) {
        if (!node) return;
        this.clearSkillNodesExcept(skill);
        
        // 如果已经有同类节点，先移除旧的
        if (this._skillNodes.has(skill)) {
            const oldNode = this._skillNodes.get(skill);
            oldNode.destroy();
        }
        
        this._skillNodes.set(skill, node);
        this.node.addChild(node);
        node.setPosition(0, 0, 0); // 居中显示，或者根据需要调整偏移
        
        // 比如金币可以在上方
        if (skill === PedalSkill.GOLD) {
            node.setPosition(0, 50, 0);
        } else if (skill === PedalSkill.SPIKE) {
            // 尖刺在踏板表面
            node.setPosition(0, 20, 0); 
        }
    }

    /**
     * 获取所有技能节点 (用于回收)
     */
    recycleSkillNodes(callback: (skill: PedalSkill, node: Node) => void) {
        this._skillNodes.forEach((node, skill) => {
            callback(skill, node);
        });
        this._skillNodes.clear();
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
        const skill = this.skill ?? PedalSkill.NONE;
        if (skill === PedalSkill.NONE) return;
        // 技能效果统一由 Registry 分发处理；本组件只负责在触发后清空技能（保持一次性触发时序不变）
        PedalSkillRegistry.trigger(skill, this);

        this.setSkill(PedalSkill.NONE);
    }

    public releaseObject() {
        if (!this.node || !this.node.isValid) return;
        EventManager.emit(EventName.Game.ReleaseObject, this.node);
    }

    protected onDisable(): void {
        this.unschedule(this.releaseObject);
    }

    private clearSkillNodesExcept(keepSkill: PedalSkill) {
        const keys = Array.from(this._skillNodes.keys());
        for (const k of keys) {
            if (k === keepSkill) continue;
            const node = this._skillNodes.get(k);
            if (node) {
                node.removeFromParent();
                node.destroy();
            }
            this._skillNodes.delete(k);
        }
    }


    setSkill(skill: PedalSkill) {
        const next = skill ?? PedalSkill.NONE;
        this.clearSkillNodesExcept(next);
        this.skill = next;
    }
}
