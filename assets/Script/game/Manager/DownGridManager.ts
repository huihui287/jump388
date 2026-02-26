import { _decorator, Component, Node, Prefab, v3, instantiate, tween, isValid, CCFloat, CCInteger } from 'cc';
import { Constant, GridType } from '../../Tools/enumConst';

import LoaderManeger from '../../sysloader/LoaderManeger';

import EventManager from '../../Common/view/EventManager';
import { EventName } from '../../Tools/eventName';
import { App } from '../../Controller/app';
import AudioManager from '../../Common/AudioManager';
    /**
     * 表示被回收方块的信息接口
     */
    interface GridPosition {
        x: number;
        y: number;
        z: number;
        type: number;
    }   
const { ccclass, property } = _decorator;

@ccclass('DownGridManager')
export class DownGridManager extends Component {
 
    /**
     * 生命周期方法：组件销毁时调用
     */
    onDestroy() {
       // this.clearAllGrids();
    }

    protected onLoad(): void {
    }
  

}
