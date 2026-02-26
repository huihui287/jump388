// import { HeadIcon } from "../const/enumConst";
// import { LobbyConfig } from "../const/lobbyConfig";
// import { App } from "../core/app";
// import { PrintError, PrintLog } from "./logHelper";
// import { ResLoadHelper } from "./resLoadHelper";
// import { ToolsHelper } from "./toolsHelper";
import { _decorator, Component, Node, isValid, Sprite, SpriteFrame, Label, EditBox, RichText, UITransform, Vec2, Vec3, Camera, tween, } from 'cc';
import { ToolsHelper } from './toolsHelper';
import { App } from '../Controller/app';
// /**
//  * cocos相关方法
//  */
class Helper {
    /** 添加按钮点击事件 */
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


    /** 动态添加事件 */
    addEventHandler(n: Node, className: string, callFuncName: string, customData = '') {
        let handler = new Component.EventHandler();
        handler.target = n;
        handler.component = className;
        handler.handler = callFuncName;
        handler.customEventData = customData;
        return handler;
    }

    /**
    * 更新label文字
    * **/
    updateLabelText(node: Node | Label, strKey: string | number, isI18n = false) {
        if (!isValid(node)) {
          //  PrintError(`LabelText not node = ${strKey}`);
            return;
        }
        let label: Label = node instanceof Node ? node.getComponent(Label) : node
        if (!label) {
           // PrintError(`LabelText not label = ${strKey}`);
            return;
        }
        strKey = strKey + "";
        let newText = strKey;
        label.string = newText;
    }


    /** 更新金额相关的label */
    updateMoneyLab(node: Node, num: number) {
        let moneyStr = ToolsHelper.moneyToThousands(num);
        this.updateLabelText(node, moneyStr, false);
    }


}

export let CocosHelper = new Helper();