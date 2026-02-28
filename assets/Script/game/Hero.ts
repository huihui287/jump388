import { _decorator, Node, Component, Vec3, v3, sp, UITransform, tween, Tween } from 'cc';
import StateMachine, { IState } from '../Common/StateMachine';
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
    moveSpeed: number;
    jumpForce: number;
    attackDuration: number;
    isGrounded: boolean;
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
        // 使用全新的 Tween 系统触发上升位移，不再直接给物理初速度
        this._data.hero.startJumpTween();
        // 播放跳跃向上动画
        this._data.hero.playAnimation('jump_up');
    }
    
    onUpdate(dt: number) {
        const inputVector = this._data.hero.getInputVector();
        if (inputVector.length() > 0.1) {
            // 计算速度因子，基于输入向量的长度
            const speedFactor = inputVector.length();
            this._data.hero.moveCharacter(inputVector, speedFactor * dt);
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
            // 计算速度因子，基于输入向量的长度
            const speedFactor = inputVector.length();
            this._data.hero.moveCharacter(inputVector, speedFactor * dt);
        }

        // 当角色落地后，切换回跳跃向上状态，实现循环跳跃
        if (this._data.isGrounded) {
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
    public moveSpeed: number = 600;
   //////////////////////////////////////////////////////////////////////

    /////////////////////////////////////////////////////////////////跳跃相关
    /** 是否在地面 */
    private _isGrounded: boolean = true;

    /** 跳跃速度 */
    private _jumpVelocity: number = 0;

    /** 跳跃力度 */
    public jumpForce: number = 600;

    /** 重力加速度 */
    private _gravity: number = 1800; // 提高重力，让下落更有力
    ////////////////////////////////////////////////////////////////////////

    /** 是否正在执行 Tween 向上跳跃 */
    private _isTweenJumping: boolean = false;
    /** 当前正在运行的跳跃 Tween */
    private _currentJumpTween: Tween<Node> | null = null;

    /** 复用的位置向量 */
    private _tempPosition: Vec3 = v3();
    
    protected onLoad(): void {
        this.Refresh();
        this.initStateMachine();
        this._uiTransform = this.getComponent(UITransform);
    }
    
    start() {

    }

    //刷新数据
    Refresh() {
        this._heroData = {
            hero: this,
            moveSpeed: this.moveSpeed,
            jumpForce: this.jumpForce,
            attackDuration: this.attackDuration,
            isGrounded: this._isGrounded
        };
    }

    update(deltaTime: number) {
        // 1. 先更新状态机（确保起跳帧就能将 _isGrounded 置为 false）
        this._stateMachine.update(deltaTime);
        
        // 2. 处理物理位移
        this.Dojump(deltaTime);
    }
    
    // 处理跳跃逻辑
    Dojump(deltaTime: number) {
        // 如果在地面或者正在执行向上跳跃的 Tween，则不执行物理下落逻辑
        if (this._isGrounded || this._isTweenJumping) return;

        // 下落阶段采用物理计算，增加下落速度
        const dt = Math.min(deltaTime, 0.033); 
        this._jumpVelocity -= this._gravity * dt;

        // 应用位移 (本地坐标)
        const pos = this.node.position;
        this._tempPosition.set(pos.x, pos.y + this._jumpVelocity * dt, pos.z);
        this.node.setPosition(this._tempPosition);
    }

    /**
     * 开始一个基于 Tween 的向上跳跃 (仅 Y 轴动画)
     */
    public startJumpTween(): void {
        // 停止之前的 Tween (如果有)
        if (this._currentJumpTween) {
            this._currentJumpTween.stop();
        }

        this._isGrounded = false;
        this._heroData.isGrounded = false;
        this._isTweenJumping = true;
        this._jumpVelocity = 0; // 重置速度，让 Tween 接管

        const jumpHeight = this.jumpForce; // 使用已有的 jumpForce 作为高度
        const duration = 1.45; // 快速上升时间

        this._currentJumpTween = tween(this.node)
            .by(duration, { position: v3(0, jumpHeight, 0) }, { 
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
        // 输入向量已经包含速度信息，直接使用
        this._tempPosition.x += direction.x * this.moveSpeed * speed;
        this._tempPosition.z += direction.z * this.moveSpeed * speed;
        this.node.setPosition(this._tempPosition);
        
        // 调整角色朝向
        if (direction.x !== 0) {
            // 水平方向移动时，根据x方向调整朝向
            this.node.setScale(direction.x > 0 ? 1 : -1, 1, 1);
        }
    }
    
    /**
     * 应用跳跃力
     */
    public applyJumpForce(force: Vec3): void {
        this._jumpVelocity = force.y;
        this._isGrounded = false;
        this._heroData.isGrounded = false;
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
     * 获取是否在地面
     */
    public getIsGrounded(): boolean {
        return this._isGrounded;
    }
    
    /**
     * 获取跳跃速度
     */
    public getJumpVelocity(): number {
        return this._jumpVelocity;
    }

    /**
     * 判断Hero是否处于下落状态
     */
    public isFalling(): boolean {
        // 只有不在 Tween 上升且物理速度为负时才是下落阶段
        return !this._isTweenJumping && this._jumpVelocity < 0 && !this._isGrounded;
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

        this._isGrounded = true;
        this._heroData.isGrounded = true;
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
}


