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

    // 高达蛙技能按钮
    GundamFrogSkillBtn: Node = null;

    // 流星化技能按钮
    MeteorFrogSkillBtn: Node = null;

    // 流星化技能按钮冷却时间标签可以成为公用的，忍者蛙也可以使用
    cdLabel: Node = null;

    private _cdTime: number = 0;

    // 记录最大充能
    private _maxMeteorCharge: number = 30;

    start() {
        this.refreshSkillBtn();
        // 注册事件
        EventManager.on(EventName.Game.SkillCDStart, this.onSkillCDStart, this);
        EventManager.on(EventName.Game.UpdateSkillCharge, this.onUpdateSkillCharge, this);
    }

    /**
     * 刷新技能按钮显示及 CD Label 引用
     */
    private refreshSkillBtn() {
        const skinId = SkinManager.getInstance().getCurrentSkinId();
        
        // 根据英雄类型显示/隐藏按钮
        if (this.SkatingFrogSkillBtn) {
            this.SkatingFrogSkillBtn.active = skinId === HeroType.SkatingFrog;
        }
        if (this.NinjaFrogSkillBtn) {
            this.NinjaFrogSkillBtn.active = skinId === HeroType.NinjaFrog;
        }
        if (this.GundamFrogSkillBtn) {
            this.GundamFrogSkillBtn.active = skinId === HeroType.GundamFrog;
        }
        if (this.MeteorFrogSkillBtn) {
            this.MeteorFrogSkillBtn.active = skinId === HeroType.MeteorFrog;
        }
        
        // 动态获取当前英雄对应的 CD Label
        this.cdLabel = null;
        if (skinId === HeroType.NinjaFrog) {
            this.cdLabel = this.viewList.get('NinjaFrogSkillBtn/cd');
        } else if (skinId === HeroType.GundamFrog) {
            this.cdLabel = this.viewList.get('GundamFrogSkillBtn/cd');
        } else if (skinId === HeroType.SkatingFrog) {
            this.cdLabel = this.viewList.get('SkatingFrogSkillBtn/cd');
        }
        else if (skinId === HeroType.MeteorFrog) {
            this.cdLabel = this.viewList.get('MeteorFrogSkillBtn/cd');
        }


        // 初始化隐藏
        if (this.cdLabel && this._cdTime <= 0) {
            this.cdLabel.active = false;
        }
    }

    onLoad() {
       super.onLoad();
        this.SkatingFrogSkillBtn = this.viewList.get('SkatingFrogSkillBtn');
        this.NinjaFrogSkillBtn = this.viewList.get('NinjaFrogSkillBtn');
        this.GundamFrogSkillBtn = this.viewList.get('GundamFrogSkillBtn');
        this.MeteorFrogSkillBtn = this.viewList.get('MeteorFrogSkillBtn');
    }

    /**
     * 显示忍者蛙技能按钮 (保留方法名供外部调用，但内部逻辑统一)
     */
    showNinjaFrogSkillBtn() {
        this.refreshSkillBtn();
    }

    /**
     * 显示溜冰蛙技能按钮 (保留方法名供外部调用，但内部逻辑统一)
     */
    showSkatingFrogSkillBtn() {
        this.refreshSkillBtn();
    }

    onDestroy(): void {
        super.onDestroy();
        EventManager.off(EventName.Game.SkillCDStart, this.onSkillCDStart, this);
        EventManager.off(EventName.Game.UpdateSkillCharge, this.onUpdateSkillCharge, this);
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
            if (this.cdLabel) {
                // 如果是流星蛙，不应该隐藏，而是显示充能状态？
                // 但流星蛙不使用 CDStart，而是 UpdateSkillCharge
                // 对于其他英雄，CD结束隐藏Label
                const skinId = SkinManager.getInstance().getCurrentSkinId();
                if (skinId !== HeroType.MeteorFrog) {
                    this.cdLabel.active = false;
                }
            }
        }
    }

    onUpdateSkillCharge(current: number, max: number) {
        // 只有流星蛙使用此逻辑
        const skinId = SkinManager.getInstance().getCurrentSkinId();
        if (skinId !== HeroType.MeteorFrog) return;
        
        // 更新最大值
        if (max > 0) this._maxMeteorCharge = max;

        if (this.cdLabel) {
            this.cdLabel.active = true;
            const label = this.cdLabel.getComponent(Label);
            if (label) {
                if (current >= this._maxMeteorCharge) {
                    label.string = "MAX";
                } else {
                    label.string = `${current}/${this._maxMeteorCharge}`;
                }
            }
        }
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

    /**
     * 点击高达蛙技能按钮
     */
    onClick_GundamFrogSkillBtn() {
        // 触发技能
        EventManager.emit(EventName.Game.UseSkill);
    }

    /**
     * 点击流星蛙技能按钮
     */
    onClick_MeteorFrogSkillBtn() {
        EventManager.emit(EventName.Game.UseSkill);
    }
}


