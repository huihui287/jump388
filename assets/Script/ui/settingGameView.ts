import { _decorator, Node, tween, v3 } from 'cc';

import { App } from '../Controller/app';
import { LevelConfig } from '../Tools/levelConfig';
import { gridCmpt } from '../game/item/gridCmpt';

import { EventName } from '../Tools/eventName';
import CM from '../channel/CM';
import ChannelDB from '../channel/ChannelDB';
import BaseDialog from '../Common/view/BaseDialog';
import AudioManager from '../Common/AudioManager';
import EventManager from '../Common/view/EventManager';
import GameData from '../Common/GameData';
const { ccclass, property } = _decorator;

@ccclass('settingGameView')
export class settingGameView extends BaseDialog {

    btnSoundON: Node = null;
    btnSoundOFF: Node = null;
    btnMusicON: Node = null;
    btnMusicOFF: Node = null;

    onLoad() {
        super.onLoad();
        this.btnSoundON = this.viewList.get('animNode/content/btnSound/on');
        this.btnSoundOFF = this.viewList.get('animNode/content/btnSound/off');
        this.btnMusicON = this.viewList.get('animNode/content/btnMusic/on');
        this.btnMusicOFF = this.viewList.get('animNode/content/btnMusic/off');
        // 初始化音效和音乐状态
        const soundOn = GameData.loadData(GameData.SoundOn, true);
        const musicOn = GameData.loadData(GameData.MusicOn, true);
        
        this.setSoundStatus(soundOn);
        this.setMusicStatus(musicOn);

        // 同步AudioManager的状态
        AudioManager.getInstance().soundOn = soundOn;
        AudioManager.getInstance().musicOn = musicOn;
    }

    /**
     * 点击音效按钮
     * 切换音效开启/关闭状态
     */
    onClick_btnSound() {
        AudioManager.getInstance().playSound('button_click');
        const isOn = !GameData.loadData(GameData.SoundOn, true);
        GameData.saveData(GameData.SoundOn, isOn);
        // 更新AudioManager中的音效状态
        AudioManager.getInstance().soundOn = isOn;
        this.setSoundStatus(isOn);
    }

    /**
     * 点击音乐按钮
     * 切换背景音乐开启/关闭状态
     */
    onClick_btnMusic() {
        AudioManager.getInstance().playSound('button_click');
        const isOn = !GameData.loadData(GameData.MusicOn, true);
        GameData.saveData(GameData.MusicOn, isOn);
        // 更新AudioManager中的音乐状态
        AudioManager.getInstance().musicOn = isOn;
        this.setMusicStatus(isOn);
    }

    setSoundStatus(isOn: boolean) {
        this.btnSoundON.active = isOn;
        this.btnSoundOFF.active = !isOn;
    }

    setMusicStatus(isOn: boolean) {
        this.btnMusicON.active = isOn;
        this.btnMusicOFF.active = !isOn;
    }

    onClick_closeBtn() {
        AudioManager.getInstance().playSound('button_click');
        this.dismiss();
    }
    onClick_homeBtn() {
        AudioManager.getInstance().playSound('button_click');
        App.backStart();
    }

    onClick_ProceedBtn() {
        AudioManager.getInstance().playSound('button_click');
        App.gameCtr.setPause(false);
        this.dismiss();
    }

}
