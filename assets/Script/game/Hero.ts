import { _decorator, Node, Component, Vec3, v3, sp, UITransform, tween, Tween, resources } from 'cc';
import { App } from '../Controller/app';
import StateMachine, { IState } from '../Common/StateMachine';
import CM from '../channel/CM';
import { JoystickControl } from './JoystickControl';
import { Pedal } from './Pedal/Pedal';
import { PedalSkill } from '../Tools/enumConst';
import EventManager from '../Common/view/EventManager';
import { EventName } from '../Tools/eventName';
import { SkinManager } from './Skin/SkinManager';
import { getSkinConfig } from './Skin/SkinConfig';
const { ccclass, property } = _decorator;

/**
 * Hero状态枚举
 */
export enum HeroState {
    JUMP_UP = 'jump_up',
    JUMP_DOWN = 'jump_down',
    ATTACK = 'attack'
}

/**
 * Hero数据接口
 */
interface HeroData {
    hero: Hero;
    attackDuration: number;
    /** 是否踩中踏板上 */
    isTouchingPedal: boolean;
}

/**
 * 跳跃向上状态
 */
class JumpUpState implements IState {
    readonly name: string = HeroState.JUMP_UP;
    private _data: HeroData;
    
    constructor(data: HeroData) {
        this._data = data;
    }
    
    onEnter(fromState: IState | null, params?: any) {
        console.log('Hero进入跳跃向上状态');
        // 在 JumpUpState 中不再直接触发跳跃，跳跃由 Game.ts 的碰撞检测触发
        // 播放跳跃向上动画
        this._data.hero.playAnimation('jump_up');
    }
    
    onUpdate(dt: number) {
        const inputVector = this._data.hero.getInputVector();
        if (inputVector.length() > 0.1) {
            this._data.hero.moveCharacter(inputVector, dt);
        }

        // 当 Tween 结束（上升完成），切换到下落状态
        const hero = this._data.hero as Hero;
        if (!hero.isTweenJumping()) {
            this._data.hero.changeState(HeroState.JUMP_DOWN);
        }
    }
    
    onExit(toState: IState | null) {
        console.log('Hero离开跳跃向上状态');
    }
    
    onEvent(eventName: string, data?: any): boolean {
        switch (eventName) {
            case 'attack':
                this._data.hero.changeState(HeroState.ATTACK);
                return true;
        }
        return false;
    }
}

/**
 * 跳跃向下状态
 */
class JumpDownState implements IState {
    readonly name: string = HeroState.JUMP_DOWN;
    private _data: HeroData;
    
    constructor(data: HeroData) {
        this._data = data;
    }
    
    onEnter(fromState: IState | null, params?: any) {
        console.log('Hero进入跳跃向下状态');
        // 播放跳跃向下动画
        this._data.hero.playAnimation('jump_down');
    }
    
    onUpdate(dt: number) {
        const inputVector = this._data.hero.getInputVector();
        if (inputVector.length() > 0.1) {
            this._data.hero.moveCharacter(inputVector, dt);
        }

        // 当角色落地后，切换回跳跃向上状态，实现循环跳跃
        if (this._data.isTouchingPedal) {
            this._data.hero.changeState(HeroState.JUMP_UP);
        }
    }
    
    onExit(toState: IState | null) {
        console.log('Hero离开跳跃向下状态');
    }
    
    onEvent(eventName: string, data?: any): boolean {
        switch (eventName) {
            case 'attack':
                this._data.hero.changeState(HeroState.ATTACK);
                return true;
        }
        return false;
    }
}

/**
 * 攻击状态
 */
class AttackState implements IState {
    readonly name: string = HeroState.ATTACK;
    private _data: HeroData;
    private _attackTimer: number = 0;
    
    constructor(data: HeroData) {
        this._data = data;
    }
    
    onEnter(fromState: IState | null, params?: any) {
        console.log('Hero进入攻击状态');
        this._attackTimer = 0;
        this._data.hero.performAttack();
        // 播放攻击动画
        this._data.hero.playAnimation('attack');
    }
    
    onUpdate(dt: number) {
        this._attackTimer += dt;
        
        if (this._attackTimer >= this._data.attackDuration) {
            // 攻击结束后切换到JUMP_UP状态
            this._data.hero.changeState(HeroState.JUMP_UP);
        }
    }
    
    onExit(toState: IState | null) {
        console.log('Hero离开攻击状态');
    }
    
    onEvent(eventName: string, data?: any): boolean {
        return false;
    }
}

/**
 * Hero类
 * 游戏主角控制器，使用状态机管理角色行为
 */
@ccclass('Hero')
export class Hero extends Component {

    /** 骨骼动画组件 */
    @property(sp.Skeleton)
    private SkeletonAnimation: sp.Skeleton = null;
    
    /** 攻击持续时间 */
    public attackDuration: number = 0.5;
    
    /** 状态机实例 */
    private _stateMachine: StateMachine = new StateMachine();
    
    /** Hero数据 */
    private _heroData: HeroData = null;

    /** UITransform 组件 */
    private _uiTransform: UITransform = null;


    ////////////////////////////////////////////////////////////////移动
    /** 输入方向向量 */
    private _inputVector: Vec3 = v3();
    /** 移动速度 */
    public moveSpeed: number = 800;

    /** 是否开启触摸摇杆控制 (仅用于调试) */
    @property
    public useJoystick: boolean = false;

    /** 摇杆控制器引用 (仅用于调试) */
    @property(JoystickControl)
    public joystick: JoystickControl = null;

    /** 陀螺仪当前角速度 X (其实是绕 Y 轴旋转) */
    private _gyroX: number = 0;
    /** 陀螺仪累积倾斜量 */
    private _gyroAngle: number = 0;
    /** 平滑后的输入 X */
    private _smoothGyroX: number = 0;
    /** Tween 跳跃时的当前 Y 坐标 */
    private _tweenJumpY: number = 0;
    //////////////////////////////////////////////////////////////////////

    /////////////////////////////////////////////////////////////////跳跃相关
    /** 是否踩中踏板上 */
    private _isTouchingPedal: boolean = false;

    /** 当前跳跃速度 (Y 轴) */
    private _jumpVelocity: number = 0;

    /** 当前生效的重力 */
    private _currentGravity: number = 0;

    /** 是否正在执行 Tween 向上跳跃 */
    private _isTweenJumping: boolean = false;
    /** 当前正在运行的跳跃 Tween */
    private _currentJumpTween: Tween<Node> | null = null;

    /** 复用的位置向量 */
    private _tempPosition: Vec3 = v3();
    private _pendingJumpBoost: number = 0;
    
    protected onLoad(): void {
        this.Refresh();
        this.initStateMachine();
        this._uiTransform = this.getComponent(UITransform);
        
        // 如果没有开启调试用的摇杆控制，则启动陀螺仪
        if (!this.useJoystick) {
            this.initGyroscope();
        }
    }

    protected start(): void {
        this.refreshSkin();
        // 游戏开始时，为首次跳跃创建一个“虚拟”踏板
        const initialPedal = new Pedal();
        initialPedal.jumpForce = 600;
        initialPedal.jumpSpeed = 1.45;
        initialPedal._gravity = -2000;
        
        this.setGrounded(true, initialPedal);
        this.performJump(initialPedal);
        // 初始化状态机后已经默认设置了 JUMP_UP 状态，这里不需要再次切换
        // 如果需要强制刷新，可以考虑使用 reset
    }

    //刷新数据
    Refresh() {
        this._heroData = {
            hero: this,
            attackDuration: this.attackDuration,
            /** 是否踩中踏板上 */
            isTouchingPedal: this._isTouchingPedal
        };
    }

    /**
     * 重置 Hero 状态
     */
    public reset(): void {
        // 重置位置
        this.node.setPosition(0, 0, 0);
        
        // 重置物理状态
        this._jumpVelocity = 0;
        this._currentGravity = -2000; // 恢复默认重力
        this._isTweenJumping = false;
        this._isTouchingPedal = false;
        
        // 停止当前 Tween
        if (this._currentJumpTween) {
            this._currentJumpTween.stop();
            this._currentJumpTween = null;
        }

        // 重置陀螺仪/输入状态
        this._gyroX = 0;
        this._gyroAngle = 0;
        this._smoothGyroX = 0;
        this._inputVector.set(0, 0);
        
        // 切换到初始状态 (通常是下落或者待机，这里假设先下落或者直接跳起)
        // 如果当前已经在 JUMP_DOWN 状态，changeState 会返回 false，但这符合预期
        this._stateMachine.changeState(HeroState.JUMP_UP);
        this.playAnimation('jump_down');
    }
    
    /**
     * 初始化陀螺仪
     */
    private initGyroscope(): void {
        // 启动陀螺仪
        CM.startGyroscope();
        // 监听陀螺仪数据变化
        CM.onGyroscopeChange((res) => {
            // 记录原始 Y 轴角速度 (对应手机左右倾斜)
            this._gyroX = res.y; 
        });
    }

    update(deltaTime: number) {
        if (App.gameCtr.isPause) return;
        // 根据开关选择输入源
        if (this.useJoystick && this.joystick) {
            this.updateJoystickMove(deltaTime);
        } else {
            this.updateGyroMove(deltaTime);
        }

        // 1. 先更新状态机（确保起跳帧就能将 _isTouchingPedal 置为 false）
        this._stateMachine.update(deltaTime);
        
        // 2. 处理跳跃位移
        if (this._isTweenJumping) {
            // 如果正在 Tween 上升，应用 Tween 计算出的 Y 坐标
            const pos = this.node.position;
            this.node.setPosition(pos.x, this._tweenJumpY, pos.z);
        } else {
            // 否则处理物理下落逻辑
            this.Dojump(deltaTime);
        }
    }
    
    private updateJoystickMove(dt: number): void {
        const inputVector = this.joystick.getInputVector();
        
        // 同样应用平滑，保持手感一致
        const targetX = inputVector.x * 2.0; // 这里的系数可以根据调试手感调整
        this._smoothGyroX += (targetX - this._smoothGyroX) * 0.15;
        
        // 更新输入向量
        this._inputVector.x = this._smoothGyroX;
    }

    /**
     * 更新陀螺仪平滑位移
     */
    private updateGyroMove(dt: number): void {
        // 1. 累积角速度 (y 轴通常对应手机左右倾斜)
        this._gyroAngle += this._gyroX * dt;

        // 2. 限制最大倾斜感知的输入量 (约 30 度)
        const maxAngle = 0.5;
        if (this._gyroAngle > maxAngle) this._gyroAngle = maxAngle;
        if (this._gyroAngle < -maxAngle) this._gyroAngle = -maxAngle;

        // 3. 阻尼回归中心 (如果不晃动，角度会慢慢回到 0)
        this._gyroAngle *= 0.95;

        // 4. 平滑插值计算目标 X 输入，实现“丝滑”感
        const targetX = this._gyroAngle * 2.5; 
        this._smoothGyroX += (targetX - this._smoothGyroX) * 0.2;

        // 5. 更新输入向量
        this._inputVector.x = this._smoothGyroX;
    }
    
    // 处理跳跃逻辑
    Dojump(deltaTime: number) {
        // 如果踩中踏板或者正在执行向上跳跃的 Tween，则不执行物理下落逻辑
        if (this._isTouchingPedal || this._isTweenJumping) return;

        // 下落阶段采用物理计算，增加下落速度
        const dt = Math.min(deltaTime, 0.033); 
        
        // 增加下落速度限制 (Terminal Velocity)
        // 假设 Hero 高度约 50-100，每帧最大位移不应超过这个值
        // -2000 的重力下，速度可能达到 -1000 以上
        // 限制最大下落速度为 -1500 (约 45px/帧 @ 30fps)，防止穿透
        const MAX_FALL_SPEED = -1500;
        
        this._jumpVelocity += this._currentGravity * dt; // 使用当前踏板的重力
        
        if (this._jumpVelocity < MAX_FALL_SPEED) {
            this._jumpVelocity = MAX_FALL_SPEED;
        }

        // 应用位移 (本地坐标)
        const pos = this.node.position;
        // 计算这一帧的位移
        const deltaY = this._jumpVelocity * dt;
        
        this._tempPosition.set(pos.x, pos.y + deltaY, pos.z);
        this.node.setPosition(this._tempPosition);
    }

    /**
     * 根据给定的踏板属性，开始一个基于 Tween 的向上跳跃
     * @param pedal 触发跳跃的踏板
     */
    public performJump(pedal: Pedal): void {
        // 停止之前的 Tween (如果有)
        if (this._currentJumpTween) {
            this._currentJumpTween.stop();
        }

        this._isTouchingPedal = false;
        this._heroData.isTouchingPedal = false;
        this._isTweenJumping = true;
        this._jumpVelocity = 0; // 重置速度，让 Tween 接管

        let jumpHeight = pedal.jumpForce + this._pendingJumpBoost;
        let duration = pedal.jumpSpeed;
        this._pendingJumpBoost = 0;
        this._tweenJumpY = this.node.position.y;

        
        this.JumpAnimation(duration, jumpHeight);

    }

    /**
     * 跳跃动画
     * @param duration 跳跃持续时间
     * @param jumpHeight 跳跃高度
     */
    JumpAnimation(duration: number, jumpHeight: number) {
        this._currentJumpTween = tween(this as any)
            .to(duration, { _tweenJumpY: this._tweenJumpY + jumpHeight }, {
                easing: 'quadOut',
                onComplete: () => {
                    this._isTweenJumping = false;
                    this._jumpVelocity = 0; // 准备自由落体
                    this._currentJumpTween = null;
                }
            })
            .start();
    }
    
    /**
     * 判断是否正在执行向上跳跃的 Tween
     */
    public isTweenJumping(): boolean {
        return this._isTweenJumping;
    }

    /**
     * 初始化状态机
     */
    private initStateMachine(): void {
        this._stateMachine.debugMode = true;
        this._stateMachine.onStateChange = this.onStateChange.bind(this);

        const jumpUpState = new JumpUpState(this._heroData);
        const jumpDownState = new JumpDownState(this._heroData);
        const attackState = new AttackState(this._heroData);

        this._stateMachine.addStates([jumpUpState, jumpDownState, attackState]);
        this._stateMachine.changeState(HeroState.JUMP_UP);
    }
    
    /**
     * 状态变化回调
     */
    private onStateChange(fromState: IState | null, toState: IState | null, params?: any): void {
        console.log(`Hero state changed: ${fromState?.name || 'None'} -> ${toState?.name || 'None'}`, params);
    }
    
    /**
     * 切换状态
     */
    public changeState(stateName: string, params?: any): boolean {
        return this._stateMachine.changeState(stateName, params);
    }
    
    /**
     * 发送事件给状态机
     */
    public sendEvent(eventName: string, data?: any): boolean {
        return this._stateMachine.sendEvent(eventName, data);
    }
    
    /**
     * 移动角色
     */
    public moveCharacter(direction: Vec3, speed: number): void {
        this._tempPosition.set(this.node.position);
        this._tempPosition.x += direction.x * this.moveSpeed * speed;
        
        // 限制在屏幕内 (720 宽，中心为 0，即 -360 到 360)
        const halfWidth = 360; 
        if (this._tempPosition.x > halfWidth) this._tempPosition.x = halfWidth;
        if (this._tempPosition.x < -halfWidth) this._tempPosition.x = -halfWidth;

        this.node.setPosition(this._tempPosition);
        
        // 调整角色朝向
        if (direction.x !== 0) {
            // 水平方向移动时，根据x方向调整朝向
            this.node.setScale(direction.x > 0 ? 1 : -1, 1, 1);
        }
    }
    
    /**
     * 执行攻击
     */
    public performAttack(): void {
        console.log('Hero执行攻击');
    }
    
    /**
     * 获取输入方向向量
     */
    public getInputVector(): Vec3 {
        return this._inputVector;
    }
    
    /**
     * 设置输入方向向量
     */
    public setInputVector(vector: Vec3): void {
        this._inputVector.set(vector);
    }
    
    /**
     * 获取当前状态
     */
    public getCurrentState(): string {
        return this._stateMachine.currentStateName;
    }
    
    /**
     * 触发攻击
     */
    public attack(): void {
        this.sendEvent('attack');
    }
    
    /**
     * 触发跳跃
     */
    public jump(): void {
        this.sendEvent('jump');
    }
    
    /**
     * 获取是否踩中踏板
     */
    public getIsTouchingPedal(): boolean {
        return this._isTouchingPedal;
    }
    
    /**
     * 设置是否踩中踏板，并根据接触的踏板更新物理属性
     * @param isTouchingPedal 是否踩中踏板
     * @param pedal 接触的踏板 (可选)
     */
    public setGrounded(isTouchingPedal: boolean, pedal: Pedal | null = null): void {
        this._isTouchingPedal = isTouchingPedal;
        this._heroData.isTouchingPedal = isTouchingPedal;

        if (isTouchingPedal) {
            this._jumpVelocity = 0;
            if (pedal) {
                // 踩上踏板，使用踏板的重力
                this._currentGravity = pedal._gravity;
                console.log(`Landed on pedal with Gravity: ${pedal._gravity}`);
            }
        }
    }

    /**
     * 判断Hero是否处于下落状态
     */
    public isFalling(): boolean {
        // 只有不在 Tween 上升且物理速度为负时才是下落阶段
        return !this._isTweenJumping && this._jumpVelocity < 0 && !this._isTouchingPedal;
    }

    getUiTransform(): UITransform {
        return this._uiTransform;
    }
    /**
     * 处理Hero踩中踏板的逻辑
     * @param pedalNode 踩中的踏板节点
     */
    public landOnPedal(pedalNode: Node): void {
        // 停止可能存在的上升 Tween
        if (this._currentJumpTween) {
            this._currentJumpTween.stop();
            this._currentJumpTween = null;
        }
        this._isTweenJumping = false;

        this._isTouchingPedal = true;
        this._heroData.isTouchingPedal = true;
        this._jumpVelocity = 0;

        // 获取组件
        const pedalUITransform = pedalNode.getComponent(UITransform);
        const heroUITransform = this.getUiTransform();

        if (pedalUITransform && heroUITransform) {
            // 计算踏板顶部在世界坐标系下的Y值 (考虑锚点)
            const pedalWorldPos = pedalNode.worldPosition;
            const pedalTopWorldY = pedalWorldPos.y + (1 - pedalUITransform.anchorY) * pedalUITransform.height;
            
            // 计算Hero底部到中心的距离 (基于锚点)
            const heroBottomToCenterY = heroUITransform.anchorY * heroUITransform.height;
            
            // 强制对齐：Hero底部 = 踏板顶部
            const newHeroWorldY = pedalTopWorldY + heroBottomToCenterY;
            
            // 使用辅助变量更新位置
            this._tempPosition.set(this.node.worldPosition);
            this._tempPosition.y = newHeroWorldY;
            this.node.setWorldPosition(this._tempPosition);
        }
        
        // 切换到跳跃向上状态，开始新的跳跃循环
        this.changeState(HeroState.JUMP_UP);
    }
    
    /**
     * 播放动画
     * @param animationName 动画名称
     */
    public playAnimation(animationName: string): void {
        if (this.SkeletonAnimation) {
            this.SkeletonAnimation.setAnimation(0, animationName, false);
        }
    }

    /**
     * 更换皮肤
     * @param skinId 皮肤ID
     */
    public changeSkin(skinId: number): void {
        const skinConfig = getSkinConfig(skinId);
        if (!skinConfig) {
            console.warn(`Skin config not found for ID: ${skinId}`);
            return;
        }

        console.log(`Request to change skin: ${skinConfig.name}`);

        if (this.SkeletonAnimation) {
            console.log(`Setting skin directly to: ${skinConfig.spineSkinName}`);
            this.setSkeletonSkin(skinConfig.spineSkinName);
        } else {
            console.warn("SkeletonAnimation component is null!");
        }
    }

    /**
     * 设置骨骼皮肤并刷新状态
     * @param skinName 皮肤名称
     */
    private setSkeletonSkin(skinName: string) {
        if (!this.SkeletonAnimation) return;

        // 如果 skinName 有效且不是默认值，尝试切换
        if (skinName && skinName !== 'default') {
            // 注意：setSkin 内部会查找皮肤是否存在，如果不存在通常会报错或无效果
            // 建议确保配置表中的 skinName 与 Spine 资源一致
            try {
                this.SkeletonAnimation.setSkin(skinName);
                // 必须调用 setToSetupPose 来应用新皮肤的附件，并清除旧皮肤的影响
                this.SkeletonAnimation.setSlotsToSetupPose();
            } catch (e) {
                console.warn(`Failed to set skin: ${skinName}`, e);
            }
        }

        // 重新播放当前动画以刷新状态
        // 切换 skeletonData 或 setSkin 后，动画状态可能会重置，需要重新触发
        const currentState = this._stateMachine.currentStateName || 'jump_down';
        // 使用 setAnimation 强制刷新
        this.SkeletonAnimation.setAnimation(0, currentState, false);
    }

    refreshSkin() {
        // 加载并应用当前皮肤
        const skinId = SkinManager.getInstance().getCurrentSkinId();
        const skinConfig = getSkinConfig(skinId);
        if (skinConfig) {
            this.setSkeletonSkin(skinConfig.spineSkinName);
        }
    }

}


