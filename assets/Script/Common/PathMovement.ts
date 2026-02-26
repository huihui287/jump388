import { _decorator, Component, Node, Vec3, tween, Tween, isValid, TweenEasing } from 'cc';
const { ccclass } = _decorator;

// 移动状态枚举
export enum MovementState {
    IDLE,
    MOVING,
    PAUSED,
    COMPLETED
}

// 路径移动配置接口
export interface PathMovementConfig {
    speed?: number; // 移动速度
    loop?: boolean; // 是否循环移动
    easing?: TweenEasing; // 缓动类型
    autoStart?: boolean; // 是否自动开始移动
}

// 事件回调接口
export interface PathMovementEvents {
    onStart?: (target: Node) => void; // 移动开始回调
    onWaypointReached?: (target: Node, waypointIndex: number) => void; // 到达路径点回调
    onComplete?: (target: Node) => void; // 移动完成回调
    onLoopComplete?: (target: Node) => void; // 循环完成回调
    onStop?: (target: Node) => void; // 移动停止回调
}

@ccclass
export default class PathMovement {
    private _targetNode: Node = null; // 目标节点
    private _pathNodes: Node[] = []; // 路径点节点数组
    private _pathPoints: Vec3[] = []; // 路径点坐标数组
    private _config: PathMovementConfig = null; // 移动配置
    private _events: PathMovementEvents = null; // 事件回调
    private _currentState: MovementState = MovementState.IDLE; // 当前移动状态
    private _currentWaypointIndex: number = 0; // 当前路径点索引
    private _currentTween: Tween<Node> = null; // 当前tween动画实例
    private _totalDistance: number = 0; // 路径总长度
    private _pausePosition: Vec3 = null; // 暂停时的位置

    /**
     * 构造函数
     * @param targetNode 目标节点 - 需要沿着路径移动的节点
     * @param pathNodes 路径点节点数组 - 由多个节点组成的路径
     * @param config 移动配置 - 可选的移动参数设置
     * @param events 事件回调 - 可选的事件监听函数
     */
    constructor(targetNode: Node, pathNodes: Node[], config?: PathMovementConfig, events?: PathMovementEvents) {
        // 初始化核心状态变量
        this._currentWaypointIndex = 0; // 当前路径点索引
        this._currentState = MovementState.IDLE; // 当前移动状态
        this._totalDistance = 0; // 路径总长度
        this._pausePosition = null; // 暂停时的位置记录
        this._currentTween = null; // 当前运行的tween动画实例
        
        // 依次设置各项参数
        this.setTargetNode(targetNode);
        this.setPathNodes(pathNodes);
        this.setConfig(config || {}); // 确保即使没有配置也能正确初始化
        this.setEvents(events || {});
        
        // 如果配置了自动开始且条件满足，则自动启动移动
        if (this._config.autoStart && this._pathPoints.length >= 2 && isValid(this._targetNode)) {
            this.start();
        }
    }

    /**
     * 设置目标节点
     * @param targetNode 目标节点
     */
    public setTargetNode(targetNode: Node): void {
        if (!isValid(targetNode)) {
            console.error('PathMovement: 无效的目标节点');
            return;
        }
        this._targetNode = targetNode;
    }

    /**
     * 设置路径点节点数组
     * @param pathNodes 路径点节点数组
     */
    public setPathNodes(pathNodes: Node[]): void {
        if (!Array.isArray(pathNodes)) {
            console.error('PathMovement: 路径点参数必须是数组');
            return;
        }
        
        if (pathNodes.length < 2) {
            console.error('PathMovement: 路径点数组必须包含至少2个节点');
            return;
        }
        
        // 如果正在移动，先停止移动
        if (this._currentState !== MovementState.IDLE && this._currentState !== MovementState.COMPLETED) {
            this.stop();
        }
        
        this._pathNodes = pathNodes;
        this._pathPoints = [];
        this._totalDistance = 0;
        
        // 解析路径点坐标并计算总距离
        let validPoints: Vec3[] = [];
        for (let i = 0; i < pathNodes.length; i++) {
            const node = pathNodes[i];
            if (isValid(node)) {
                const position = node.getPosition();
                validPoints.push(position.clone());
                
                // 计算与前一个有效点的距离
                if (validPoints.length > 1) {
                    const prevPosition = validPoints[validPoints.length - 2];
                    this._totalDistance += Vec3.distance(prevPosition, position);
                }
            } else {
                console.error(`PathMovement: 路径点索引 ${i} 无效`);
            }
        }
        
        this._pathPoints = validPoints;
        
        // 确保至少有2个有效路径点
        if (this._pathPoints.length < 2) {
            console.error('PathMovement: 有效路径点数量不足2个');
            this._totalDistance = 0;
        }
        
        // 重置当前路径点索引
        this._currentWaypointIndex = 0;
    }

    /**
     * 设置移动配置
     * @param config 移动配置
     */
    public setConfig(config: PathMovementConfig): void {
        // 创建配置对象，确保速度始终大于0
        const newConfig = {
            speed: config.speed !== undefined ? Math.max(config.speed, Number.EPSILON) : 1,
            loop: config.loop !== undefined ? config.loop : false,
            easing: config.easing !== undefined ? config.easing : TweenEasing.linear,
            autoStart: config.autoStart !== undefined ? config.autoStart : false,
            ...config
        };
        
        // 再次确保速度大于0，防止扩展运算符覆盖了之前的设置
        newConfig.speed = Math.max(newConfig.speed, Number.EPSILON);
        
        this._config = newConfig;
    }

    /**
     * 设置事件回调
     * @param events 事件回调
     */
    public setEvents(events: PathMovementEvents): void {
        this._events = {
            ...this._events,
            ...events
        };
    }

    /**
     * 获取当前移动状态
     */
    public getState(): MovementState {
        return this._currentState;
    }

    /**
     * 获取当前路径点索引
     */
    public getCurrentWaypointIndex(): number {
        return this._currentWaypointIndex;
    }

    /**
     * 获取路径总长度
     */
    public getTotalDistance(): number {
        return this._totalDistance;
    }

    /**
     * 开始移动
     */
    public start(): void {
        if (!isValid(this._targetNode) || this._pathPoints.length < 2) {
            console.error('PathMovement: 无法开始移动，目标节点或路径点无效');
            return;
        }
        
        if (this._currentState === MovementState.MOVING) {
            console.warn('PathMovement: 已经在移动中');
            return;
        }
        
        this._currentState = MovementState.MOVING;
        this._currentWaypointIndex = 0;
        
        // 触发移动开始事件
        if (this._events.onStart) {
            this._events.onStart(this._targetNode);
        }
        
        this.moveToNextWaypoint();
    }

    /**
     * 移动到下一个路径点
     */
    private moveToNextWaypoint(): void {
        // 检查基本条件：目标节点是否有效、是否在移动状态
        if (!isValid(this._targetNode)) {
            console.error('PathMovement: 目标节点无效');
            this.stop();
            return;
        }
        
        if (this._currentState !== MovementState.MOVING) {
            return;
        }
        
        // 检查路径点数组是否有效
        if (!Array.isArray(this._pathPoints) || this._pathPoints.length < 2) {
            console.error('PathMovement: 路径点数组无效或长度不足');
            this.stop();
            return;
        }
        
        // 确保索引在有效范围内
        this._currentWaypointIndex = Math.max(0, this._currentWaypointIndex);
        
        // 处理到达最后一个路径点的情况
        if (this._currentWaypointIndex >= this._pathPoints.length - 1) {
            if (this._config.loop) {
                // 循环移动
                this._currentWaypointIndex = 0;
                this._pausePosition = null; // 循环时重置暂停位置
                
                // 触发循环完成事件
                if (this._events.onLoopComplete) {
                    this._events.onLoopComplete(this._targetNode);
                }
            } else {
                // 移动完成
                this._currentState = MovementState.COMPLETED;
                this._pausePosition = null; // 完成时重置暂停位置
                
                // 触发移动完成事件
                if (this._events.onComplete) {
                    this._events.onComplete(this._targetNode);
                }
                return;
            }
        }
        
        // 获取当前路径点和下一个路径点
        const currentPoint = this._pathPoints[this._currentWaypointIndex];
        const nextPoint = this._pathPoints[this._currentWaypointIndex + 1];
        
        // 检查路径点是否有效
        if (!currentPoint || !nextPoint) {
            console.error('PathMovement: 当前或下一个路径点无效');
            this.stop();
            return;
        }
        
        // 使用暂停位置作为起点，如果存在的话
        const startPoint = this._pausePosition || currentPoint;
        this._pausePosition = null; // 重置暂停位置
        
        // 计算两点之间的距离
        const distance = Vec3.distance(startPoint, nextPoint);
        
        // 计算移动时间（距离 / 速度）
        const duration = distance / this._config.speed;
        
        // 确保时间不为负数或NaN
        if (isNaN(duration) || duration <= 0) {
            console.error('PathMovement: 移动时间计算错误');
            this._currentWaypointIndex++;
            this.moveToNextWaypoint();
            return;
        }
        
        // 创建tween动画
        this._currentTween = tween(this._targetNode)
            .to(duration, { position: nextPoint }, { easing: this._config.easing })
            .call(() => {
                // 更新当前路径点索引
                this._currentWaypointIndex++;
                
                // 触发到达路径点事件
                if (this._events.onWaypointReached) {
                    this._events.onWaypointReached(this._targetNode, this._currentWaypointIndex);
                }
                
                // 继续移动到下一个路径点
                this.moveToNextWaypoint();
            })
            .start();
    }

    /**
     * 暂停移动
     */
    public pause(): void {
        if (this._currentState !== MovementState.MOVING) {
            console.warn('PathMovement: 当前不在移动状态，无法暂停');
            return;
        }
        
        if (this._currentTween) {
            this._currentTween.stop();
        }
        
        // 保存暂停时的位置
        if (isValid(this._targetNode)) {
            this._pausePosition = this._targetNode.position.clone();
        }
        
        this._currentState = MovementState.PAUSED;
    }

    /**
     * 继续移动
     */
    public resume(): void {
        if (this._currentState !== MovementState.PAUSED) {
            console.warn('PathMovement: 当前不在暂停状态，无法继续');
            return;
        }
        
        this._currentState = MovementState.MOVING;
        this.moveToNextWaypoint();
    }

    /**
     * 停止移动
     */
    public stop(): void {
        if (this._currentState === MovementState.IDLE || this._currentState === MovementState.COMPLETED) {
            console.warn('PathMovement: 当前没有在移动，无法停止');
            return;
        }
        
        if (this._currentTween) {
            this._currentTween.stop();
            this._currentTween = null;
        }
        
        this._currentState = MovementState.IDLE;
        this._pausePosition = null; // 停止时重置暂停位置
        
        // 触发移动停止事件
        if (this._events.onStop) {
            this._events.onStop(this._targetNode);
        }
    }

    /**
     * 重置移动
     */
    public reset(): void {
        this.stop();
        this._currentWaypointIndex = 0;
        this._currentState = MovementState.IDLE;
        this._pausePosition = null; // 重置时重置暂停位置
    }

    /**
     * 设置移动速度
     * @param speed 移动速度 - 必须大于0
     */
    public setSpeed(speed: number): void {
        if (speed <= 0) {
            console.error('PathMovement: 速度必须大于0');
            return;
        }
        
        this._config.speed = speed;
        
        // 如果正在移动中，重新开始当前路径段的移动以应用新速度
        if (this._currentState === MovementState.MOVING) {
            this.pause(); // 先暂停以保存当前位置
            this.resume(); // 再继续以新速度从当前位置开始移动
        }
    }

    /**
     * 设置是否循环移动
     * @param loop 是否循环 - true表示循环移动，false表示单次移动
     */
    public setLoop(loop: boolean): void {
        this._config.loop = loop;
    }

    /**
     * 设置缓动类型
     * @param easing 缓动类型 - 使用TweenEasing枚举值，例如：TweenEasing.linear, TweenEasing.easeIn, TweenEasing.easeOut等
     */
    public setEasing(easing: TweenEasing): void {
        this._config.easing = easing;
        
        // 如果正在移动中，重新开始当前路径段的移动以应用新缓动效果
        if (this._currentState === MovementState.MOVING) {
            this.pause(); // 先暂停以保存当前位置
            this.resume(); // 再继续以新缓动效果从当前位置开始移动
        }
    }

    /**
     * 销毁路径移动实例
     */
    public destroy(): void {
        this.stop();
        this._targetNode = null;
        this._pathNodes = [];
        this._pathPoints = [];
        this._config = null;
        this._events = null;
    }
}
