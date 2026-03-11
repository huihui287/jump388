import { _decorator, Component, Node } from 'cc';
import BaseDialog from '../../Common/view/BaseDialog';
import { SkinManager } from '../Skin/SkinManager';
import { HeroType } from '../../Tools/enumHero';
const { ccclass, property } = _decorator;

@ccclass('UIMgr')
export class UIMgr extends BaseDialog {

    // 滑板蛙技能按钮
    SkatingFrogSkillBtn: Node = null;

    start() {
        this.showSkatingFrogSkillBtn();
    }

    onLoad() {
       super.onLoad();
        this.SkatingFrogSkillBtn = this.viewList.get('SkatingFrogSkillBtn');
    }
    update(deltaTime: number) {
        
    }

    /**
     * 显示滑板蛙技能按钮
     */
    showSkatingFrogSkillBtn() {
        const skinId = SkinManager.getInstance().getCurrentSkinId();
        this.SkatingFrogSkillBtn.active = skinId === HeroType.SkatingFrog;
    }
    /**
     * 隐藏滑板蛙技能按钮
     */
    hideSkatingFrogSkillBtn() {
        this.SkatingFrogSkillBtn.active = false;
    }
    /**
     * 点击滑板蛙技能按钮
     */
    onClick_SkatingFrogSkillBtn() {
        // 播放点击音效
        // this.playClickSound();
        // 隐藏技能按钮
        this.hideSkatingFrogSkillBtn();
    }
}


