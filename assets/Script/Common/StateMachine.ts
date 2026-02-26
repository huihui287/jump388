import { _decorator } from 'cc';
const { ccclass } = _decorator;

/**
 * 状态接口，所有状态必须实现此接口
 */
export interface IState {
    /** 状态名称 */
    readonly name: string;
    
    /**
     * 进入状态时调用
     * @param fromState 上一个状态
     * @param params 传递的参数
     */
    onEnter?(fromState: IState | null, params?: any): void;
    
    /**
     * 退出状态时调用
     * @param toState 下一个状态
     */
    onExit?(toState: IState | null): void;
    
    /**
     * 更新状态时调用
     * @param dt 时间间隔
     */
    onUpdate?(dt: number): void;
    
    /**
     * 处理事件
     * @param eventName 事件名称
     * @param data 事件数据
     * @returns 是否处理了事件
     */
    onEvent?(eventName: string, data?: any): boolean;
}

/**
 * 状态变化回调函数类型
 */
export type StateChangeCallback = (fromState: IState | null, toState: IState | null, params?: any) => void;

/**
 * 状态机类
 * 用于管理游戏状态的切换和更新
 */
@ccclass
export default class StateMachine {
    /** 存储所有注册的状态 */
    private _states: Map<string, IState> = new Map();
    
    /** 当前状态 */
    private _currentState: IState | null = null;
    
    /** 上一个状态 */
    private _previousState: IState | null = null;
    
    /** 是否启用调试模式 */
    private _debugMode: boolean = false;
    
    /** 状态变化回调 */
    private _onStateChange: StateChangeCallback | null = null;
    
    /**
     * 设置调试模式
     * @param enabled 是否启用调试
     */
    set debugMode(enabled: boolean) {
        this._debugMode = enabled;
        if (enabled) {
            console.log('StateMachine: Debug mode enabled');
        }
    }
    
    get debugMode(): boolean {
        return this._debugMode;
    }
    
    /**
     * 设置状态变化回调
     * @param callback 回调函数
     */
    set onStateChange(callback: StateChangeCallback | null) {
        this._onStateChange = callback;
    }
    
    get onStateChange(): StateChangeCallback | null {
        return this._onStateChange;
    }
    
    /**
     * 获取当前状态
     */
    get currentState(): IState | null {
        return this._currentState;
    }
    
    /**
     * 获取上一个状态
     */
    get previousState(): IState | null {
        return this._previousState;
    }
    
    /**
     * 获取当前状态名称
     */
    get currentStateName(): string {
        return this._currentState ? this._currentState.name : 'None';
    }
    
    /**
     * 获取上一个状态名称
     */
    get previousStateName(): string {
        return this._previousState ? this._previousState.name : 'None';
    }
    
    /**
     * 添加状态
     * @param state 要添加的状态
     */
    addState(state: IState): void {
        if (!state || !state.name) {
            console.error('StateMachine: Invalid state');
            return;
        }
        
        if (this._states.has(state.name)) {
            if (this._debugMode) {
                console.warn(`StateMachine: State '${state.name}' already exists`);
            }
            return;
        }
        
        this._states.set(state.name, state);
        
        if (this._debugMode) {
            console.log(`StateMachine: Added state '${state.name}'`);
        }
    }
    
    /**
     * 添加多个状态
     * @param states 要添加的状态数组
     */
    addStates(states: IState[]): void {
        states.forEach(state => this.addState(state));
    }
    
    /**
     * 移除状态
     * @param name 状态名称
     */
    removeState(name: string): boolean {
        if (!this._states.has(name)) {
            if (this._debugMode) {
                console.warn(`StateMachine: State '${name}' not found`);
            }
            return false;
        }
        
        // 如果要移除的是当前状态，先切换到null
        if (this._currentState && this._currentState.name === name) {
            this.changeState(null);
        }
        
        this._states.delete(name);
        
        if (this._debugMode) {
            console.log(`StateMachine: Removed state '${name}'`);
        }
        
        return true;
    }
    
    /**
     * 移除所有状态
     */
    clearStates(): void {
        this.changeState(null);
        this._states.clear();
        
        if (this._debugMode) {
            console.log('StateMachine: Cleared all states');
        }
    }
    
    /**
     * 获取状态
     * @param name 状态名称
     */
    getState(name: string): IState | null {
        return this._states.get(name) || null;
    }
    
    /**
     * 检查是否存在状态
     * @param name 状态名称
     */
    hasState(name: string): boolean {
        return this._states.has(name);
    }
    
    /**
     * 切换状态
     * @param name 要切换到的状态名称，如果为null则切换到无状态
     * @param params 传递给新状态的参数
     */
    changeState(name: string | null, params?: any): boolean {
        // 如果名称相同，不切换
        if (name === this.currentStateName) {
            if (this._debugMode) {
                console.warn(`StateMachine: Already in state '${name}'`);
            }
            return false;
        }
        
        // 获取新状态
        const newState = name ? this._states.get(name) : null;
        if (name && !newState) {
            if (this._debugMode) {
                console.error(`StateMachine: State '${name}' not found`);
            }
            return false;
        }
        
        // 退出当前状态
        if (this._currentState && this._currentState.onExit) {
            this._currentState.onExit(newState);
        }
        
        // 保存上一个状态
        const previousState = this._currentState;
        
        // 设置新状态
        this._previousState = previousState;
        this._currentState = newState;
        
        // 进入新状态
        if (this._currentState && this._currentState.onEnter) {
            this._currentState.onEnter(previousState, params);
        }
        
        // 调用状态变化回调
        if (this._onStateChange) {
            this._onStateChange(previousState, this._currentState, params);
        }
        
        if (this._debugMode) {
            const fromName = previousState ? previousState.name : 'None';
            const toName = newState ? newState.name : 'None';
            console.log(`StateMachine: Changed state from '${fromName}' to '${toName}'`, params);
        }
        
        return true;
    }
    
    /**
     * 切换到上一个状态
     * @param params 传递给上一个状态的参数
     */
    revertToPreviousState(params?: any): boolean {
        if (!this._previousState) {
            if (this._debugMode) {
                console.warn('StateMachine: No previous state to revert to');
            }
            return false;
        }
        
        return this.changeState(this._previousState.name, params);
    }
    
    /**
     * 更新当前状态
     * @param dt 时间间隔
     */
    update(dt: number): void {
        if (this._currentState && this._currentState.onUpdate) {
            this._currentState.onUpdate(dt);
        }
    }
    
    /**
     * 发送事件给当前状态
     * @param eventName 事件名称
     * @param data 事件数据
     * @returns 当前状态是否处理了事件
     */
    sendEvent(eventName: string, data?: any): boolean {
        if (!this._currentState || !this._currentState.onEvent) {
            return false;
        }
        
        return this._currentState.onEvent(eventName, data);
    }
    
    /**
     * 获取所有状态名称
     */
    getAllStateNames(): string[] {
        return Array.from(this._states.keys());
    }
    
    /**
     * 获取状态数量
     */
    getStateCount(): number {
        return this._states.size;
    }
    
    /**
     * 打印状态机信息（调试用）
     */
    debugLog(): void {
        console.log('=== StateMachine Debug Info ===');
        console.log(`Total states: ${this._states.size}`);
        console.log(`Current state: ${this.currentStateName}`);
        console.log(`Previous state: ${this.previousStateName}`);
        console.log('All states:');
        
        for (const [name, state] of this._states.entries()) {
            const isCurrent = this._currentState === state;
            const status = isCurrent ? ' [CURRENT]' : '';
            console.log(`  - ${name}${status}`);
        }
        
        console.log('============================');
    }
}
