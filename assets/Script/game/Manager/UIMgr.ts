import { _decorator, Component, Node, Label } from 'cc';
import BaseDialog from '../../Common/view/BaseDialog';
import { App } from '../../Controller/app';
import { SkinManager } from '../Skin/SkinManager';
import { HeroType } from '../../Tools/enumHero';
import EventManager from '../../Common/view/EventManager';
import { EventName } from '../../Tools/eventName';
const { ccclass, property } = _decorator;

@ccclass('UIMgr')
export class UIMgr extends BaseDialog {

    // 溜冰蛙技能按钮
    SkatingFrogSkillBtn: Node = null;

        // 忍者蛙技能按钮
    NinjaFrogSkillBtn: Node = null;

     // 溜冰蛙技能按钮冷却时间标签可以成为公用的，忍者蛙也可以使用
    cdLabel: Node = null;

    private _cdTime: number = 0;

    start() {
        this.showSkatingFrogSkillBtn();
        this.showNinjaFrogSkillBtn();
        // 注册事件
        EventManager.on(EventName.Game.SkillCDStart, this.onSkillCDStart, this);
    }

     /**
     * 显示忍者蛙技能按钮
     */
    showNinjaFrogSkillBtn() {
        const skinId = SkinManager.getInstance().getCurrentSkinId();
        if (skinId === HeroType.NinjaFrog) {
            this.NinjaFrogSkillBtn.active = true;
        } else {
            this.NinjaFrogSkillBtn.active = false;
        }
    }

     onDestroy(): void {
        super.onDestroy();
        EventManager.off(EventName.Game.SkillCDStart, this.onSkillCDStart, this);
        // 如果 BaseDialog 有 onDestroy，需要调用 super.onDestroy()，但这里不确定，暂时不调用
    }

    onLoad() {
       super.onLoad();
        this.SkatingFrogSkillBtn = this.viewList.get('SkatingFrogSkillBtn');
        this.NinjaFrogSkillBtn = this.viewList.get('NinjaFrogSkillBtn');
        this.cdLabel = this.viewList.get('SkatingFrogSkillBtn/cd');
        if (this.cdLabel) {
            this.cdLabel.active = false;
        }
    }
    update(deltaTime: number) {
        if (this._cdTime > 0) {
            // 如果游戏暂停，不减少CD？通常CD是真实时间还是游戏时间？
            // Hero.ts 里使用了 deltaTime，并且有 App.gameCtr.isPause 检查
            if (App.gameCtr.isPause) return;

            this._cdTime -= deltaTime;
            if (this._cdTime <= 0) {
                this._cdTime = 0;
                if (this.cdLabel) this.cdLabel.active = false;
            } else {
                if (this.cdLabel) {
                    this.cdLabel.active = true;
                    const label = this.cdLabel.getComponent(Label);
                    if (label) {
                        label.string = Math.ceil(this._cdTime).toString();
                    }
                }
            }
        }
    }

    onSkillCDStart(duration: number) {
        if (duration > 0) {
            this._cdTime = duration;
            if (this.cdLabel) {
                this.cdLabel.active = true;
                const label = this.cdLabel.getComponent(Label);
                if (label) {
                    label.string = Math.ceil(this._cdTime).toString();
                }
            }
        } else {
            this._cdTime = 0;
            if (this.cdLabel) this.cdLabel.active = false;
        }
    }

    /**
     * 显示溜冰蛙技能按钮
     */
    showSkatingFrogSkillBtn() {
        const skinId = SkinManager.getInstance().getCurrentSkinId();
        this.SkatingFrogSkillBtn.active = skinId === HeroType.SkatingFrog;
    }
    /**
     * 隐藏溜冰蛙技能按钮
     */
    hideSkatingFrogSkillBtn() {
        this.SkatingFrogSkillBtn.active = false;
    }
    /**
     * 点击溜冰蛙技能按钮
     */
    onClick_SkatingFrogSkillBtn() {
        // 播放点击音效
        // this.playClickSound();
        
        // 触发技能
        EventManager.emit(EventName.Game.UseSkill);
        
        // 隐藏技能按钮
        // this.hideSkatingFrogSkillBtn();
    }
}


