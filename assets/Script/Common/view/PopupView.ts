/**
 * 基础弹出界面
 */
// 原始导入语句
// const { ccclass, property } = cc._decorator;

// 修改后的导入语句
import { _decorator, Component, Node, EventTouch, isValid, Rect, Vec2, tween, TweenAction, Tween, UITransform, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;

@ccclass
export default class PopupView extends Component {

    // 修改后的属性声明
    private _maskNode: Node = null;//蒙层
    contentNode: Node;

    private _showMask: boolean = true;//是否显示蒙层，默认为true
    private _maskOpacity: number = 0;//蒙层不透明度
    private destroyCallback: Function;
    private _closeOnTouchOutside: boolean;//是否点击外面关闭
    private _closeOnKeyBack: boolean;//是否点击返回键关闭
    
    // 修改后的动画属性声明 - 使用tween动画系统
    private _showAction: Tween<Node>;
    private _showActionTarget: Node;
    private _dismissAction: Tween<Node>;
    private _dismissActionTarget: Node
    private _localZOrder: number = 0;
    private _resumeGame: boolean = true; // 是否需要恢复游戏

    onLoad() {
        this._maskNode = this.node.getChildByName("mask");
       if (isValid(this._maskNode)) {
            this._maskNode.active = this._showMask;
            console.log("PopupView onLoad:", this._showMask, this._maskOpacity);
            this._maskNode.getComponent(UIOpacity).opacity = this._maskOpacity;

            // 修改后的事件监听
            this._maskNode.on(Node.EventType.TOUCH_START, this.onTouchMask, this);
            this._maskNode.on(Node.EventType.TOUCH_END, this.onTouchMask, this);
        }
    }

    onDestroy() {
        if (isValid(this._maskNode)) {
            // 修改后的事件监听
            this._maskNode.off(Node.EventType.TOUCH_START, this.onTouchMask, this);
            this._maskNode.off(Node.EventType.TOUCH_END, this.onTouchMask, this);
        }
        if (this.destroyCallback) {
            this.destroyCallback(this);
        }
    }


    // 修改后的事件处理方法
    onTouchMask(event: EventTouch) {
        event.propagationStopped = true;
        if (event.type == Node.EventType.TOUCH_END
            && this.closeOnTouchOutside
            && this.contentNode
            && !this.contentNode.getComponent(UITransform).getBoundingBoxToWorld().contains(event.getLocation())) {
            this.dismiss();
        }
    }

    
    // 修改后的show方法 - 使用tween动画系统
    show(parent: Node) {
        if (!isValid(this)) {
            return;
        }
        if (!isValid(parent)) {
            return;
        }
        this.node.parent = parent;
        this.node.active = true;
        if (this._localZOrder > 0) {
            this.node.setSiblingIndex(this._localZOrder);
        } else {
            this.node.setSiblingIndex(this.node.parent.children.length - 1);
        }
        if (isValid(this._showActionTarget) && isValid(this._showAction)) {
            tween(this._showActionTarget).stop().then(this._showAction).start();
        }
    }
    
    // 修改后的dismiss方法 - 使用tween动画系统
    dismiss(resumeGame: boolean = true) {
        this._resumeGame = resumeGame;
        if (!isValid(this.node)) {
            return;
        }
        if (isValid(this._dismissActionTarget) && isValid(this._dismissAction)) {
            tween(this._dismissActionTarget).stop().then(this._dismissAction).start();
        } else {
            this.doDismiss(resumeGame);
        }
    }

    private doDismiss(resumeGame: boolean = true) {
        this.node.destroy();
    }

    setMask(showMask: boolean, maskOpacity) {
        this._showMask = showMask;
        this._maskOpacity = maskOpacity;
        
        // 如果_maskNode已经存在，立即更新其状态
        if (isValid(this._maskNode)) {
            this._maskNode.active = this._showMask;
            this._maskNode.getComponent(UIOpacity).opacity = this._maskOpacity;
            console.log("PopupView setMask:", this._showMask, this._maskOpacity);
        }
    }

    // 原始setShowAction方法
    // setShowAction(action: cc.FiniteTimeAction, target: cc.Node) {
    //     if (cc.isValid(target) && cc.isValid(action)) {
    //         this._showAction = action;
    //         this._showActionTarget = target;
    //     }
    // }
    
    // 原始setShowAction方法（基于旧动画系统）
    // setShowAction(action: FiniteTimeAction, target: Node) {
    //     if (isValid(target) && isValid(action)) {
    //         this._showAction = action;
    //         this._showActionTarget = target;
    //     }
    // }
    
    // 修改后的setShowAction方法 - 使用tween动画系统
    setShowAction(action: Tween<Node>, target: Node) {
        if (isValid(target) && isValid(action)) {
            this._showAction = action;
            this._showActionTarget = target;
        }
    }

    // 原始setDismissAction方法
    // setDismissAction(action: cc.FiniteTimeAction, target: cc.Node) {
    //     if (cc.isValid(target) && cc.isValid(action)) {
    //         this._dismissAction = cc.sequence(action, cc.callFunc(() => { this.doDismiss(); }));
    //         this._dismissActionTarget = target;
    //     }
    // }
    
    // 原始setDismissAction方法（基于旧动画系统）
    // setDismissAction(action: FiniteTimeAction, target: Node) {
    //     if (isValid(target) && isValid(action)) {
    //         this._dismissAction = sequence(action, callFunc(() => { this.doDismiss(); }));
    //         this._dismissActionTarget = target;
    //     }
    // }
    
    // 修改后的setDismissAction方法 - 使用tween动画系统
    setDismissAction(action: Tween<Node>, target: Node) {
        if (isValid(target) && isValid(action)) {
            this._dismissAction = tween(target)
                .then(action)
                .call(() => { this.doDismiss(this._resumeGame); });
            this._dismissActionTarget = target;
        }
    }

    setOnDestroyCallback(callback: Function) {
        this.destroyCallback = callback;
    }

    set closeOnTouchOutside(value: boolean) {
        this._closeOnTouchOutside = value;
    }

    get closeOnTouchOutside(): boolean {
        return this._closeOnTouchOutside;
    }

    set closeOnKeyBack(value: boolean) {
        this._closeOnKeyBack = value;
    }

    get closeOnKeyBack(): boolean {
        return this._closeOnKeyBack;
    }

    set localZOrder(localZOrder: number) {
        this._localZOrder = localZOrder;
    }

    get localZOrder() {
        return this._localZOrder;
    }
}
