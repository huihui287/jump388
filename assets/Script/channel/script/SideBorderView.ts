import { _decorator, Component } from "cc";
// import { DouyinSideBar } from "./DouyinSideBar";
import CM from "../CM";
import { BaseNodeCom } from "../../game/BaseNodeCom";
import ViewManager from "../../Common/view/ViewManager";
import BaseDialog from "../../Common/view/BaseDialog";

const { ccclass, property } = _decorator;

@ccclass('SideBorderView')
export default class SideBorderView extends BaseDialog {

    onClick_getBtn() {
        if (CM.mainCH) {
            CM.mainCH.navigateToSideBar((success) => {
                console.log('Jump to Douyin side bar:', success);
            });
        } else {
            console.warn('CM.mainCH not initialized');
        }
        this.dismiss();
    }

    onClick_backBtn() {
        this.dismiss();
    }
}
