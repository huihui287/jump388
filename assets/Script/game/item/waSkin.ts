import { _decorator, Component, Label, Node, sp, Color } from 'cc';
import { SkinConfig } from '../Skin/SkinConfig';
const { ccclass, property } = _decorator;

@ccclass('waSkin')
export class waSkin extends Component {

    @property({ type: sp.Skeleton })
    ndSpine: sp.Skeleton = null;

    @property({ type: Label })
    nameBal: Label = null;

    @property({ type: Node })
    ndSelect: Node = null;

    // 点击回调
    private _clickCallback: (config: SkinConfig) => void = null;
    public _skinConfig: SkinConfig = null;

    protected onLoad(): void {
        this.node.on(Node.EventType.TOUCH_END, this.onClick, this);
        this.ndSelect.active = false;
    }

    protected onDestroy(): void {
        this.node.off(Node.EventType.TOUCH_END, this.onClick, this);
    }
    
    start() {

    }

    update(deltaTime: number) {

    }

    setSkin(skinConfig: SkinConfig, callback?: (config: SkinConfig, waSkin: waSkin) => void) {
        this._skinConfig = skinConfig;
        // 适配回调，传入自身引用
        this._clickCallback = (config) => {
            if (callback) {
                callback(config, this);
            }
        };
        this.nameBal.string = skinConfig.name;
        this.ndSpine.setSkin(skinConfig.spineSkinName);
        this.ndSpine.setSlotsToSetupPose();
    }

    private onClick() {
        if (this._clickCallback && this._skinConfig) {
            this._clickCallback(this._skinConfig);
        }
    }

    /**
     * 设置是否被选中
     */
    setSelected(selected: boolean) {
        this.ndSelect.active = selected;
    }

    /**
     * 设置解锁状态 (通过颜色区分：已解锁正常，未解锁变灰)
     */
    setUnlocked(unlocked: boolean) {
        if (this.ndSpine) {
            this.ndSpine.color = unlocked ? new Color(255, 255, 255) : new Color(100, 100, 100);
        }
    }
    
}