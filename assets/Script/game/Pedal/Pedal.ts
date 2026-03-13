import { _decorator, Component, Node, UITransform, Vec3, Enum } from 'cc';
import EventManager from '../../Common/view/EventManager';
import { EventName } from '../../Tools/eventName';
import GameData from '../../Common/GameData';
import { PedalSkill, PedalType } from '../../Tools/enumPedal';
import { Constant } from '../../Tools/enumConst';

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
    
    @property({ type: [Enum(PedalSkill)] })
    public skills: PedalSkill[] = [PedalSkill.NONE];
    
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

        // 初始化技能
        this.skills = [];
        if (this._type === PedalType.FRACTURE_PEDAL) {
            this.addSkill([PedalSkill.FRACTURE]);
        }

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
        const index = this.skills.indexOf(skill);
        if (index > -1) {
            this.skills.splice(index, 1);
            
            // 移除并回收对应的技能节点
            const skillNode = this._skillNodes.get(skill);
            if (skillNode) {
                skillNode.removeFromParent();
                // 暂时不直接销毁，而是隐藏或放回池中
                // 由于 Pedal 无法直接访问 pedalManager 的对象池，这里我们选择直接销毁或者隐藏
                // 更好的做法是通知 pedalManager 回收，或者在 removeSkill 时由 pedalManager 处理回收
                // 为了简单起见，这里先将其隐藏，等待 Pedal 回收时一并处理
                skillNode.active = false;
                
                // 但为了正确回收，我们应该让 pedalManager 来管理
                // 由于 removeSkill 是被外部调用的，外部应该也负责回收节点
                // 这里我们仅从 _skillNodes 中移除引用
                this._skillNodes.delete(skill);
                // 真正的回收逻辑应该在外部处理，或者使用 destroy
                skillNode.destroy(); // 临时方案：直接销毁
            }
        }
    }

    /** 添加技能
     * @param skill 技能
     */
    addSkill(skill: PedalSkill[]) {
        for (const s of skill) {
            if (this.skills.indexOf(s) === -1) {
                this.skills.push(s);
            }
        }
    }

    /**
     * 添加技能节点
     */
    addSkillNode(skill: PedalSkill, node: Node) {
        if (!node) return;
        
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
        if (!this.skills || this.skills.length === 0) return;

        for (const skill of this.skills) {
            
            switch (skill) {
                case PedalSkill.SPRING:
                    // 弹簧跳跃高度
                    console.log("Triggered SPRING skill");
                    this.applySpringEffect();
                    break;
                case PedalSkill.LOW_GRAVITY:
                    // 降低重力
                    console.log("Triggered LOW_GRAVITY skill");
                    // 恢复原始重力
                    this._gravity = this._originalGravity;
                    break;
                case PedalSkill.FRACTURE:
                    // 断裂效果
                    console.log("Triggered FRACTURE skill");
                    // 延迟一秒后释放技能（发送释放对象消息）
                    this.scheduleOnce(this.releaseObject, 1.0);
                    break;
                case PedalSkill.GOLD:
                    // 金币效果
                    console.log("Triggered GOLD skill");
                    this.getGoldSkill();
                    break; // 添加 break
                case PedalSkill.SPIKE:
                    // 尖刺效果
                    console.log("Triggered SPIKE skill");
                    this.applySpikeEffect();
                    break;
                case PedalSkill.SHIELD:
                    // 护盾效果
                    console.log("Triggered SHIELD skill");
                    this.applyShieldEffect();
                    break;
                case PedalSkill.GOLD_RAIN:
                    console.log("Triggered GOLD_RAIN skill");
                    // TODO: 实现金币雨逻辑
                    break;
                case PedalSkill.FLYING_SNAKE:
                    console.log("Triggered FLYING_SNAKE skill");
                    // TODO: 实现移动飞蛇逻辑
                    break;
                case PedalSkill.METEOR:
                    console.log("Triggered METEOR skill");
                    // TODO: 实现陨石逻辑
                    break;
                case PedalSkill.ROCKET:
                    console.log("Triggered ROCKET skill");
                    this.applyRocketEffect();
                    break;
                case PedalSkill.NONE:
                default:
                    break;
            }
        }
        
        // 释放后清空技能（一次性效果）
      //  this.skills = [];
    }
    
    // 获得护盾
    applyShieldEffect() {
        EventManager.emit(EventName.Game.GetShield);
    }
    
    // 获得火箭
    private applyRocketEffect() {
        // 火箭：冲刺10层
        EventManager.emit(EventName.Game.GetRocket, 10);
    }

    //尖刺 效果 玩家死亡游戏结束
    applySpikeEffect() {
        // 玩家死亡
        // EventManager.emit(EventName.Game.GameOver);
        // 改为发送 HitSpike 消息，由 Game 判断是否有护盾
        EventManager.emit(EventName.Game.HitSpike);
    }

    //获得金币技能
    private getGoldSkill() {
        // 发送获得金币事件，由 Game 处理动画和加金币
        EventManager.emit(EventName.Game.GetGold, this.node);
    }

    // 弹簧跳跃一次
    private applySpringEffect() {
        // 增加跳跃力度
        this.jumpForce *= 6.5;
        // 增加跳跃速度
        this.jumpSpeed *= 0.8;
    }

    private releaseObject() {
        if (!this.node || !this.node.isValid) return;
        EventManager.emit(EventName.Game.ReleaseObject, this.node);
    }

    protected onDisable(): void {
        this.unschedule(this.releaseObject);
    }
}
