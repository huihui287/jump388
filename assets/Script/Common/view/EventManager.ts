/**
 * 事件管理器 - 用于接受和发送消息，支持调试
 */
// 原始导入语句
// const { ccclass, property } = cc._decorator;

// 修改后的导入语句 - 使用新版本的Cocos API
import { _decorator } from 'cc';
const { ccclass, property } = _decorator;

// 事件监听器接口
interface EventListener {
    callback: Function;
    target?: any;
    once?: boolean;
}

@ccclass
export default class EventManager {
    // 事件映射表，存储所有注册的事件和监听器
    private static _eventMap: Map<string, EventListener[]> = new Map();
    
    // 是否启用调试模式
    private static _debugMode: boolean = false;
    
    /**
     * 设置调试模式
     * @param enabled 是否启用调试
     */
    static set debugMode(enabled: boolean) {
        this._debugMode = enabled;
        if (enabled) {
            console.log('EventManager: Debug mode enabled');
        }
    }
    
    static get debugMode(): boolean {
        return this._debugMode;
    }
    
    /**
     * 注册事件监听
     * @param type 事件类型
     * @param callback 回调函数
     * @param target 目标对象（可选）
     */
    static on(type: string, callback: Function, target?: any): void {
        if (!type || !callback) {
            console.error('EventManager: Invalid parameters for on()');
            return;
        }
        
        if (!this._eventMap.has(type)) {
            this._eventMap.set(type, []);
        }
        
        const listeners = this._eventMap.get(type)!;
        listeners.push({ callback, target });
        
        if (this._debugMode) {
            console.log(`EventManager: Registered listener for event "${type}"`, target);
        }
    }
    
    /**
     * 注册一次性事件监听
     * @param type 事件类型
     * @param callback 回调函数
     * @param target 目标对象（可选）
     */
    static once(type: string, callback: Function, target?: any): void {
        if (!type || !callback) {
            console.error('EventManager: Invalid parameters for once()');
            return;
        }
        
        if (!this._eventMap.has(type)) {
            this._eventMap.set(type, []);
        }
        
        const listeners = this._eventMap.get(type)!;
        listeners.push({ callback, target, once: true });
        
        if (this._debugMode) {
            console.log(`EventManager: Registered one-time listener for event "${type}"`, target);
        }
    }
    
    /**
     * 取消事件监听
     * @param type 事件类型
     * @param callback 回调函数
     * @param target 目标对象（可选）
     */
    static off(type: string, callback: Function, target?: any): void {
        if (!type || !callback) {
            console.error('EventManager: Invalid parameters for off()');
            return;
        }
        
        if (!this._eventMap.has(type)) {
            return;
        }
        
        const listeners = this._eventMap.get(type)!;
        const originalLength = listeners.length;
        
        // 过滤掉匹配的监听器
        const filteredListeners = listeners.filter(listener => {
            return !(listener.callback === callback && (!target || listener.target === target));
        });
        
        if (filteredListeners.length < originalLength) {
            this._eventMap.set(type, filteredListeners);
            
            // 如果没有监听器了，移除这个事件类型
            if (filteredListeners.length === 0) {
                this._eventMap.delete(type);
            }
            
            if (this._debugMode) {
                console.log(`EventManager: Removed listener for event "${type}"`, target);
            }
        }
    }
    
    /**
     * 取消目标对象的所有事件监听
     * @param target 目标对象
     */
    static offAllByTarget(target: any): void {
        if (!target) {
            console.error('EventManager: Invalid target for offAllByTarget()');
            return;
        }
        
        let removedCount = 0;
        
        // 遍历所有事件类型
        for (const [type, listeners] of this._eventMap.entries()) {
            const originalLength = listeners.length;
            const filteredListeners = listeners.filter(listener => listener.target !== target);
            
            if (filteredListeners.length < originalLength) {
                removedCount += originalLength - filteredListeners.length;
                
                if (filteredListeners.length === 0) {
                    this._eventMap.delete(type);
                } else {
                    this._eventMap.set(type, filteredListeners);
                }
            }
        }
        
        if (this._debugMode && removedCount > 0) {
            console.log(`EventManager: Removed ${removedCount} listeners for target`, target);
        }
    }
    
    /**
     * 发送事件
     * @param type 事件类型
     * @param detail 事件详情（可选）
     */
    static emit(type: string, detail?: any): void {
        if (!type) {
            console.error('EventManager: Invalid event type for emit()');
            return;
        }
        
        if (!this._eventMap.has(type)) {
            if (this._debugMode) {
                console.log(`EventManager: No listeners for event "${type}"`, detail);
            }
            return;
        }
        
        if (this._debugMode) {
            console.log(`EventManager: Emitting event "${type}"`, detail);
        }
        
        const listeners = this._eventMap.get(type)!;
        const listenersToRemove: number[] = [];
        
        // 遍历所有监听器并执行回调
        for (let i = 0; i < listeners.length; i++) {
            const listener = listeners[i];
            try {
                if (listener.target) {
                    listener.callback.call(listener.target, detail);
                } else {
                    listener.callback(detail);
                }
                
                // 如果是一次性监听器，标记为要移除
                if (listener.once) {
                    listenersToRemove.push(i);
                }
            } catch (error) {
                console.error(`EventManager: Error in event "${type}" callback:`, error);
            }
        }
        
        // 移除一次性监听器
        if (listenersToRemove.length > 0) {
            // 从后往前移除，避免索引问题
            for (let i = listenersToRemove.length - 1; i >= 0; i--) {
                listeners.splice(listenersToRemove[i], 1);
            }
            
            // 如果没有监听器了，移除这个事件类型
            if (listeners.length === 0) {
                this._eventMap.delete(type);
            }
        }
    }
    
    /**
     * 检查是否有指定类型的事件监听器
     * @param type 事件类型
     * @returns 是否有监听器
     */
    static hasListener(type: string): boolean {
        return this._eventMap.has(type);
    }
    
    /**
     * 获取指定类型的事件监听器数量
     * @param type 事件类型
     * @returns 监听器数量
     */
    static getListenerCount(type: string): number {
        if (!this._eventMap.has(type)) {
            return 0;
        }
        return this._eventMap.get(type)!.length;
    }
    
    /**
     * 获取所有注册的事件类型
     * @returns 事件类型数组
     */
    static getAllEventTypes(): string[] {
        return Array.from(this._eventMap.keys());
    }
    
    /**
     * 清除所有事件监听器
     */
    static clear(): void {
        const eventCount = this._eventMap.size;
        this._eventMap.clear();
        
        if (this._debugMode) {
            console.log(`EventManager: Cleared all ${eventCount} event types`);
        }
    }
    
    /**
     * 打印事件管理器状态（用于调试）
     */
    static debugLog(): void {
        console.log('=== EventManager Debug Info ===');
        console.log(`Total event types: ${this._eventMap.size}`);
        
        for (const [type, listeners] of this._eventMap.entries()) {
            console.log(`Event "${type}": ${listeners.length} listeners`);
            
            // 详细打印每个监听器
            listeners.forEach((listener, index) => {
                console.log(`  Listener ${index + 1}:`, {
                    target: listener.target,
                    once: listener.once,
                    callback: listener.callback.name || 'anonymous'
                });
            });
        }
        
        console.log('==============================');
    }
    
    
}
