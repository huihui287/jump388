import PopupView from "./PopupView";

// 原始导入语句
// const {ccclass, property} = cc._decorator;

// 修改后的导入语句
import { _decorator, Component, Node, Label } from 'cc';
const {ccclass, property} = _decorator;

@ccclass
export default class PromptDialog extends Component {

    // 原始属性声明
    // @property(cc.Label)
    // lbTitle: cc.Label = null;
    // @property(cc.Node)
    // ndTitle: cc.Node = null;
    // @property(cc.Node)
    // ndBtnClose: cc.Node = null;
    
    // 修改后的属性声明
    @property(Label)
    lbTitle: Label = null;
    @property(Node)
    ndTitle: Node = null;
    @property(Node)
    ndBtnClose: Node = null;

    start () {

    }

    setData(data) {
        if(data.node) {
            this.node.addChild(data.node);
        }
        if(data.title){
            this.lbTitle.string = data.title;
        }else{
            this.ndTitle.active = false;
        }
        this.ndBtnClose.active = data.closeButton;
    }

    // 原始dismiss方法
    // dismiss() {
    //     if (!this.node.parent) {
    //         return;
    //     }
    //     let PopupView = this.node.parent.getComponent("PopupView");
    //     if (!!PopupView) {
    //         PopupView.dismiss();
    //     } else {
    //         this.node.destroy();
    //     }
    // }
    
    // 修改后的dismiss方法
    dismiss() {
        if (!this.node.parent) {
            return;
        }
        let popupView = this.node.parent.getComponent(PopupView);
        if (!!popupView) {
            popupView.dismiss();
        } else {
            this.node.destroy();
        }
    }
}
