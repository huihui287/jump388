import { _decorator, Node, v3, UITransform, instantiate, Vec3, tween, Tween, Prefab, Vec2, Sprite, ParticleSystem2D, Quat, isValid, ProgressBar, Label, Layout } from 'cc';
// 如果 enumConst.ts 已改名或迁移，请根据实际路径调整
// 例如：'../../const/EnumConst' 或 '../../const/Enum'
//import { Advertise } from '../../wx/advertise';//广告

import { BaseNodeCom } from './BaseNodeCom';

import { App } from '../Controller/app';

import { EventName } from '../Tools/eventName';
import {  GameState } from '../Tools/enumConst';
import AudioManager from '../Common/AudioManager';
import EventManager from '../Common/view/EventManager';
import GameData from '../Common/GameData';


const { ccclass, property } = _decorator;

/**
 * 游戏主逻辑类
 * 负责处理游戏核心机制，包括水果消除、水果下落、游戏状态管理等
 * @description 游戏主控制器，管理游戏的整个生命周期
 */
@ccclass('Game')
export class Game extends BaseNodeCom {
    /*********************************************  游戏核心组件  *********************************************/
    /*********************************************  游戏核心组件  *********************************************/
    /*********************************************  游戏核心组件  *********************************************/

    /*********************************************  UI引用  *********************************************/
    /*********************************************  UI引用  *********************************************/
    /*********************************************  UI引用  *********************************************/


    /** 游戏状态 */
    private gameState: GameState = GameState.PLAYING;

   
    onDestroy(): void {
        App.gameCtr.setPause(false);

        // 清除所有事件监听
        EventManager.off(EventName.Game.TouchStart, this.evtTouchStart, this);
        EventManager.off(EventName.Game.TouchMove, this.evtTouchMove, this);
        EventManager.off(EventName.Game.TouchEnd, this.evtTouchEnd, this);
        EventManager.off(EventName.Game.NextLevel, this.evtNextLevel, this);
        EventManager.off(EventName.Game.ContinueGame, this.evtContinueGame, this);
        EventManager.off(EventName.Game.Pause, this.evtPause, this);
        EventManager.off(EventName.Game.Resume, this.evtResume, this);

    }
    /**
     * 组件加载时调用
     * 初始化UI引用、绑定事件、加载游戏数据
     * @description 游戏启动时的初始化方法，设置游戏状态和加载必要资源
     */
    onLoad() {
        // 调用父类的onLoad方法
        super.onLoad();
        // 播放背景音乐
        AudioManager.getInstance().playMusic('background1', true);

        // 初始化UI引用 - 获取各种游戏组件和UI元素的引用

        // this.DownGridMgr = this.viewList.get('center/DownGridManager').getComponent(DownGridManager);
        // this.particleManager = this.viewList.get('center/ParticleManager').getComponent(ParticleManager);
        
        // 设置初始关卡并加载数据 - 从第一关开始
        // if (DEV) {
        //     LevelConfig.setCurLevel(1);
        // }
        //  LevelConfig.setCurLevel(1);

        this.loadExtraData(GameData.getCurLevel());
        // 添加事件监听器
        this.addEvents();
    }
    
    /**
     * 新手引导入口
     * 用于在进入关卡后决定是否开启教学流程或展示操作提示
     * 说明：
     * - 新玩家：立即给出一次提示，引导玩家如何操作
     * - 非新玩家：延时展示“操作提示”逻辑（handleTimePro）
     */
    Guide() {
        try {
            let isnew = GameData.isNewPlayer();
            if (isnew == 0) {

                GameData.addGold(100);
                // 新玩家：直接触发一次提示和手势教学，引导基础操作


            } else {
                // 老玩家：保持原逻辑，3 秒后开始“不操作提示”计时
            }
        } catch (error) {
            console.error("Guide error:", error);
        }
    }



    /**
     * 添加事件监听器
     * 注册游戏中需要监听的各种事件
     * @description 注册游戏事件监听器，包括触摸事件、游戏状态事件等
     */
    addEvents() { 
        // 触摸事件
        EventManager.on(EventName.Game.TouchStart, this.evtTouchStart, this);
        EventManager.on(EventName.Game.TouchMove, this.evtTouchMove, this);
        EventManager.on(EventName.Game.TouchEnd, this.evtTouchEnd, this);

        /** 下一关消息 */
        EventManager.on(EventName.Game.NextLevel, this.evtNextLevel, this);
        /** 看完视频接收继续游戏消息 */
        EventManager.on(EventName.Game.ContinueGame, this.evtContinueGame, this);

        /** 暂停游戏 */
        EventManager.on(EventName.Game.Pause, this.evtPause, this);
        /** 恢复游戏 */
        EventManager.on(EventName.Game.Resume, this.evtResume, this);
    
    }
    evtPause() {
    
        App.gameCtr.setPause(true);
        // throw new Error('Method not implemented.');
    }
    evtResume() {
   
        App.gameCtr.setPause(false);
        // throw new Error('Method not implemented.');
    }


    
    /**
     * 加载关卡额外数据
     * 加载关卡配置数据并初始化游戏状态
     * @param {number} lv - 关卡编号
     * @returns {Promise<void>} 异步操作，完成后加载关卡数据
     */
    async loadExtraData(lv: number) {

    }
    /*********************************************  UI information *********************************************/
    /*********************************************  UI information *********************************************/
    /*********************************************  UI information *********************************************/


    

    /**
     * 设置关卡信息
     * 初始化目标消除数量、道具信息和血量
     * @description 根据关卡配置初始化游戏目标、道具数量和血量显示
     */
    setLevelInfo() {

    }





    /**
     * 每帧更新
     * 检查水果水果位置并显示警告
     * @param {number} dt - 时间间隔
     * @description 实时检查水果水果的位置，当水果过低时显示警告
     */
    protected update(dt: number): void {
        if (App.gameCtr.isPause) return;

    }






    /**
     * 过关，处理奖励炸弹
     * 进入下一关并发放奖励
     * @returns {Promise<void>} 异步操作，完成后进入下一关
     */
    async evtNextLevel() {
        // 恢复游戏
        EventManager.emit(EventName.Game.Resume);
        // 加载下一关
        this.loadExtraData(GameData.nextLevel());
        
    }




    /**
     * 继续游戏
     * 恢复游戏状态并继续水果下落
     * @description 当玩家观看视频后，恢复游戏状态并继续游戏
     */
    evtContinueGame() {
        // 重置游戏状态

        this.gameState = GameState.PLAYING; // 重置游戏状态为播放中

    }


    /**
     * 处理游戏失败事件
     * 处理游戏结束逻辑并显示失败界面
     * @description 当玩家血量为0时，触发游戏结束逻辑
     */
    GameOver() {

    }


    /*********************************************  gameLogic *********************************************/
    /*********************************************  gameLogic *********************************************/
    /*********************************************  gameLogic *********************************************/
    /**
     * 触控事件（开始）
     * 处理玩家开始触摸的逻辑
     * @param {Vec2} p - 触摸位置
     * @returns {Promise<void>} 异步操作，处理触摸开始逻辑
     */
    async evtTouchStart(p: Vec2) {
        if (App.gameCtr.isPause) return;
        // 2024-01-20: 游戏结束等待期间禁止操作


        // await this.checkMoveDown();
    }
    /**
     * 触控事件（滑动）
     * 处理玩家滑动的逻辑
     * @param {Vec2} p - 触摸位置
     */
    evtTouchMove(p: Vec2) {
        if (App.gameCtr.isPause) return;

    }
    /**
     * 触控事件（结束）
     * 处理玩家触摸结束的逻辑
     * @param {Vec2} p - 触摸位置
     * @returns {Promise<void>} 异步操作，处理触摸结束逻辑
     */
    async evtTouchEnd(p: Vec2) {
        if (App.gameCtr.isPause) return;

    }
}
