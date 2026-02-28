import { _decorator, Component, Vec3, v3,  sp } from 'cc';
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
        // 触发跳跃
        const jumpVelocity = v3(0, this._data.jumpForce, 0);
        this._data.hero.applyJumpForce(jumpVelocity);
        // 播放跳跃向上动画
        // this._data.hero.playAnimation('jump_up');
    }
    
    onUpdate(dt: number) {
        const inputVector = this._data.hero.getInputVector();
        if (inputVector.length() > 0.1) {
            // 计算速度因子，基于输入向量的长度
            const speedFactor = inputVector.length();
            this._data.hero.moveCharacter(inputVector, speedFactor * dt);
        }

        // 当角色开始下落时，切换到跳跃向下状态
        const hero = this._data.hero as Hero;
        if (hero.getJumpVelocity() < 0) {
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
        // this._data.hero.playAnimation('jump_down');
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
    public jumpForce: number = 1000;

    /** 重力加速度 */
    private _gravity: number = 980;
    ////////////////////////////////////////////////////////////////////////

    /** 复用的位置向量 */
    private _tempPosition: Vec3 = v3();
    
    start() {
        this.Refresh();
        this.initStateMachine();
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
        this._stateMachine.update(deltaTime);
        
        this.Dojump(deltaTime);
    }
    
    // 处理跳跃逻辑
    Dojump(deltaTime) {

        if (!this._isGrounded) {
            this._jumpVelocity -= this._gravity * deltaTime;

            this._tempPosition.set(this.node.position);
            this._tempPosition.y += this._jumpVelocity * deltaTime;

            // 简单地面检测（假设地面高度为0）
            if (this._tempPosition.y <= 0) {
                this._tempPosition.y = 0;
                this._jumpVelocity = 0;
                this._isGrounded = true;
                this._heroData.isGrounded = true;
            }

            this.node.setPosition(this._tempPosition);
        }
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
     * 播放动画
     * @param animationName 动画名称
     */
    public playAnimation(animationName: string): void {
        if (this.SkeletonAnimation) {
            this.SkeletonAnimation.setAnimation(0, animationName, false);
        }
    }
}


