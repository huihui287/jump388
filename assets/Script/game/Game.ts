import { _decorator, Node, Vec2, instantiate, Prefab, tween, Vec3, easing, UITransform } from 'cc';
// 如果 enumConst.ts 已改名或迁移，请根据实际路径调整
// 例如：'../../const/EnumConst' 或 '../../const/Enum'
//import { Advertise } from '../../wx/advertise';//广告

import { BaseNodeCom } from './BaseNodeCom';

import { App } from '../Controller/app';

import { EventName } from '../Tools/eventName';
import {  GameState, Constant } from '../Tools/enumConst';
import AudioManager from '../Common/AudioManager';
import EventManager from '../Common/view/EventManager';
import GameData from '../Common/GameData';
// import { JoystickControl } from './JoystickControl';
import { Hero } from './Hero';
import { CameraManager } from './CameraManager';
import { pedalManager } from './Manager/pedalManager';
import { Pedal } from './Pedal/Pedal';
import ViewManager from '../Common/view/ViewManager';
import { getSkinConfig } from './Skin/SkinConfig';
import LoaderManeger from '../sysloader/LoaderManeger';
import { MoveManager } from './Manager/MoveManager';
import { PedalSkill } from '../Tools/enumPedal';

const { ccclass, property } = _decorator;

/**
 * 游戏主逻辑类
 * 负责处理游戏核心机制，包括水果消除、水果下落、游戏状态管理等
 * @description 游戏主控制器，管理游戏的整个生命周期
 */
@ccclass('Game')
export class Game extends BaseNodeCom {
    /*********************************************  游戏核心组件  *********************************************/
    /** Hero组件 */
    heroCom: Hero = null!;
    /** 踏板管理组件 */
    pedalManagerCom: pedalManager = null!;  

    /** 相机管理组件 */
    @property(CameraManager)
    cameraCom: CameraManager = null!;
    /*********************************************  游戏核心组件  *********************************************/

    /** 游戏状态 */
    private gameState: GameState = GameState.PLAYING;
   
    /*********************************************  ui  *********************************************/
    /** 玩家金币 */
    @property({ type: Node })
    ndSelfGold: Node = null!;

    /**MoveNodeMGR */
    @property({ type: Node })
    MoveNodeMGR: Node = null!;

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
        EventManager.off(EventName.Game.GameOver, this.GameOver, this);
        EventManager.off(EventName.Game.RestartGame, this.evtRestartGame, this);
        EventManager.off(EventName.Game.HitSpike, this.onHitSpike, this);
        EventManager.off(EventName.Game.GetGold, this.onGetGold, this);

    }
    /**
     * 组件加载时调用
     * 初始化UI引用、绑定事件、加载游戏数据
     * @description 游戏启动时的初始化方法，设置游戏状态和加载必要资源
     */
    async onLoad() {
        // 调用父类的onLoad方法
        super.onLoad();
        // 播放背景音乐
        AudioManager.getInstance().playMusic('background1', true);

        this.initHero();
        await this.initpedalManagerCom();

        this.setCameraTarget();
        this.loadExtraData(GameData.getCurLevel());
        // 添加事件监听器
        this.addEvents();
        
    }
    
    /**
     * 初始化Hero组件
     * @description 初始化游戏主角Hero组件，设置其初始状态和属性
     */
    initHero() {
        // 初始化UI引用 - 获取各种游戏组件和UI元素的引用
        this.heroCom = this.viewList.get('center/Hero').getComponent(Hero);
        this.setHeroSkin();
    }
    
    // 初始化踏板管理组件
    async initpedalManagerCom() {
        this.pedalManagerCom = this.viewList.get('center/pedalManager').getComponent(pedalManager);
        this.pedalManagerCom.setHero(this.heroCom.node);
        await this.pedalManagerCom.loadtPools();
        await this.pedalManagerCom.loadPedalConfig();
    }
    /**
     * 设置相机目标
     * @description 设置相机跟随的目标节点，包括偏移量和跟随速度
     */
    setCameraTarget() {
        this.cameraCom.setTarget(this.heroCom.node);
        // this.cameraCom.setOffset(v3(0, 0, -1000));
        // this.cameraCom.setFollowSpeed(10);
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
        /** 重新开始游戏 */
        EventManager.on(EventName.Game.RestartGame, this.evtRestartGame, this);
        /** 游戏结束 */
        EventManager.on(EventName.Game.GameOver, this.GameOver, this);
        /** 触发尖刺 */
        EventManager.on(EventName.Game.HitSpike, this.onHitSpike, this);
        /** 获得金币 */
        EventManager.on(EventName.Game.GetGold, this.onGetGold, this);
    }

    /**
     * 触发尖刺事件
     * 处理玩家与尖刺的碰撞逻辑
     * @description 当玩家与尖刺碰撞时触发，判断是否有护盾消耗，无护盾则游戏结束
     */
    onHitSpike() {
        if (!this.heroCom) return;

        // 2. 检查护盾
        if (this.heroCom.consumeShield()) {
            console.log("Shield blocked spike damage!");
            return;
        }

        // 3. 检查是否在忍者蛙被动范围内（距离踏板一定范围内触发清除）
        // 这个逻辑通常在 update 中实时检测，而不是在 HitSpike 中检测
        // 因为 HitSpike 意味着已经“踩中”了，通常意味着死亡（除非有护盾或免疫）
        // 但用户的需求是：在与pedal上的Pedal.SPIKE的情况下触发 Hero一定距离内触发，移除pedal上的 SPIKE 然后可以正常踩中跳跃 有cd
        
        // 我们在 checkHeroPedalCollision 中处理这个逻辑
        
        this.GameOver();
    }

    private onGetGold(pedalNode: Node) {
        if (!pedalNode) return;

        // 加载金币飞行预制体
        LoaderManeger.instance.loadPrefab('prefab/item/flyGold').then((prefab: Prefab) => {
            const goldCount = 10;
            const baseDuration = 0.8;
            const totalGold = this.pedalManagerCom.getPedalGold ? this.pedalManagerCom.getPedalGold() : 100;
            const perGold = Math.floor(totalGold / goldCount);
            const remainderGold = totalGold - perGold * goldCount;

            // 获取踏板的世界坐标作为基础起始点
            const baseStartWorldPos = pedalNode.worldPosition.clone();
            // 基础目标位置（Hero）在动画开始时获取一次引用即可，动画中会实时获取最新位置
            const targetNode = this.heroCom.node.children[0];

            // 循环生成多个金币
            for (let i = 0; i < goldCount; i++) {
                const flyGold = instantiate(prefab);
                
                // 将金币添加到 Hero 的父节点 (center)，确保它们在同一个坐标系下
                const parentNode = this.heroCom.node.parent;
                if (!parentNode) {
                    this.node.addChild(flyGold); // Fallback
                } else {
                    parentNode.addChild(flyGold);
                }
                
                // 设置图层与 Hero 一致
                flyGold.layer = this.heroCom.node.layer;

                // 计算随机偏移起始位置 (X: 0-50, Y: 0-50)
                // 注意：这里是在世界坐标系下偏移，还是在本地坐标系下偏移？
                // 通常在世界坐标系下偏移比较直观
                const offsetX = (Math.random()) * 100; 
                const offsetY = (Math.random()) * 100;
                
                // 也可以考虑负向偏移，使其围绕中心生成：(Math.random() - 0.5) * 50
                // 按照需求描述 "0-50"，则直接加
                const startWorldPos = baseStartWorldPos.clone();
                startWorldPos.x += offsetX;
                startWorldPos.y += offsetY;
                
                // 设置初始位置
                // 注意：由于 flyItemToTarget 内部会强制重置位置为 pedalNode 的位置，
                // 我们需要修改 flyItemToTarget 或者在这里创建一个临时的虚拟节点作为起始点
                // 方案一：修改 flyItemToTarget 支持 Vec3 作为起始点 (推荐)
                // 方案二：创建临时节点 (繁琐)
                // 鉴于 MoveManager 是单例且 flyItemToTarget 刚改过，我们再次微调 MoveManager 
                // 或者，我们利用 flyItemToTarget 的特性：它使用 startNode.worldPosition 作为起始点
                // 我们可以创建一个临时的 Node，设置好偏移后的坐标，传给 flyItemToTarget
                
                // 计算随机飞行时间 (0-0.2 的偏差)
                const durationOffset = Math.random() * 0.2;
                const duration = baseDuration + durationOffset;

                const tempStartNode = new Node();
                tempStartNode.setWorldPosition(startWorldPos);
                
                // 使用 MoveManager 的新版 flyItemToTarget 方法
                MoveManager.getInstance().flyItemToTarget(flyGold, tempStartNode, targetNode, duration, () => {
                    const addAmount = perGold + (i === goldCount - 1 ? remainderGold : 0);
                    GameData.addGold(addAmount); 
                    flyGold.destroy();
                    // 销毁临时节点
                    tempStartNode.destroy();

                    if (Math.random() > 0.5) { 
                      //  AudioManager.getInstance().playSound('gold');
                    }
                });
            }
        });
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
     * 设置英雄皮肤
     * 根据当前皮肤配置更新英雄的外观
     * @description 根据当前游戏皮肤配置，更新英雄的模型、颜色等外观属性
     */
    setHeroSkin() {
        this.heroCom.setSkin();
    }
    /**
     * 每帧更新
     * 检查水果水果位置并显示警告
     * @param {number} dt - 时间间隔
     * @description 实时检查水果水果的位置，当水果过低时显示警告
     */
    protected update(dt: number): void {
        if (App.gameCtr.isPause || this.gameState !== GameState.PLAYING) return;

        this.checkHeroPedalCollision();
        this.checkHeroFallDeath();
        this.checkGameWin();
    }

    /**
     * 检查游戏胜利条件
     */
    private checkGameWin(): void {
        if (!this.heroCom || !this.pedalManagerCom) return;

        // 必须所有踏板生成完毕
        if (!this.pedalManagerCom.isFinished()) return;

        const lastPedal = this.pedalManagerCom.getLastPedal();
        
        // 如果没有活跃踏板了，说明都回收了，且 Hero 还在（没死），则判定胜利
        if (!lastPedal) {
             this.GameWin();
             return;
        }

        const heroY = this.heroCom.node.worldPosition.y;
        const lastPedalY = lastPedal.worldPosition.y;

        // 只要超过最后一个踏板一定距离，就赢了
        if (heroY > lastPedalY + 50) {
            this.GameWin();
        }
    }

    /**
     * 游戏胜利逻辑
     */
    GameWin() {
        if (this.gameState === GameState.WIN) return;
        this.gameState = GameState.WIN;
        console.log('GameWin!');
        
        // 暂停游戏逻辑更新
        App.gameCtr.setPause(true);
        
        // 显示结算界面
        const baseGold = this.pedalManagerCom.getGoldReward();
        const finalGold = this.heroCom ? this.heroCom.applySettlementGoldBonus(baseGold) : baseGold;
        ViewManager.showGameWinView({
            goldReward: finalGold
        });
        
    }

    /**
     * 检查Hero是否掉出屏幕下方
     */
    private checkHeroFallDeath(): void {
        if (!this.heroCom) return;

        const heroNode = this.heroCom.node;
        const heroPos = heroNode.worldPosition; // 使用世界坐标
        const halfScreenHeight = Constant.Height / 2;

        // 获取最底部的踏板
        const lowestPedal = this.pedalManagerCom.getLowestPedal();
        
        let deathY = -halfScreenHeight - 100; // 默认死亡线：屏幕下方

        if (lowestPedal) {
            // 如果有踏板，死亡线设为最低踏板下方一定距离
            // 只要 Hero 掉得比最低踏板还低，且不可挽回，就结束游戏
            // 比如低于最低踏板 200 像素
            deathY = lowestPedal.worldPosition.y - 200;
        } else {
             // 如果没有踏板（可能是还没生成，或者全被回收了），使用摄像机下方作为死亡线
             // 获取摄像机位置
             const cameraPos = this.cameraCom.node.worldPosition;
             deathY = cameraPos.y - halfScreenHeight - 100;
        }

        // 如果Hero的Y坐标小于死亡线
        if (heroPos.y < deathY) {
            console.log('Hero掉出边界（低于最低踏板或屏幕），游戏结束');
            this.GameOver();
        }
    }

    /**
     * 检查Hero与踏板的碰撞
     */
    private checkHeroPedalCollision(): void {
        if (!this.heroCom || !this.pedalManagerCom) return;

        // 忍者蛙被动技能检测：检测周围是否有尖刺踏板
        // 只有当拥有忍者蛙被动，且技能不在冷却中
        if (this.heroCom.hasPassiveDestroyTrap() && this.heroCom.getSkillCD() <= 0) {
            // 获取技能范围
            const range = this.heroCom.getPassiveSkillRange();
            // 获取附近的踏板
            const nearbyPedal = this.pedalManagerCom.getNearbyPedal(this.heroCom.node, range); 
            if (nearbyPedal) {
                const pedalComponent = nearbyPedal.getComponent(Pedal);
                // 必须是带有 SPIKE 技能的踏板
                if (pedalComponent && pedalComponent.skills.indexOf(PedalSkill.SPIKE) !== -1) {
                    // 移除 SPIKE 技能
                    pedalComponent.removeSkill(PedalSkill.SPIKE);
                    console.log("Ninja Frog Passive Triggered: Spike Removed!");
                    ViewManager.toast("忍术：陷阱清除！");
                    
                    // 触发技能冷却
                    this.heroCom.triggerPassiveSkillCD(); 
                }
            }
        }

        // 只有当Hero处于下落状态时才进行检测
        if (!this.heroCom.isFalling()) return;

        const heroNode = this.heroCom.node;
        // 获取最佳碰撞踏板
        const bestPedal = this.pedalManagerCom.getCollisionPedal(heroNode);

        if (bestPedal) {
            const pedalComponent = bestPedal.getComponent(Pedal);
            if (pedalComponent) {
                this.heroCom.setGrounded(true, pedalComponent);
                pedalComponent.releaseSkill();
                this.heroCom.performJump(pedalComponent);
                
            }
        }
    }

    /**
     * 过关，处理奖励炸弹
     * 进入下一关并发放奖励
     * @returns {Promise<void>} 异步操作，完成后进入下一关
     */
    async evtNextLevel() {
        console.log('Loading next level...');
        
        // 1. 获取下一关关卡号
        const nextLv = GameData.nextLevel();
        console.log(`Next Level: ${nextLv}`);

        // 保持暂停状态，直到初始化完成
        App.gameCtr.setPause(true);

        // 2. 清理并重新初始化踏板
        if (this.pedalManagerCom) {
            this.pedalManagerCom.init();
            // 加载新关卡的配置
            await this.pedalManagerCom.loadPedalConfig();
        }

        // 3. 重置 Hero
        if (this.heroCom) {
            this.heroCom.reset();
        }

        // 4. 重置摄像机
        if (this.cameraCom) {
            this.cameraCom.setTarget(this.heroCom.node);
            this.cameraCom.node.setPosition(0, 0, this.cameraCom.node.position.z);
        }

        // 5. 加载关卡额外数据（如果需要）
        await this.loadExtraData(nextLv);

        // 6. 更新 UI (例如关卡显示)
        this.setLevelInfo();

        // 7. 重置游戏状态并开始
        this.gameState = GameState.PLAYING;
        App.gameCtr.setPause(false);

        // 8. 恢复游戏逻辑
        EventManager.emit(EventName.Game.Resume);

        // 9. 播放背景音乐
        AudioManager.getInstance().playMusic('background1', true);
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
        if (this.gameState === GameState.GAME_OVER) return;
        this.gameState = GameState.GAME_OVER;
        console.log('GameOver logic called');
        // 这里可以弹出结算界面，如 ViewManager.showView(ViewName.GameOver)
        const baseWinReward = this.pedalManagerCom.getGoldReward();
        const currentLayer = this.heroCom.getHerolayerS();
        const totalLayer = this.pedalManagerCom.getAlllayerNum();
        let baseReward = 0;
        if (totalLayer > 0) {
            baseReward = Math.floor((currentLayer / totalLayer) * (baseWinReward || 1000));
        }
        const finalGoldReward = this.heroCom ? this.heroCom.applySettlementGoldBonus(baseReward) : baseReward;
        ViewManager.showGameOver({
            currentLayer,
            totalLayer,
            goldReward: baseWinReward,
            finalGoldReward
        });
        // 暂停游戏
        EventManager.emit(EventName.Game.Pause);
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


    
    /**
     * 重新开始游戏
     */
    async evtRestartGame() {
        console.log('Restarting game...');
        
        // 1. 重置游戏状态
        this.gameState = GameState.PLAYING;
        App.gameCtr.setPause(false);
        
        // 2. 清理踏板
        if (this.pedalManagerCom) {
            this.pedalManagerCom.init();
            // 重新初始化踏板生成状态
            await this.pedalManagerCom.loadPedalConfig();
        }
        
        // 3. 重置 Hero
        if (this.heroCom) {
            this.heroCom.reset(); 
            // 如果希望开局自动跳跃，可以给 Hero 施加一个初始向上速度或状态
            // 但根据 pedalManager 逻辑，初始位置 0 会生成踏板在脚下，Hero 下落会踩中
        }
        
        // 4. 重置摄像机
        if (this.cameraCom) {
            this.cameraCom.setTarget(this.heroCom.node);
            // 可能需要重置摄像机位置到初始状态
            this.cameraCom.node.setPosition(0, 0, this.cameraCom.node.position.z);
        }
        
        // 5. 重新加载关卡数据（如果有需要）
        await this.loadExtraData(GameData.getCurLevel());

        // 7. 播放背景音乐（如果停止了）
        AudioManager.getInstance().playMusic('background1', true);
    }

}
