/**
 * JoystickControl.ts
 * 虚拟摇杆控制器
 * 用于处理触摸输入并将其转换为方向向量，控制游戏角色移动
 */
import { _decorator, Component, Node, EventTouch, Vec2, v2, v3, UITransform, Vec3, Input, input, EventKeyboard, KeyCode, tween, Tween } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 虚拟摇杆控制器类
 * 处理触摸输入并将其转换为方向向量
 */
@ccclass('JoystickControl')
export class JoystickControl extends Component {
    /** 摇杆底座节点 */
    @property(Node)
    private baseNode: Node = null!;

    /** 摇杆节点 */
    @property(Node)
    private stick: Node = null!;

    /** 摇杆移动范围限制 */
    @property
    private stickLimit = 80;

    /** 死区大小，小于此值的输入将被忽略 */
    @property
    private deadZone = 10; // 添加死区配置

    /** 控制触摸结束时是否重置摇杆位置 */
    @property
    private resetStickOnEnd = true; // 控制触摸结束时是否重置摇杆位置

    /** 触摸起始位置 */
    private readonly _originPos = v3();
    /** 临时偏移向量，用于复用 */
    private readonly _tempOffset = v3(); // 复用 Vec2 对象
    /** 输入方向向量，归一化后的方向 */
    private readonly _inputVector = v3();

    /** 教程动画实例 */
    private startStickAnim = null;
    
    /**
     * 组件加载时调用
     * 初始化摇杆并注册触摸事件
     */
    protected onLoad(): void {
        this.initializeJoystick();
        this.registerTouchEvents();
    }
    
    /**
     * 组件启用时调用
     * 启动游戏教程动画
     */
    protected start(): void {
        this.startGameShowTeacher() 
    }

    /**
     * 组件销毁时调用
     * 注销触摸事件
     */
    protected onDestroy(): void {
        this.unregisterTouchEvents();
    }

    /**
     * 初始化摇杆
     * 设置初始状态，隐藏摇杆底座并重置摇杆位置
     */
    private initializeJoystick(): void {
        this.baseNode.active = false;
        this.stick.setPosition(0, 0, 0);
    }

    /**
     * 注册触摸事件
     * 监听触摸开始、移动、结束和取消事件
     */
    private registerTouchEvents(): void {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);

    }

    /**
     * 注销触摸事件
     * 移除所有触摸事件监听并隐藏摇杆底座
     */
    private unregisterTouchEvents(): void {
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.baseNode.active = false;

    }

    /**
     * 进入游戏教程点击滑动动画
     * 显示摇杆并播放循环动画，引导玩家操作
     */
    public startGameShowTeacher() {
        this._originPos.set(0, 0);

        this.baseNode.active = true;
        this.startStickAnim = tween(this.stick)
            .to(0.6, {position: v3(68, 60) })
            .to(0.6, {position: v3(0, 0)});
        tween(this.stick).repeatForever(this.startStickAnim).start();
    }

    /**
     * 触摸开始事件处理
     * 停止教程动画，记录触摸起始位置，显示摇杆底座
     * @param event 触摸事件对象
     */
    private onTouchStart(event: EventTouch): void {
         if (this.startStickAnim) {
            this.startStickAnim = null;
            Tween.stopAllByTarget(this.stick);
        }
        const touchPos = event.getUIStartLocation();
        this._originPos.set(touchPos.x, touchPos.y);
        
        this.baseNode.active = true;
        this.baseNode.setWorldPosition(this._originPos);
        
        this.updateJoystickPosition(event.getUILocation());
    }

    /**
     * 触摸移动事件处理
     * 更新摇杆位置
     * @param event 触摸事件对象
     */
    private onTouchMove(event: EventTouch): void {
        this.updateJoystickPosition(event.getUILocation());
    }

    /**
     * 更新摇杆位置
     * 计算触摸偏移，应用死区，限制移动范围，更新输入向量
     * @param currentPos 当前触摸位置
     */
    private updateJoystickPosition(currentPos: Vec2): void {
        // 计算触摸偏移
        this._tempOffset.set(
            currentPos.x - this._originPos.x,
            currentPos.y - this._originPos.y
        );

        const distance = this._tempOffset.length();
        
        // 应用死区，小于死区的输入被忽略
        if (distance < this.deadZone) {
            this._inputVector.set(Vec3.ZERO);
            this.stick.setPosition(0, 0);
            return;
        }

        // 限制摇杆移动范围
        const clampedDistance = Math.min(distance, this.stickLimit);
        const normalizedOffset = this._tempOffset.normalize();
        
        // 计算摇杆新位置
        const stickX = normalizedOffset.x * clampedDistance;
        const stickY = normalizedOffset.y * clampedDistance;
        
        // 更新摇杆位置和输入向量
        this.stick.setPosition(stickX, stickY);
        this._inputVector.set(normalizedOffset);
        

    }

    /**
     * 触摸结束事件处理
     * 隐藏摇杆底座，重置摇杆位置和输入向量
     */
    private onTouchEnd(): void {
        this.baseNode.active = false;
        
        if (this.resetStickOnEnd) {
            this.stick.setPosition(0, 0);
        }
        
        this._inputVector.set(Vec3.ZERO);


    }

}

