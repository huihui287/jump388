import { _decorator, Component, Node, Vec3, v3 } from 'cc';
import StateMachine, { IState } from '../Common/StateMachine';
const { ccclass, property } = _decorator;

/**
 * Hero状态枚举
 */
export enum HeroState {
    IDLE = 'idle',
    MOVE = 'move',
    JUMP = 'jump',
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
 * 空闲状态
 */
class IdleState implements IState {
    readonly name: string = HeroState.IDLE;
    private _data: HeroData;
    
    constructor(data: HeroData) {
        this._data = data;
    }
    
    onEnter(fromState: IState | null, params?: any) {
        console.log('Hero进入空闲状态');
    }
    
    onUpdate(dt: number) {
        if (!this._data.isGrounded) {
            this._data.hero.changeState(HeroState.JUMP);
            return;
        }
        
        const inputVector = this._data.hero.getInputVector();
        if (inputVector.length() > 0.1) {
            this._data.hero.changeState(HeroState.MOVE);
        }
    }
    
    onExit(toState: IState | null) {
        console.log('Hero离开空闲状态');
    }
    
    onEvent(eventName: string, data?: any): boolean {
        switch (eventName) {
            case 'attack':
                this._data.hero.changeState(HeroState.ATTACK);
                return true;
            case 'jump':
                if (this._data.isGrounded) {
                    this._data.hero.changeState(HeroState.JUMP);
                    return true;
                }
                break;
        }
        return false;
    }
}

/**
 * 移动状态
 */
class MoveState implements IState {
    readonly name: string = HeroState.MOVE;
    private _data: HeroData;
    
    constructor(data: HeroData) {
        this._data = data;
    }
    
    onEnter(fromState: IState | null, params?: any) {
        console.log('Hero进入移动状态');
    }
    
    onUpdate(dt: number) {
        if (!this._data.isGrounded) {
            this._data.hero.changeState(HeroState.JUMP);
            return;
        }
        
        const inputVector = this._data.hero.getInputVector();
        if (inputVector.length() < 0.1) {
            this._data.hero.changeState(HeroState.IDLE);
            return;
        }
        
        this._data.hero.moveCharacter(inputVector, this._data.moveSpeed * dt);
    }
    
    onExit(toState: IState | null) {
        console.log('Hero离开移动状态');
    }
    
    onEvent(eventName: string, data?: any): boolean {
        switch (eventName) {
            case 'attack':
                this._data.hero.changeState(HeroState.ATTACK);
                return true;
            case 'jump':
                if (this._data.isGrounded) {
                    this._data.hero.changeState(HeroState.JUMP);
                    return true;
                }
                break;
        }
        return false;
    }
}

/**
 * 跳跃状态
 */
class JumpState implements IState {
    readonly name: string = HeroState.JUMP;
    private _data: HeroData;
    private _jumpVelocity: Vec3 = v3();
    
    constructor(data: HeroData) {
        this._data = data;
    }
    
    onEnter(fromState: IState | null, params?: any) {
        console.log('Hero进入跳跃状态');
        this._jumpVelocity.set(0, this._data.jumpForce, 0);
        this._data.hero.applyJumpForce(this._jumpVelocity);
    }
    
    onUpdate(dt: number) {
        const inputVector = this._data.hero.getInputVector();
        if (inputVector.length() > 0.1) {
            this._data.hero.moveCharacter(inputVector, this._data.moveSpeed * dt);
        }
        
        if (this._data.isGrounded) {
            if (inputVector.length() < 0.1) {
                this._data.hero.changeState(HeroState.IDLE);
            } else {
                this._data.hero.changeState(HeroState.MOVE);
            }
        }
    }
    
    onExit(toState: IState | null) {
        console.log('Hero离开跳跃状态');
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
    }
    
    onUpdate(dt: number) {
        this._attackTimer += dt;
        
        if (this._attackTimer >= this._data.attackDuration) {
            if (this._data.isGrounded) {
                const inputVector = this._data.hero.getInputVector();
                if (inputVector.length() < 0.1) {
                    this._data.hero.changeState(HeroState.IDLE);
                } else {
                    this._data.hero.changeState(HeroState.MOVE);
                }
            } else {
                this._data.hero.changeState(HeroState.JUMP);
            }
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
    /** 移动速度 */
    @property
    public moveSpeed: number = 300;
    
    /** 跳跃力度 */
    @property
    public jumpForce: number = 500;
    
    /** 攻击持续时间 */
    @property
    public attackDuration: number = 0.5;
    
    /** 状态机实例 */
    private _stateMachine: StateMachine = new StateMachine();
    
    /** Hero数据 */
    private _heroData: HeroData = null;
    
    /** 输入方向向量 */
    private _inputVector: Vec3 = v3();
    
    /** 是否在地面 */
    private _isGrounded: boolean = true;
    
    /** 跳跃速度 */
    private _jumpVelocity: number = 0;
    
    /** 重力加速度 */
    private _gravity: number = 980;
    
    /** 复用的位置向量 */
    private _tempPosition: Vec3 = v3();
    
    start() {
        this._heroData = {
            hero: this,
            moveSpeed: this.moveSpeed,
            jumpForce: this.jumpForce,
            attackDuration: this.attackDuration,
            isGrounded: this._isGrounded
        };
        
        this.initStateMachine();
    }

    update(deltaTime: number) {
        this._stateMachine.update(deltaTime);
        
        // 处理跳跃逻辑
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
        
        const idleState = new IdleState(this._heroData);
        const moveState = new MoveState(this._heroData);
        const jumpState = new JumpState(this._heroData);
        const attackState = new AttackState(this._heroData);
        
        this._stateMachine.addStates([idleState, moveState, jumpState, attackState]);
        this._stateMachine.changeState(HeroState.IDLE);
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
        this._tempPosition.x += direction.x * speed;
        this._tempPosition.z += direction.z * speed;
        this.node.setPosition(this._tempPosition);
    }
    
    /**
     * 应用跳跃力
     */
    public applyJumpForce(force: Vec3): void {
        if (this._isGrounded) {
            this._jumpVelocity = force.y;
            this._isGrounded = false;
            this._heroData.isGrounded = false;
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
     * 获取是否在地面
     */
    public getIsGrounded(): boolean {
        return this._isGrounded;
    }
}


