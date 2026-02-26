/**
 * 基础弹窗
 */
import PopupView from "./PopupView";
import CM from '../../channel/CM';
// 修改后的导入语句 - 添加了必要的类型
import { _decorator, Component, Node, Button, isValid, Event, EventHandler, Label } from 'cc';
import EventManager from "./EventManager";
import { EventName } from "../../Tools/eventName";

const { ccclass, property } = _decorator;
/** 点击按钮等待时间 */
const CLICK_WAIT_TIME = 0;
@ccclass("BaseDialog")
export default class BaseDialog extends Component {

    protected static readonly ButtonTag = {
        SURE: "button_sure",
        CANCEL: "button_cancel",
        CLOSE: "button_close",
        POS: "pos",
        ZI: "zi",
        video: "vi",
    }

    protected _data: any;//传入数据

    public pos: Node = null;
    public NextUI: BaseDialog;
    public isHall = false;
    ziPos = null;

    @property({ displayName: '是否遍历所有节点' })
    protected isSelectNode: boolean = true;

    /** 当前所有的节点 */
    protected viewList: Map<string, Node> = new Map<string, Node>();

    showBanner() {
        // if (this.pos!=null) {
        //     WXCtr.showBannerAdZC();   
        // }
        // WXCtr.CreatInterstitialAd();
    }
    onLoad() {

        // 如果需要遍历所有节点，则调用 selectChild 方法
        if (this.isSelectNode) {
            this.selectChild(this.node);
        }
        this.addEvent();

        // 修改后的图集显示逻辑 - 调用提取的方法
        this._updateShareUI();

    }

    // // 修改后的QHUAN方法 - 调用提取的方法
    // QHUAN() {
    //     this._updateShareUI();
    // }

    // 提取的图集显示逻辑方法
    private _updateShareUI() {

        // if (GameCtr.AppConfg.share == "1" && GameCtr.isip == 0) {
        //     if (GameData.shareNUm >= 6) {
        //         if (zi != null) {
        //             zi.active = true;
        //             zi.setPosition(this.ziPos);
        //         }
        //         if (video != null) {
        //             video.active = true;
        //         }
        //     } else {
        //         if (zi != null) {
        //             zi.active = true;
        //             zi.setPosition(0, 0);
        //         }
        //         if (video != null) {
        //             video.active = false;
        //         }
        //     }
        // } else {
        //     if (zi != null) {
        //         zi.active = true;
        //     }
        //     if (video != null) {
        //         video.active = true;
        //     }
        // }
    }

    // 修改后的setData方法 - 添加了类型注释
    setData(data: any) {
        this._data = data;
    }

    // 修改后的dismiss方法 - 使用类型安全的PopupView获取方式
    dismiss(resumeGame: boolean = true) {
        // 隐藏banner广告
        if (CM.mainCH && typeof CM.mainCH.hideBannerAd === 'function') {
            try {
                CM.mainCH.hideBannerAd();
            } catch (error) {
                console.error('BaseDialog.dismiss: Failed to hide banner ad:', error);
            }
        }
        // 通过消息系统恢复游戏（仅当 resumeGame 为 true 时）
        if (resumeGame) {
            EventManager.emit(EventName.Game.Resume);
        }
        
        if (!isValid(this.node) || !isValid(this.node.parent)) {
            console.warn('BaseDialog.dismiss: node or node.parent is invalid');
            return;
        }
        
        
        if (this.NextUI != null) {
            // this.NextUI.showBanner();
        } else if (this.isHall == true) {
            // GameCtr.ins.mHall.showBanner();
        }
        else {
            //   WXCtr.hideBannerAdZC();
        }
        // 使用类型安全的方法获取PopupView组件
        let popupView = this.node.parent.getComponent(PopupView);
        if (!!popupView && isValid(popupView.node)) {
            popupView.dismiss(resumeGame);
        } else {
            this.node.destroy();
        }
       // EventManager.off("QHUAN", this.QHUAN, this);
    }

    protected addEvent() {

    }

    onDestroy() {
        this.node.destroy();
    }

    /**
     * 根据节点名称获取节点
     * @param name 节点名称
     * @returns 返回指定名称的节点，如果不存在则返回 null
     */
    protected getNodeByName(name: string): Node | null {
        return this.viewList.get(name) || null;
    }

    /**
     * 遍历所有子节点，将节点存储到 viewList 中
     * @param node 当前节点
     * @param pName 当前节点的路径
     */
    private selectChild(node: Node, pName = '') {
        // 使用一个栈来遍历所有节点，避免递归调用带来的性能问题。
        const stack: [Node, string][] = [[node, pName]];
        while (stack.length > 0) {
            const [curNode, curPath] = stack.pop()!;
            // 将节点存储到 viewList 中，以当前节点的路径作为键
            this.viewList.set(curPath, curNode);
            // 绑定按钮事件
            this._bingButton(curNode);

            const children = curNode.children;
            // 遍历当前节点的所有子节点，并将其添加到栈中
            for (let i = children.length - 1; i >= 0; i--) {
                const childNode = children[i];
                const childPath = curPath ? `${curPath}/${childNode.name}` : childNode.name;
                // 将子节点添加到栈中
                stack.push([childNode, childPath]);
            }
        }
    }

    /**
     * 为按钮绑定事件
     * @param node 节点
     * @returns 
     */
    private _bingButton(node: Node) {
        if (!node.getComponent(Button)) return
        // App.audio.play('button_click')
        let btn = node.getComponent(Button);
        btn.transition = Button.Transition.SCALE;
        btn.zoomScale = 0.95;
        if (this['onClick_' + node.name + "_Start"]) {
            this.addButtonLister(node, Node.EventType.TOUCH_START, this['onClick_' + node.name + "_Start"].bind(this, node), this, CLICK_WAIT_TIME);
        }
        if (this['onClick_' + node.name + "_End"]) {
            this.addButtonLister(node, Node.EventType.TOUCH_END, this['onClick_' + node.name + "_End"].bind(this, node), this, CLICK_WAIT_TIME);
        }
        if (this['onClick_' + node.name]) {
            this.addButtonLister(node, Node.EventType.TOUCH_END, this['onClick_' + node.name].bind(this, node), this, CLICK_WAIT_TIME);
        }


    }

    addButtonLister(n: Node, event: string, callback: Function, target: any, waitTimeSec = 0, ...args) {
        n.off(event);
        n.on(event, () => {
            if (waitTimeSec) {
                // 防止连点，冷却时间
                let clickTime = n['clickTime'] || new Date().getTime();
                let nowTime = new Date().getTime();
                let offsetTime = (nowTime - clickTime) / 1000;
                if (offsetTime && offsetTime < waitTimeSec) return;
                n.attr({ clickTime: nowTime });
            }
            //需要自定义音效的按钮，末尾加入Audio字符串
            if (n.name.indexOf('Audio') < 0) {
                // App.audio.play(1000002);
            }
            callback.call(target, n, ...args);
        })
    }

    /**
    * 更新label文字
    * **/
    updateLabelText(node: Node | Label, strKey: string | number, isI18n = false) {
        if (!isValid(node)) {
            // PrintError(`LabelText not node = ${strKey}`);
            return;
        }
        let label: Label = node instanceof Node ? node.getComponent(Label) : node
        if (!label) {
            // PrintError(`LabelText not label = ${strKey}`);
            return;
        }
        strKey = strKey + "";
        // let newText = isI18n ? App.i18n.getString(strKey) : strKey;
        let newText = strKey;
        label.string = newText;
    }

}
