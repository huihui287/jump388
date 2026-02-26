import { _decorator, Node, v3, UITransform, instantiate, Vec3, tween, Tween, Prefab, Vec2, Sprite, ParticleSystem2D, Quat, isValid, ProgressBar, Label, Layout } from 'cc';
// 如果 enumConst.ts 已改名或迁移，请根据实际路径调整
// 例如：'../../const/EnumConst' 或 '../../const/Enum'
//import { Advertise } from '../../wx/advertise';//广告
import { gridCmpt } from './item/gridCmpt';
import { rocketCmpt } from './item/rocketCmpt';
import { BaseNodeCom } from './BaseNodeCom';
import { gridManagerCmpt } from './Manager/gridManagerCmpt';
import { ToolsHelper } from '../Tools/toolsHelper';
import { App } from '../Controller/app';
import { CocosHelper } from '../Tools/cocosHelper';
import { LevelConfig } from '../Tools/levelConfig';
import { EventName } from '../Tools/eventName';
import { Bomb, Constant, LevelData, PageIndex, GameState, Direction } from '../Tools/enumConst';
import AudioManager from '../Common/AudioManager';
import EventManager from '../Common/view/EventManager';
import GameData from '../Common/GameData';
import LoaderManeger from '../sysloader/LoaderManeger';
import ViewManager from '../Common/view/ViewManager';
import { DownGridManager } from './Manager/DownGridManager';
import { ParticleManager } from './Manager/ParticleManager';
import { MoveManager } from './Manager/MoveManager';
import { gridDownCmpt } from './item/gridDownCmpt';
import CM from '../channel/CM';
import { Turret } from './Manager/Turret';
import { BulletParticle } from './item/bulletParticle';
import { DEV } from 'cc/env';

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

    /** 网格管理器组件 */
    private gridMgr: gridManagerCmpt = null;
    /**下落水果管理器组件 */
    private DownGridMgr: DownGridManager = null;
    /** 特效管理器 */
    private particleManager: ParticleManager = null;
        /** 炮台管理器 */
    private turret: Turret = null;
    /*********************************************  UI引用  *********************************************/
    /*********************************************  UI引用  *********************************************/
    /*********************************************  UI引用  *********************************************/

    /** 网格容器节点 */
    private gridNode: Node = null;
    /** 特效容器节点 */
    private effNode: Node = null;
    /** UI引用：目标显示节点2（适用于3个及以上目标） */
    private target2: Node = null;
    /** UI引用：目标背景节点 */
    private targetBg: Node = null;
    /** UI引用：目标背景图片节点 */
    private target2BackTex: Node = null;
    /** UI引用：道具1数量显示节点 */
    private lbTool1: Node = null;
    /** UI引用：道具2数量显示节点 */
    private lbTool2: Node = null;
    /** UI引用：道具3数量显示节点 */
    private lbTool3: Node = null;
    /** UI引用：道具4数量显示节点 */
    private lbTool4: Node = null;
    /** UI引用：道具5数量显示节点 */
    private lbTool5: Node = null;   

    /** UI引用：道具1添加按钮 */
    private addBtn1: Node = null;
    /** UI引用：道具2添加按钮 */
    private addBtn2: Node = null;
    /** UI引用：道具3添加按钮 */
    private addBtn3: Node = null;
    /** UI引用：道具4添加按钮 */
    private addBtn4: Node = null;
    /** UI引用：道具5添加按钮 */
    private addBtn5: Node = null;
    /** UI引用：道具1视频按钮 */
    private video1: Node = null;
    /** UI引用：道具2视频按钮 */
    private video2: Node = null;
    /** UI引用：道具3视频按钮 */
    private video3: Node = null;
    /** UI引用：道具4视频按钮 */
    private video4: Node = null;
    /** UI引用：道具5视频按钮 */
    private video5: Node = null;
    /** UI引用：当前关卡显示节点 */
    private levelLb: Node = null;
    /** UI引用：教学手图片 */
    private hand: Node = null;
    /** UI引用：升级水果攻击值 */
    private upgradeFruitAttack: Node = null;
    /** 警告图片 */
    private Alert: Node = null;
    /** UI引用：血量进度条节点 */
    private spHealth: Node = null;    
    /** 预制体引用：网格水果预制体 */
    private gridPre: Prefab = null;    
    /** 预制体引用：火箭特效预制体 */
    private rocketPre: Prefab = null;

    /*********************************************  游戏状态和数据  *********************************************/
    /*********************************************  游戏状态和数据  *********************************************/
    /*********************************************  游戏状态和数据  *********************************************/

    /** 游戏网格：二维数组存储所有水果节点 */
    private blockArr: Node[][] = []
    /** 网格位置：二维数组存储所有水果的目标位置 */
    private blockPosArr: Vec3[][] = [];
    /** 隐藏列表：存储需要隐藏的网格位置 */
    private hideList = [];
    /** 网格行列数 */
    private H: number = Constant.layCount;
    /** 网格列数 */
    private V: number = Constant.layCount;
    /** 游戏状态：是否开始触摸 */
    private isStartTouch: boolean = false;
    // 2024-01-20: 游戏结束等待状态标记
    private isGameOverWaiting: boolean = false;
    // 2024-01-20: 游戏结束等待计时
    private gameOverWaitTime: number = 0;
    /** 当前选中的两个水果 */
    private curTwo: gridCmpt[] = [];
    /** 游戏状态：是否开始交换水果 */
    private isStartChange: boolean = false;
    /** 游戏状态：是否正在检查消除 */
    private isChecking: boolean = false;
    /** 游戏数据：关卡配置数据 */
    private data: LevelData = null;
    /** 游戏数据：目标消除数量数组 */
    private AchievetheGoal: any[] = [];
    /** 游戏状态：是否胜利 */
    // private isWin: boolean = false;
    /** 游戏状态：使用枚举替代 */
    private gameState: GameState = GameState.PLAYING;
    /** 奖励炸弹数据：存储生成的炸弹类型和数量 */
    private rewardBombs: {type: number, count: number}[] = [];
    /** 火箭对象池 */
    private rocketPool: Node[] = [];
    /** 火箭池容量 */
    private rocketPoolCapacity: number = 20;
    /** 玩家血量 */
    private playerHealth: number = 100;
    /** Alert闪烁动画 */
    private alertTween: Tween<Node> = null;
    /** 飞grid的对象池 */
    private flyItemPool: Node[] = [];
    /** 飞grid对象池最大容量 */
    private maxFlyItemPoolSize: number = 30;

    /**
     * 从对象池获取飞grid节点
     * @returns Node 飞grid节点或 null（如果对象池为空且达到最大容量）
     */
    private getFlyItemFromPool(): Node | null {
        let item: Node = null;
        
        // 优先从对象池获取
        if (this.flyItemPool.length > 0) {
            item = this.flyItemPool.pop();
        } 
        // 如果对象池为空且未达到最大容量，创建新节点
        else if (this.flyItemPool.length < this.maxFlyItemPoolSize) {
            item = instantiate(this.gridPre);
        }
        
        // 如果获取到节点，重置状态
        if (item) {
            item.active = true;
            item.setScale(1, 1, 1);
            item.setPosition(Vec3.ZERO);
        }
        
        return item;
    }

    /**
     * 将飞grid节点回收至对象池
     * @param item 飞grid节点
     */
    private recycleFlyItemToPool(item: Node): void {
        // 安全检查
        if (!item) {
            console.warn("recycleFlyItemToPool: item is null or undefined");
            return;
        }
        
        // 检查对象池是否已满
        if (this.flyItemPool.length >= this.maxFlyItemPoolSize) {
            // 如果对象池已满，销毁节点
            console.warn("recycleFlyItemToPool: flyItemPool is full, destroying item");
            item.destroy();
            return;
        }
        
        try {
            // 停止所有动画
            // tween.stopAllByTarget(item);
            
            // 重置节点属性
            item.active = false;
            item.setScale(1, 1, 1);
            item.setPosition(Vec3.ZERO);
            item.setRotation(Quat.IDENTITY);
            
            // 从父节点移除
            item.removeFromParent();
            
            // 添加到对象池
            this.flyItemPool.push(item);
        } catch (error) {
            console.error("recycleFlyItemToPool: error recycling item:", error);
            // 发生错误时销毁节点
            item.destroy();
        }
    }
    onDestroy(): void {
        App.gameCtr.setPause(false);
        // 清除所有定时器
        clearInterval(this.intervalTipsIndex);
        // 清除所有事件监听
        EventManager.off(EventName.Game.TouchStart, this.evtTouchStart, this);
        EventManager.off(EventName.Game.TouchMove, this.evtTouchMove, this);
        EventManager.off(EventName.Game.TouchEnd, this.evtTouchEnd, this);
        EventManager.off(EventName.Game.NextLevel, this.evtNextLevel, this);
        EventManager.off(EventName.Game.ContinueGame, this.evtContinueGame, this);
        EventManager.off(EventName.Game.Damage, this.evtDamage, this);
        EventManager.off(EventName.Game.RestartGame, this.evtRestart, this);
        EventManager.off(EventName.Game.Pause, this.evtPause, this);
        EventManager.off(EventName.Game.Resume, this.evtResume, this);
        EventManager.off(EventName.Game.RecycleRocket, this.evtRecycleRocket, this);
    }
    /**
     * 组件加载时调用
     * 初始化UI引用、绑定事件、加载游戏数据
     * @description 游戏启动时的初始化方法，设置游戏状态和加载必要资源
     */
    onLoad() {
        // 绑定按钮事件 - 为5个道具按钮绑定点击事件
        for (let i = 1; i < 6; i++) {
            this[`onClick_addBtn${i}`] = this.onClickAddButton.bind(this);
            this[`onClick_toolBtn${i}`] = this.onClickToolButton.bind(this);
            this[`onClick_video${i}`] = this.onClickVideoButton.bind(this);
        }
        // 调用父类的onLoad方法
        super.onLoad();
        // 播放背景音乐
        AudioManager.getInstance().playMusic('background1', true);

        // 初始化UI引用 - 获取各种游戏组件和UI元素的引用
        this.gridMgr = this.viewList.get('center/gridManager').getComponent(gridManagerCmpt);
        this.DownGridMgr = this.viewList.get('center/DownGridManager').getComponent(DownGridManager);
        this.particleManager = this.viewList.get('center/ParticleManager').getComponent(ParticleManager);
        this.turret = this.viewList.get('center/Turret').getComponent(Turret);

        this.gridNode = this.viewList.get('center/gridNode');
        this.effNode = this.viewList.get('center/ParticleManager');
        this.targetBg = this.viewList.get('top/content/目标');
        this.target2BackTex = this.viewList.get('top/content/目标框');

        this.target2 = this.viewList.get('top/target2');
        this.lbTool1 = this.viewList.get('bottom/proppenal/tool1/prompt/lbTool1');
        this.lbTool2 = this.viewList.get('bottom/proppenal/tool2/prompt/lbTool2');
        this.lbTool3 = this.viewList.get('bottom/proppenal/tool3/prompt/lbTool3');
        this.lbTool4 = this.viewList.get('bottom/proppenal/tool4/prompt/lbTool4');
        this.lbTool5 = this.viewList.get('bottom/proppenal/tool5/prompt/lbTool5');
        
        this.addBtn1 = this.viewList.get('bottom/proppenal/tool1/addBtn1');
        this.addBtn2 = this.viewList.get('bottom/proppenal/tool2/addBtn2');
        this.addBtn3 = this.viewList.get('bottom/proppenal/tool3/addBtn3');
        this.addBtn4 = this.viewList.get('bottom/proppenal/tool4/addBtn4');
        this.addBtn5 = this.viewList.get('bottom/proppenal/tool5/addBtn5');
        
        this.video1 = this.viewList.get('bottom/proppenal/tool1/video1');
        this.video2 = this.viewList.get('bottom/proppenal/tool2/video2');
        this.video3 = this.viewList.get('bottom/proppenal/tool3/video3');
        this.video4 = this.viewList.get('bottom/proppenal/tool4/video4');
        this.video5 = this.viewList.get('bottom/proppenal/tool5/video5');
        
        this.Alert = this.viewList.get('ui/Alert');
      
        this.spHealth = this.viewList.get('ui/spHealth');
        this.hand = this.viewList.get('ui/hand');
        this.levelLb = this.viewList.get('ui/levelLb');
        this.hand.active = false;
        
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

                let tips = this.onClick_tipsBtn(true);
                // console.log('tips', tips);
                let info = this.getTipsMoveInfo(tips);
                // console.log('info', info);
                if (info) {
                    this.playHandGuide(info.grid, info.dir);
                }

            } else {
                // 老玩家：保持原逻辑，3 秒后开始“不操作提示”计时
            }
        } catch (error) {
            console.error("Guide error:", error);
        }
    }

    /**
     * 开始下落水果水果
     * 初始化DownGridManager并开始生成下落的水果水果
     * @description 启动水果水果下落系统，创建并配置DownGridManager
     * @returns {Promise<void>} 异步操作，完成后开始生成下落水果
     */
    async startDownGrid() {
        // 初始化DownCubeManager
        try {
            // 先清理现有水果水果，避免等待预制体加载导致延迟
            this.DownGridMgr.clearAllGrids();
            
            // 异步创建网格 - 加载必要的预制体和资源
            await this.DownGridMgr.createGrid();
            // 检查预制体是否加载成功
            if (!this.DownGridMgr['gridDownPre']) {
                return;
            }

            // 配置参数 - 设置生成数量和下落速度
            this.DownGridMgr.totalGridCount = 1000;
            this.DownGridMgr.fallSpeed = 5;

            // 2026-01-22: 启动动态速度递增接口
            this.startSpeedIncrease();

            // 判断是否为新玩家第一关
            const isNewPlayer = GameData.isNewPlayer();
            const currentLevel = App.gameCtr.curLevel;

            // 新玩家第一关：一开始就生成10排，然后向下移动
            if (isNewPlayer==0 && currentLevel === 1) {
                await this.DownGridMgr.initAndStart();
            } else {
                // 老玩家或其他关卡：正常生成
                this.DownGridMgr.startGenerate();
            }
              
            // 动态调整参数（注释掉的代码，可根据需要启用）
            //   setTimeout(() => {
            //       this.DownGridMgr.setFallSpeed(200); // 加快下落速度           
            //   }, 3000);  
            //   // 暂停下落
            //   setTimeout(() => {
            //       this.DownGridMgr.pauseFall(); // 暂停所有grid的下落
            //   }, 15000);
            //   // 继续下落
            //   setTimeout(() => {
            //       this.DownGridMgr.resumeFall(); // 继续所有grid的下落
            //   }, 20000);
            //   // 停止生成
            //   setTimeout(() => {
            //       this.DownGridMgr.stopGenerate();
            //   }, 30000);
        } catch (error) {
            console.error("初始化DownCubeManager失败:", error);
        }
    }

    /**
     * 开始动态增加下落速度
     * 每10秒增加0.5，直到最大值10
     */
    startSpeedIncrease() {
        // 先停止已存在的计时器，防止重复调用
        this.unschedule(this.increaseSpeed);
        // 初始速度
        this.DownGridMgr.fallSpeed = 10;
        // 开启计时器：间隔10秒，重复执行（直到手动停止），延迟10秒后开始第一次
        this.schedule(this.increaseSpeed, 5);
    }

    /**
     * 增加速度的具体逻辑
     */
    increaseSpeed() {
        // 如果游戏暂停或结束，不增加速度
        if (this.gameState !== GameState.PLAYING) return;

        let currentSpeed = this.DownGridMgr.fallSpeed;
        if (currentSpeed < 20) {
            let newSpeed = currentSpeed + 0.3;
            // 确保不超过最大值10
            newSpeed = Math.min(newSpeed, 20);
            this.DownGridMgr.fallSpeed = newSpeed;
            // this.DownGridMgr.setFallSpeed(newSpeed); // 如果DownGridMgr有这个方法，优先用这个
            console.log(`[Game] Speed increased to: ${newSpeed}`);
        } else {
            // 达到最大值，停止计时器
            this.unschedule(this.increaseSpeed);
            console.log(`[Game] Speed reached max: 10`);
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
        /** 接收扣血消息 */
        EventManager.on(EventName.Game.Damage, this.evtDamage, this);
        // 游戏重启事件
        EventManager.on(EventName.Game.RestartGame, this.evtRestart, this);
        /** 暂停游戏 */
        EventManager.on(EventName.Game.Pause, this.evtPause, this);
        /** 恢复游戏 */
        EventManager.on(EventName.Game.Resume, this.evtResume, this);
        /** 回收火箭到对象池 */
        EventManager.on(EventName.Game.RecycleRocket, this.evtRecycleRocket, this);
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
     * 回收火箭到对象池
     * 处理火箭动画结束后的回收逻辑
     * @param {Node} rocket - 要回收的火箭节点
     */
    evtRecycleRocket(rocket: Node) {
        if (rocket && rocket.isValid) {
            this.recycleRocket(rocket);
        }
    }
    
    /**
     * 加载关卡额外数据
     * 加载关卡配置数据并初始化游戏状态
     * @param {number} lv - 关卡编号
     * @returns {Promise<void>} 异步操作，完成后加载关卡数据
     */
    async loadExtraData(lv: number) {
        console.log('loadExtraData', lv);
        // Advertise.showInterstitialAds();
        this.data = await LevelConfig.getLevelData(lv);
        App.gameCtr.blockCount = this.data.blockCount;
        this.setLevelInfo();
        this.gridPre = await LoaderManeger.instance.loadPrefab('prefab/pieces/grid');
        this.rocketPre = await LoaderManeger.instance.loadPrefab('prefab/pieces/rocket');
        
        // 重置炮塔数据        
        this.upTurret();
        await this.initLayout();
        this.startDownGrid();

        this.Guide();
        this.gameState = GameState.PLAYING;
        App.gameCtr.setPause(false);

        // 开始记录游戏操作录屏
        this.startGameRecorder();
    }
    /*********************************************  UI information *********************************************/
    /*********************************************  UI information *********************************************/
    /*********************************************  UI information *********************************************/

    /** 倒计时时间：用于控制提示显示的倒计时 */
    private downTime: number = 1;
    /** 提示计时器索引：用于清除提示计时器 */
    private intervalTipsIndex: number = 0;

    
    /**
     * 重置时间间隔
     * 重置提示计时器和倒计时
     * @description 当玩家操作时，重置不操作提示的计时器
     */
    resetTimeInterval() {
        clearInterval(this.intervalTipsIndex);
        this.downTime = 1;
        this.hand.active = false;
    }
    
    /**
     * 获取时间间隔
     * 获取当前的倒计时时间
     * @returns {number} 当前的倒计时时间
     */
    getTimeInterval() {
        return this.downTime;
    }

    /**
     * 设置关卡信息
     * 初始化目标消除数量、道具信息和血量
     * @description 根据关卡配置初始化游戏目标、道具数量和血量显示
     */
    setLevelInfo() {
        let data = this.data;
        let idArr = data.mapData[0].m_id;
        this.AchievetheGoal = [];
        
        // 初始化目标消除数量
        for (let i = 0; i < idArr.length; i++) {
            let count = this.getLevelTargetCount();
            let temp = [idArr[i], count];
            this.AchievetheGoal.push(temp);
        }
        console.log("this.AchievetheGoal",this.AchievetheGoal)
    
        // 更新UI显示
        this.updateTargetCount();
        this.updateToolsInfo();
        // 初始化血量显示
        this.playerHealth = 100;
        this.updateHealthDisplay();
        // 更新关卡显示
        this.updateLevelLb();
    }

    getLevelTargetCount() {//list: mapData[], idx
        // 确保至少有一个
        const lv = Math.max(1, App.gameCtr.curLevel || 1);
        const base = 30;          // 第一关基础目标数量，确保游戏时间约 2 分钟
        let count: number;

        if (lv <= 5) {
            // 前 5 关：较慢的线性增长
            // 每关增加 5 个目标，确保增长平稳
            count = base + (lv - 1) * 10;
        } else {
            // 5 关之后：较快的指数增长
            // 以第 5 关的目标数量为基础，之后每关 15% 的增长率
            const level10Count = base + 1 * 10; // 第 5 关的目标数量
            const growthRate = 1.03; // 15% 的增长率
            count = Math.ceil(level10Count * Math.pow(growthRate, lv - 5));
        }

        // 确保目标数量至少为基础值
        count = Math.max(base, count);
        return count;
    }

    /**
     * 更新道具信息
     * 显示各种道具的数量
     * @description 从GameData加载道具数量并更新UI显示
     */
    updateToolsInfo() {
        // 加载道具数量
        let bombCount = GameData.loadData(GameData.BombBomb, 0);
        let verCount = GameData.loadData(GameData.BombVer, 0);
        let horCount = GameData.loadData(GameData.BombHor, 0);
        let allCount = GameData.loadData(GameData.BombAllSame, 0);
        let changeCount = GameData.loadData(GameData.BombChangecolor, 0);
        
        // 更新UI显示
        CocosHelper.updateLabelText(this.lbTool1, bombCount);
        CocosHelper.updateLabelText(this.lbTool2, horCount);
        CocosHelper.updateLabelText(this.lbTool3, verCount);
        CocosHelper.updateLabelText(this.lbTool4, allCount);
        CocosHelper.updateLabelText(this.lbTool5, changeCount);
        
        // 控制按钮显示状态
        this.addBtn1.active = bombCount <= 0;
        this.addBtn2.active = horCount <= 0;
        this.addBtn3.active = verCount <= 0;
        this.addBtn4.active = allCount <= 0;
        this.addBtn5.active = changeCount <= 0;
        this.video1.active = false;// bombCount <= 0;
        this.video2.active = false;// horCount <= 0;
        this.video3.active = false;// verCount <= 0;
        this.video4.active = false;// allCount <= 0;
        this.video5.active = false;// changeCount <= 0;
    }

    /**
     * 更新消除目标数量
     * 根据目标数量选择显示不同的目标面板
     * @description 更新UI上的目标消除数量显示，并检查是否达成目标
     */
    updateTargetCount() {
        let arr = this.AchievetheGoal;
        // 根据目标数量选择显示不同的目标面板        
        // 更新目标显示
        this.target2.children.forEach((item, idx) => {
            item.active = idx < arr.length;
            if (idx < arr.length) {
                item.getComponent(gridCmpt).setType(arr[idx][0]);
                item.getComponent(gridCmpt).setCount(arr[idx][1]);
            }
        });

        // 强制刷新 layout 组件，确保布局计算完成
        const target2Layout = this.target2.getComponent(Layout);
        if (target2Layout && target2Layout.updateLayout) {
            target2Layout.updateLayout();
        }
        if (this.isValid && this.target2 && this.target2BackTex) {
            let target2UITransform = this.target2.getComponent(UITransform);
            if (target2UITransform) {
                let backTexUITransform = this.target2BackTex.getComponent(UITransform);
                if (backTexUITransform) {
                    backTexUITransform.width = target2UITransform.width + 20;
                }
            }
        }

        // 检查是否达成目标
        this.checkResult();
    }

    /**
     * 每帧更新
     * 检查水果水果位置并显示警告
     * @param {number} dt - 时间间隔
     * @description 实时检查水果水果的位置，当水果过低时显示警告
     */
    protected update(dt: number): void {
        if (App.gameCtr.isPause) return;
        this.UPAlert();
        this.UPdownTime(dt);

        // 2024-01-20: 处理游戏结束等待逻辑
        if (this.isGameOverWaiting) {
            this.gameOverWaitTime += dt;
            
            // 检查是否所有操作都已完成（空闲状态）
            // 空闲条件：没有正在交换，没有正在检查消除，没有触摸操作，且没有活跃的爆炸粒子
            const activeParticles = this.particleManager.getActiveParticleCount('particle');
            const isIdle = !this.isStartChange && !this.isChecking && !this.isStartTouch && activeParticles === 0;
            
            // 严格等待所有效果结束，不设超时强制结算
            if (isIdle) {
                console.log(`Game over drain out finished. Idle: ${isIdle}, Time: ${this.gameOverWaitTime.toFixed(2)}s`);
                this.isGameOverWaiting = false; // 重置等待状态
                this.performGameOver(); // 执行真正的结算
            }
        }
    }

    /**
     * 播放教学手势移动动画
     * 根据提示返回的格子和方向，控制 hand 从当前格子位置移动到目标格子位置
     * 逻辑：
     * 1. 计算中心格子和目标格子的世界坐标
     * 2. 将 hand 节点移动到起点位置并激活
     * 3. 使用 tween 往返移动，模拟玩家滑动操作
     * @param grid 需要移动的中心格子组件
     * @param dir 移动方向（左/右/上/下）
     */
    playHandGuide(grid: gridCmpt, dir: Direction) {
        if (!this.hand || !grid || !grid.node) return;
        
        // 计算中心格子的世界坐标
        // 注意：这里需要确保使用正确的节点层级来获取坐标
        let centerWorld = grid.node.worldPosition.clone();

        // 目标格子的世界坐标
        // 根据方向计算目标格子的位置
        let offset = v3(0, 0, 0);
        let w = Constant.Width; // 假设这是格子的宽度
        
        // 根据移动方向调整偏移量
        // 注意：Cocos Creator的坐标系，Y轴向上为正
        switch (dir) {
            case Direction.left:
                offset.x = -w;
                break;
            case Direction.right:
                offset.x = w;
                break;
            case Direction.up:
                offset.y = w;
                break;
            case Direction.down:
                offset.y = -w;
                break;
        }

        let targetWorld = centerWorld.clone().add(offset);

        // 将世界坐标转换为hand父节点的局部坐标
        // 这样可以确保hand在正确的位置显示
        let parent = this.hand.parent;
        if (!parent) return;
        
        let uiTransform = parent.getComponent(UITransform);
        if (!uiTransform) return;

        let startLocal = uiTransform.convertToNodeSpaceAR(centerWorld);
        let endLocal = uiTransform.convertToNodeSpaceAR(targetWorld);

        if (DEV) {
            console.log(`HandGuide: Start(${startLocal.x}, ${startLocal.y}) -> End(${endLocal.x}, ${endLocal.y}), Dir: ${dir}`);
        }

        this.hand.active = true;
        this.hand.setPosition(startLocal);

        // 停止之前的动画，开始新的往返动画
        Tween.stopAllByTarget(this.hand);
        
        // 创建往返动画：移动到目标 -> 停顿 -> 回到起点 -> 停顿
        tween(this.hand)
            .to(0.8, { position: endLocal }, { easing: 'sineInOut' }) // 移动过去
            .delay(0.2) // 稍微停顿
            .to(0.2, { position: startLocal }, { easing: 'sineInOut' }) // 快速回到起点（模拟提起手）
            .delay(0.2)
            .union() // 合并成一个动作
            .repeatForever() // 循环播放
            .start();
    }

       /**
     * 处理时间提示
     * 玩家5秒不操作就给提示
     * @description 当玩家长时间不操作时，自动触发提示系统
     */
    UPdownTime(dt: number) {
        // 倒计时已经结束并且定时器已创建时，直接返回，避免重复创建
        if (this.downTime <= 0 ) {
            return;
        }

        // 按帧减少倒计时
        if (this.downTime > 0) {
            this.downTime -= dt;
        }

        // 首次降到阈值以下时创建定时器
        if (this.downTime <= 0 ) {
            if (GameData.isNewPlayer() == 0) {
                return;
            }
            // 老玩家：进入 5 秒一次的提示循环
            this.intervalTipsIndex = setInterval(() => {
                if (!this.isValid) return;
                this.onClick_tipsBtn();
            }, 5000);

        }
    }

    //检查最下方的水果水果是否低于阈值
    UPAlert() {
        if (isValid(this.DownGridMgr) && isValid(this.Alert)) {
            // 检查最下方的水果水果是否低于阈值
            if (this.DownGridMgr.isLowestGridBelowThreshold()) {
                if (!this.Alert.active) {
                    this.Alert.active = true;
                    // 启动危险闪烁动画
                    this.startAlertBlink();
                }
            }
            else {
                if (this.Alert.active) {
                    this.Alert.active = false;
                    // 停止闪烁动画
                    this.stopAlertBlink();
                }
            }
        }
    }

    /**
     * 启动Alert危险闪烁动画
     * 使用tween实现红色闪烁效果
     */
    private startAlertBlink() {
        if (!this.Alert || !this.Alert.isValid) return;

        // 停止之前的动画
        this.stopAlertBlink();

        // 获取Sprite组件
        const sprite = this.Alert.getComponent(Sprite);
        if (!sprite) return;

        // 保存原始颜色
        const originalColor = sprite.color.clone();

        // 创建闪烁动画：红色闪烁
        this.alertTween = tween(this.Alert)
            .to(0.3, { scale: new Vec3(1.1, 1.1, 1) }, { easing: 'quadOut' })
            .to(0.3, { scale: new Vec3(1.0, 1.0, 1) }, { easing: 'quadIn' })
            .union()
            .repeatForever()
            .start();
    }

    /**
     * 停止Alert闪烁动画
     */
    private stopAlertBlink() {
        if (this.alertTween) {
            this.alertTween.stop();
            this.alertTween = null;
        }
        if (this.Alert && this.Alert.isValid) {
            this.Alert.setScale(1, 1, 1);
        }
    }
    /**
     * 结束检测
     * 检查是否达成所有消除目标
     * @description 检查游戏是否达成胜利条件，当所有目标都完成时触发胜利
     */
    checkResult() {
        // 如果游戏已结束，直接返回
        if (this.gameState === GameState.WIN || this.gameState === GameState.GAME_OVER) return;
        
        let count = 0;
        // 统计已达成的目标数量
        for (let i = 0; i < this.AchievetheGoal.length; i++) {
            if (this.AchievetheGoal[i][1] == 0) {
                count++;
            }
        }
        
        // 达成所有游戏目标，胜利
        if (count == this.AchievetheGoal.length) {
            this.gameState = GameState.WIN;
            
            // 2024-01-20: 胜利也需要等待特效播放完毕
            this.isGameOverWaiting = true;
            this.gameOverWaitTime = 0;
            console.log("Game Win: Waiting for animations to finish...");
        }
    }

    /**
     * 获取奖励炸弹
     * 生成随机类型的奖励炸弹
     * @description 根据关卡配置生成指定数量的随机奖励炸弹
     */
    getRewardBombs() {
        // 清空之前的奖励炸弹数据
        this.rewardBombs = [];
        for (let i = 0; i < this.data.RewardCount; i++) {
            // 生成随机炸弹类型 (8-11对应Bomb枚举的四种炸弹类型)
            let bombType = Math.floor(Math.random() * 4) + 8;
            // 保存炸弹类型和数量
            const existingBomb = this.rewardBombs.find(b => b.type === bombType);
            if (existingBomb) {
                existingBomb.count++;
            } else {
                this.rewardBombs.push({ type: bombType, count: 1 });
            }
        }
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
     * 检测网格中是否还有炸弹
     * 检查并处理所有剩余的炸弹
     * @returns {Promise<void>} 异步操作，完成后检查是否还有炸弹
     */
    async checkAllBomb() {
        if (!this.isValid) return;
        let isHaveBomb: boolean = false;
        for (let i = 0; i < this.H; i++) {
            for (let j = 0; j < this.V; j++) {
                let item = this.blockArr[i][j];
                if (item && this.isBomb(item.getComponent(gridCmpt))) {
                    isHaveBomb = true;
                    this.handleBomb(item.getComponent(gridCmpt), true);
                }
            }
        }
        await ToolsHelper.delayTime(1);
        if (!isHaveBomb) {
            console.log("没有炸弹了，一切都结束了")

        }

    }

    /**
     * 投放道具
     * 从屏幕上方发射道具到随机水果
     * @param {number} bombType - 炸弹类型，-1表示随机类型
     * @param {Vec3} worldPosition - 发射位置
     */
    throwTools(bombType: number = -1, worldPosition: Vec3 = null) {
        AudioManager.getInstance().playSound("prop_missle");
        let originPos = worldPosition ;
        
        // 找到一个随机水果作为目标
        let item: gridCmpt = this.getRandomBlock();
        if (!item) {
            console.log("没有找到合适的水果");
            return;
        }
        
        let gridnode: Node = item.node;
        
        // 创建子弹特效
        const bulletParticle = this.particleManager.playParticle('bulletParticle', originPos);
        if (!bulletParticle) {
            console.log("创建子弹特效失败");
            return;
        }
        
        // 重置时间间隔
        this.resetTimeInterval();
        
        // 移动子弹到目标
        MoveManager.getInstance().moveToTargetWithBezier(bulletParticle, gridnode, 0.6, () => {
            // 回收子弹特效
            if (bulletParticle && bulletParticle.parent) {
                this.particleManager.releaseParticle('bulletParticle', bulletParticle);
            }
            
            // 设置水果类型为炸弹
            let rand = bombType == -1 ? Math.floor(Math.random() * 3) + 8 : bombType;
            item.setType(rand);
        });
    }

    /**
     * 获取随机水果
     * 随机选择一个有效的水果作为目标
     * @param {number} maxAttempts - 最大尝试次数，默认100
     * @returns {gridCmpt} 随机选中的水果组件
     */
    getRandomBlock(maxAttempts: number = 100) {
        // 随机尝试一定次数
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            let h = Math.floor(Math.random() * this.H);
            let v = Math.floor(Math.random() * this.V);
            if (this.blockArr[h][v] && this.blockArr[h][v].getComponent(gridCmpt).type < 7) {
                return this.blockArr[h][v].getComponent(gridCmpt);
            }
        }

        // 如果随机尝试失败，遍历整个网格寻找合适的水果
        for (let h = 0; h < this.H; h++) {
            for (let v = 0; v < this.V; v++) {
                if (this.blockArr[h][v] && this.blockArr[h][v].getComponent(gridCmpt).type < 7) {
                    return this.blockArr[h][v].getComponent(gridCmpt);
                }
            }
        }

        // 如果没有找到合适的水果，返回null
        return null;
    }

    /**
     * 继续游戏
     * 恢复游戏状态并继续水果下落
     * @description 当玩家观看视频后，恢复游戏状态并继续游戏
     */
    evtContinueGame() {
        // 重置游戏状态
        this.isStartChange = false;
        this.isStartTouch = false;
        this.isGameOverWaiting = false; // 重置游戏结束等待状态
        this.gameState = GameState.PLAYING; // 重置游戏状态为播放中

        // 消除前面几行
        this.eliminateFrontNRows();

        // 恢复玩家血量
        this.playerHealth = 100;
        this.updateHealthDisplay();

        // 恢复水果下落
        if (this.DownGridMgr) {
            EventManager.emit(EventName.Game.Resume);
        }
    }

    /**
     * 处理扣血事件
     * 处理游戏扣血逻辑并检查游戏结束条件
     * @param {number} damage - 扣除的血量
     */
    evtDamage(damage: number) {
        if (this.gameState === GameState.WIN || this.gameState === GameState.GAME_OVER || !this.isValid) return;

        // 扣除血量
        this.playerHealth -= 100;//只给一次机会
        if (this.playerHealth < 0) {
            this.playerHealth = 0;
        }

        // 更新血量显示
        this.updateHealthDisplay();

        // 检查是否游戏结束
        if (this.playerHealth <= 0) {
            this.GameOver();
        }
    }

    /**
     * 更新血量显示
     * 更新血量进度条
     * @description 实时更新玩家血量的UI显示
     */
    updateHealthDisplay() {
        if (this.spHealth) {
            this.spHealth.active = false;
            const healthProgress = this.spHealth.getComponent(ProgressBar);
            if (healthProgress) {
                healthProgress.progress = this.playerHealth / 100;
            }
        }
    }

    /**
     * 处理游戏失败事件
     * 处理游戏结束逻辑并显示失败界面
     * @description 当玩家血量为0时，触发游戏结束逻辑
     */
    GameOver() {
        console.log("Game over: Handling game failure");
        // 2024-01-20: 注释掉原逻辑，改为进入等待状态
        // // this.isWin = false;
        // this.gameState = GameState.GAME_OVER;

        // App.gameCtr.setPause(true);
  
        // this.getRewardBombs();
        // // 加载并显示结果界面
        // LoaderManeger.instance.loadPrefab('prefab/ui/resultView').then((prefab) => {
        //     let resultNode = instantiate(prefab);
        //     ViewManager.show({
        //         node: resultNode,
        //         name: "ResultView",
        //         data: { level: LevelConfig.getCurLevel(), isWin: false, rewardBombs: this.rewardBombs }
        //     });
        // });

        // 2024-01-20: 进入等待状态，等待动画播放完毕
        this.isGameOverWaiting = true;
        this.gameOverWaitTime = 0;
        console.log("Game over: Waiting for animations to finish...");
    }

    /**
     * 执行真正的游戏结束逻辑（弹窗）
     * 2024-01-20: 新增方法，用于在等待结束后调用
     */
    private async performGameOver() {
        // 只有非胜利状态才强制设为 GAME_OVER，否则保持 WIN 状态
        if (this.gameState !== GameState.WIN) {
            this.gameState = GameState.GAME_OVER;
        }
        
        App.gameCtr.setPause(true);
  
        this.getRewardBombs();
        const isWin = this.gameState === GameState.WIN;
        
        // 加载并显示结果界面
        LoaderManeger.instance.loadPrefab('prefab/ui/resultView').then((prefab) => {
            let resultNode = instantiate(prefab);
            ViewManager.show({
                node: resultNode,
                name: "ResultView",
                data: { level: GameData.getCurLevel(), isWin: isWin, rewardBombs: this.rewardBombs }
            });
        });

        // 2024-01-20: 游戏结束后，结束录屏
        this.endGameRecorder();

        await ToolsHelper.delayTime(0.1);
        
        // 检查是否为抖音渠道
        let isDouyinChannel = CM.isPlatform(CM.CH_ZJ);
        
        // 检查录屏时间是否足够（大于3秒）
        let shouldShowShareView = false;
        if (isDouyinChannel && CM.mainCH && (CM.mainCH as any).recordTime !== undefined) {
            const recordTime = (CM.mainCH as any).recordTime;
            if (recordTime > 3) {
                shouldShowShareView = true;
                console.log(`录屏时间充足：${recordTime}秒`);
            } else {
                console.log(`录屏时间不足：${recordTime}秒`);
            }
        } else {
            console.log('当前平台不支持录屏或录屏时间不可用');
        }

        // 只有在抖音渠道且录屏时间充足的情况下才显示分享录屏界面
        if (shouldShowShareView && isDouyinChannel) {
            LoaderManeger.instance.loadPrefab('prefab/ui/shareVView').then((prefab) => {
                let shareVViewNode = instantiate(prefab);
                ViewManager.show({
                    node: shareVViewNode,
                    name: "ShareVView",
                    data: {}
                });
            });
        } else {
            console.log('非抖音渠道或录屏时间不足，不显示分享界面');
        }
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
        if (this.isGameOverWaiting) return;
        
        // 核心修复：正在处理消除或爆炸时，禁止产生新的触摸
        if (this.isChecking) {
            console.log("evtTouchStart: board is checking, touch ignored.");
            return;
        }

        console.log(this.isStartTouch, this.isStartChange);
        if (this.hand)
            this.hand.active = false;
        if (this.getTimeInterval() > 0)
            return;
        this.handleProtected();
        if (this.isStartChange) return;
        if (this.isStartTouch) return;

        let pos = this.gridNode.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(p.x, p.y, 1));
        let bc = this.checkClickOnBlock(pos);
        this.curTwo = [];
        if (bc) {
            bc.setSelected(true);
            this.curTwo.push(bc);
            console.log(bc.data);
            this.isStartTouch = true;
        }
        // await this.checkMoveDown();
    }
    /**
     * 触控事件（滑动）
     * 处理玩家滑动的逻辑
     * @param {Vec2} p - 触摸位置
     */
    evtTouchMove(p: Vec2) {
        if (App.gameCtr.isPause) return;
        if (this.isStartChange) return;
        if (!this.isStartTouch) return;

        // 核心修复：正在处理消除或爆炸时，禁止触发滑动交换
        if (this.isChecking) {
            return;
        }

        let pos = this.gridNode.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(p.x, p.y, 1));
        let bc = this.checkClickOnBlock(pos);
        if (bc && App.gameCtr.isNeighbor(bc, this.curTwo[0])) {
            bc.setSelected(true);
            this.curTwo.push(bc);
            this.isStartChange = true;
            this.startChangeCurTwoPos();
        }
    }
    /**
     * 触控事件（结束）
     * 处理玩家触摸结束的逻辑
     * @param {Vec2} p - 触摸位置
     * @returns {Promise<void>} 异步操作，处理触摸结束逻辑
     */
    async evtTouchEnd(p: Vec2) {
        if (App.gameCtr.isPause) return;
        if (this.isStartChange) return;
        if (!this.isStartTouch) return;
        let pos = this.gridNode.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(p.x, p.y, 1));
        let bc = this.checkClickOnBlock(pos);
        /** 点到炸弹 */
        if (bc && (this.isBomb(bc)) && this.curTwo.length == 1) {
            await this.handleBomb(bc);
        }
        this.isStartTouch = false;
        this.isStartChange = false;
        this.resetSelected();
    }

    /** 保护状态：防止玩家快速操作的保护标记 */
    private isRecording: boolean = false;
    /**
     * 保护措施
     * 防止玩家快速操作引起的游戏中断
     * @description 当玩家进行快速操作时，设置保护机制以避免游戏状态混乱
     * 2024-01-26: 注释掉强制重置逻辑，避免在长动画过程中错误地解锁操作，导致逻辑冲突
     */
    handleProtected() {
        // if ((this.isStartChange || this.isStartTouch) && !this.isRecording) {
        //     this.isRecording = true;
        //     this.scheduleOnce(() => {
        //         if (this.isValid) {
        //             this.isRecording = false;
        //             this.isStartChange = false;
        //             this.isStartTouch = false;
        //         }
        //     }, 5)
        // }
    }
    /**
     * 是否是炸弹
     * 检查水果是否为炸弹类型
     * @param {gridCmpt} bc - 水果组件
     * @returns {boolean} 是否为炸弹
     */
    isBomb(bc: gridCmpt) {
        return bc.type >= 8 && bc.type <= 11
    }

    /**
     * 处理炸弹
     * 处理炸弹的爆炸逻辑和特效
     * @param {gridCmpt} bc - 炸弹水果组件
     * @param {boolean} isResult - 是否为结果检查
     * @returns {Promise<boolean>} 异步操作，是否成功处理炸弹
     */
    async handleBomb(bc: gridCmpt, isResult: boolean = false) {
        try {
            // 检查是否正在处理其他消除操作
            if (this.isChecking) {
                return false;
            }

            // 检查是否是炸弹类型
            if (this.isBomb(bc)) {
                // 设置检查状态，避免重复处理
                this.isChecking = true;
                // 存储炸弹影响的水果列表
                let bombList: gridCmpt[][] = [];
                let uniqueFruits: gridCmpt[] = [];
                // 存储已经处理过的炸弹，避免重复处理
                let processedBombs = new Set<string>();
                // 存储已经处理过的水果，用于去重
                let processedFruits = new Set<string>();
                // 队列用于广度优先搜索处理所有炸弹
                let bombQueue: gridCmpt[] = [];
                
                // 添加初始炸弹到队列
                bombQueue.push(bc);
                processedBombs.add(`${bc.h},${bc.v}`);
                
                // 广度优先搜索处理所有炸弹
                while (bombQueue.length > 0) {
                    let currentBomb = bombQueue.shift();
                    if (!currentBomb || !currentBomb.node || !currentBomb.node.isValid) continue;
                    
                    // 获取当前炸弹影响的水果列表
                    let list: gridCmpt[] = await this.getBombList(currentBomb);
                    bombList.push(list);
                    
                    // 检查列表中是否有其他炸弹，添加到队列
                    for (let i = 0; i < list.length; i++) {
                        let item = list[i];
                        if (!item || !item.node || !item.node.isValid) continue;
                        
                        // 跳过当前炸弹本身
                        if (item.h == currentBomb.h && item.v == currentBomb.v) continue;
                        
                        // 如果列表中包含其他炸弹，且未处理过，则添加到队列
                        if (this.isBomb(item)) {
                            let bombKey = `${item.h},${item.v}`;
                            if (!processedBombs.has(bombKey)) {
                                processedBombs.add(bombKey);
                                bombQueue.push(item);
                            }
                        }
                    }
                }
                
                // 合并所有炸弹影响的水果列表并去重
                for (let i = 0; i < bombList.length; i++) {
                    for (let j = 0; j < bombList[i].length; j++) {
                        let item = bombList[i][j];
                        if (!item || !item.node || !item.node.isValid) continue;
                        
                        let fruitKey = `${item.h},${item.v}`;
                        if (!processedFruits.has(fruitKey)) {
                            processedFruits.add(fruitKey);
                            uniqueFruits.push(item);
                        }
                    }
                }

                // 处理炸弹消除
                await this.handleSamelistBomb(uniqueFruits);
                // 检查是否还有其他可消除的水果
                await this.checkAgain(isResult);
                return true;
            }
            return false;
        } catch (error) {
            console.error("handleBomb error:", error);
            return false;
        } finally {
            // 重置检查状态，确保后续操作正常执行
            this.isChecking = false;
        }
    }

    /**
     * 获取炸弹炸掉的糖果列表
     * 根据炸弹类型获取需要消除的水果列表
     * @param {gridCmpt} bc - 炸弹水果组件
     * @returns {Promise<gridCmpt[]>} 异步操作，返回炸弹影响的水果列表
     */
    async getBombList(bc: gridCmpt): Promise<gridCmpt[]> {
        let list: gridCmpt[] = [];
        // 保护：确保节点仍然存在
        if (!bc.node || !bc.node.isValid) return [];

        switch (bc.type) {
            case Bomb.hor:
                for (let i = 0; i < this.H; i++) {
                    let item = this.blockArr[i][bc.v];
                    if (item) {
                        list.push(item.getComponent(gridCmpt));
                    }
                }
                AudioManager.getInstance().playSound("prop_line")
                // let rocket1 = instantiate(this.rocketPre);
                let rocket1 = this.getRocketFromPool();
                this.effNode.addChild(rocket1);
                rocket1.setPosition(bc.node.position);
                rocket1.getComponent(rocketCmpt).initData(bc.type);
                break;
            case Bomb.ver:
                for (let i = 0; i < this.V; i++) {
                    let item = this.blockArr[bc.h][i];
                    if (item) {
                        list.push(item.getComponent(gridCmpt));
                    }
                }
                AudioManager.getInstance().playSound("prop_line")
                // let rocket = instantiate(this.rocketPre);
                let rocket = this.getRocketFromPool();
                this.effNode.addChild(rocket);
                rocket.setPosition(bc.node.position);
                rocket.getComponent(rocketCmpt).initData(bc.type);
                break;
            case Bomb.bomb:
                for (let i = bc.h - 2; i < bc.h + 2 && i < this.H; i++) {
                    for (let j = bc.v - 2; j < bc.v + 2 && j < this.V; j++) {
                        if (i < 0 || j < 0) 
                            continue;
                        let item = this.blockArr[i][j];
                        if (item) {
                            list.push(item.getComponent(gridCmpt));
                        }
                    }
                }
                AudioManager.getInstance().playSound("prop_bomb")
                break;
            case Bomb.allSame:
                let curType: number = -1;
                for (let i = 0; i < this.curTwo.length; i++) {
                    if (this.curTwo[i].type != bc.type && this.curTwo[i].type < App.gameCtr.blockCount) {
                        curType = this.curTwo[i].type;
                    }
                }
                if (curType < 0) {//炸弹四周随机找一个
                    for (let i = bc.h - 1; i < bc.h + 1 && i < this.V; i++) {
                        for (let j = bc.v - 1; j < bc.v + 1 && j < this.V; j++) {
                            if (i < 0 || j < 0) continue;
                            let item = this.blockArr[i][j];
                            if (item && curType < 0 && item.getComponent(gridCmpt).type < App.gameCtr.blockCount) {
                                curType = item.getComponent(gridCmpt).type;
                                break;
                            }
                        }
                    }
                }
                let node = bc.node.getChildByName('icon').getChildByName('Match11');
                node.getComponent(Sprite).enabled = false;
                node.getChildByName('a').active = true;
                if (curType < 0) curType = Math.floor(Math.random() * App.gameCtr.blockCount);
                AudioManager.getInstance().playSound("prop_missle")
                for (let i = 0; i < this.H; i++) {
                    for (let j = 0; j < this.V; j++) {
                        let item = this.blockArr[i][j];
                        if (item && item.getComponent(gridCmpt).type == curType) {
                            list.push(item.getComponent(gridCmpt));
                            // let particle = instantiate(this.particlePre);
                            let particle = this.particleManager.playParticle('particle', bc.node.position);
                            particle.children.forEach(item => {
                                item.active = item.name == "move";
                                item.getComponent(ParticleSystem2D).resetSystem();
                            });

                            this.resetTimeInterval();
                            tween(particle).to(0.5, { position: item.position }).call(async (particle: Node) => {
                                // 特效播放完成后，手动回收特效
                                if (particle && particle.parent) {
                                    this.particleManager.releaseParticle('particle', particle);
                                }
                            }).start();
                        }
                    }
                }
                list.push(bc);
                await ToolsHelper.delayTime(0.7);
                break;
        }
                        console.log("listlistlistlist",list.length);
        return list;
    }

    /**
     * 选中状态还原
     * 重置所有选中水果的选中状态
     * @description 将当前选中的水果重置为未选中状态
     */
    resetSelected() {
        if (!this.isValid) {
            return;
        }
        this.curTwo.forEach(item => {
            if (item) {
                item.setSelected(false);
            }
        })
    }

    /**
     * 开始交换两个选中的水果
     * 处理水果交换的动画和逻辑
     * @param {boolean} isBack - 是否是交换回原位
     * @returns {Promise<void>} 异步操作，完成水果交换
     */
    async startChangeCurTwoPos(isBack: boolean = false) {
        try {
            let time = Constant.changeTime;
            let one = this.curTwo[0], two = this.curTwo[1];
            if (!isBack) {
                AudioManager.getInstance().playSound("ui_banner_down_show")
            }
            else {
                AudioManager.getInstance().playSound("ui_banner_up_hide")
            }
            if (!one || !two) return;
            
            // 保存原始位置，避免数据交换后位置计算错误
            const onePos = this.blockPosArr[one.h][one.v].clone();
            const twoPos = this.blockPosArr[two.h][two.v].clone();
            
            // 执行交换动画
            const oneTween = tween(one.node).to(time, { position: twoPos });
            const twoTween = tween(two.node).to(time, { position: onePos });
            
            // 同时启动两个动画
            oneTween.start();
            twoTween.start();
            
            // 使用Promise等待两个动画完成
            await new Promise<void>((resolve) => {
                // 监听第二个动画完成
                setTimeout(resolve, time * 1000);
            });
            
            // 核心修复：动画等待结束后，再次检查节点是否依然有效
            // 如果在此期间被炸弹爆炸销毁，则终止后续逻辑
            if (!one || !two || !one.node || !two.node || !one.node.isValid || !two.node.isValid) {
                console.warn("startChangeCurTwoPos: nodes became invalid during animation.");
                this.isStartChange = false;
                this.isStartTouch = false;
                this.resetSelected();
                return;
            }

            // 动画完成后处理逻辑
            if (!isBack) {
                // 交换数据
                this.changeData(one, two);
                
                // 检查是否形成消除
                let isbomb1 = await this.handleBomb(one);
                let isbomb2 = await this.handleBomb(two);
                let bool = await this.startCheckThree((bl) => {
        
                });
                
                if (bool || (isbomb1 || isbomb2)) {
                    // 有消除，继续检查
                    this.checkAgain();
                }
                else {
                    // 无消除，交换回原位
                    console.log("No match found, swapping back");

                    await this.startChangeCurTwoPos(true);
                }
            }
            else {
                // 交换回原位，恢复数据
                this.changeData(one, two);
                
                // 重置状态
                this.isStartChange = false;
                this.isStartTouch = false;
                this.resetSelected();
            }
        } catch (error) {
            console.error("startChangeCurTwoPos error:", error);
            this.isStartChange = false;
            this.isStartTouch = false;
            this.resetSelected();
        }
        // let time = Constant.changeTime;
        // let one = this.curTwo[0], two = this.curTwo[1];
        // if (!isBack) {
        //     AudioManager.getInstance().playSound("ui_banner_down_show")
        // }
        // else {
        //     AudioManager.getInstance().playSound("ui_banner_up_hide")
        // }
        // if (!one || !two) return;
        
        // // 保存原始位置，避免数据交换后位置计算错误
        // const onePos = this.blockPosArr[one.h][one.v].clone();
        // const twoPos = this.blockPosArr[two.h][two.v].clone();
        
        // // 执行交换动画
        // const oneTween = tween(one.node).to(time, { position: twoPos });
        // const twoTween = tween(two.node).to(time, { position: onePos });
        
        // // 同时启动两个动画
        // oneTween.start();
        // twoTween.start();
        
        // // 使用Promise等待两个动画完成
        // await new Promise<void>((resolve) => {
        //     // 监听第二个动画完成
        //     setTimeout(resolve, time * 1000);
        // });
        
        // // 动画完成后处理逻辑
        // if (!isBack) {
        //     // 交换数据
        //     this.changeData(one, two);
            
        //     // 检查是否形成消除
        //     let isbomb1 = await this.handleBomb(one);
        //     let isbomb2 = await this.handleBomb(two);
        //     let bool = await this.startCheckThree((bl) => {
    
        //     });
            
        //     if (bool || (isbomb1 || isbomb2)) {
        //         // 有消除，继续检查
        //         this.checkAgain();
        //     }
        //     else {
        //         // 无消除，交换回原位
        //         console.log("No match found, swapping back");

        //         await this.startChangeCurTwoPos(true);
        //     }
        // }
        // else {
        //     // 交换回原位，恢复数据
        //     this.changeData(one, two);
            
        //     // 重置状态
        //     this.isStartChange = false;
        //     this.isStartTouch = false;
        //     this.resetSelected();
        // }
    }

    /**
     * 检查水果是否已经存在于列表中
     * 避免重复处理同一个水果
     * @param {gridCmpt} item - 要检查的水果组件
     * @param {any[]} samelist - 已处理的水果列表
     * @returns {boolean} 是否存在于列表中
     */
    private checkExist(item: gridCmpt, samelist: any[]) {
        for (let i = 0; i < samelist.length; i++) {
            for (let j = 0; j < samelist[i].length; j++) {
                let ele: gridCmpt = samelist[i][j];
                if (ele.data.h == item.data.h && ele.data.v == item.data.v) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * 反复检查
     * 反复检查是否有可消除的水果
     * @param {boolean} isResult - 是否为结果检查
     */
    async checkAgain(isResult: boolean = false) {
        try {
            let bool = await this.startCheckThree();
            if (bool) {
                this.checkAgain(isResult);
            }
            else {
                this.resetSelected();
                this.isStartChange = false;
                this.isStartTouch = false;
                this.isChecking = false;
                if (isResult) {
                    console.log(isResult);
                    this.checkAllBomb();
                }
            }
        } catch (error) {
            console.error("checkAgain error:", error);
            this.resetSelected();
            this.isStartChange = false;
            this.isStartTouch = false;
            this.isChecking = false;
        }
        // let bool = await this.startCheckThree();
        // if (bool) {
        //     this.checkAgain(isResult);
        // }
        // else {
        //     this.resetSelected();
        //     this.isStartChange = false;
        //     this.isStartTouch = false;
        //     this.isChecking = false;
        //     if (isResult) {
        //         console.log(isResult);
        //         this.checkAllBomb();
        //     }
        // }
    }
    /**
     * 开始检测是否有满足消除条件的存在
     * 检查网格中是否有可消除的水果组合
     * @param {Function} cb - 回调函数
     * @returns {Promise<boolean>} 异步操作，是否有可消除的水果
     */
    async startCheckThree(cb: Function = null): Promise<boolean> {
        return new Promise(async resolve => {
            let samelist = [];
            for (let i = 0; i < this.H; i++) {
                for (let j = 0; j < this.V; j++) {
                    if (!this.isValid) {
                        resolve(false);
                        return;
                    }
                    let item = this.blockArr[i][j];
                    if (!item || item.getComponent(gridCmpt).getMoveState()) continue;
                    if (this.checkExist(item.getComponent(gridCmpt), samelist)) continue;
                    let hor: gridCmpt[] = this._checkHorizontal(item.getComponent(gridCmpt));
                    let ver: gridCmpt[] = this._checkVertical(item.getComponent(gridCmpt));
                    if (hor.length >= 3 && ver.length >= 3) {
                        hor = hor.slice(1, hor.length);//将自己去掉一个（重复）
                        hor = hor.concat(ver);
                        samelist.push(hor);
                    }
                }
            }
            for (let i = 0; i < this.H; i++) {
                for (let j = 0; j < this.V; j++) {
                    let item = this.blockArr[i][j];
                    if (!item || item.getComponent(gridCmpt).getMoveState()) continue;
                    if (this.checkExist(item.getComponent(gridCmpt), samelist)) continue;
                    let hor: gridCmpt[] = this._checkHorizontal(item.getComponent(gridCmpt));
                    let ver: gridCmpt[] = this._checkVertical(item.getComponent(gridCmpt));
                    if (hor.length >= 3) {
                        samelist.push(hor);
                    }
                    else if (ver.length >= 3) {
                        samelist.push(ver);
                    }
                }
            }
            cb && cb(!!samelist.length);
            await this.handleSamelist(samelist);
            let bool = !!samelist.length;
            resolve(bool);
        })
    }

    /**
     * 处理消除列表
     * 处理满足消除条件的水果列表
     * @param {any[]} samelist - 可消除的水果列表
     * @returns {Promise<void>} 异步操作，完成水果消除
     */
    private async handleSamelist(samelist: any[]) {
        //  触发短震动反馈

        return new Promise(async resolve => {
            if (samelist.length < 1) {
                resolve("");
                return;
            }
            this._deleteDuplicates(samelist);
            //0:去掉不合法的
            samelist = this.jugetLegitimate(samelist);
            let soundList = ['combo_cool', 'combo_excellent', 'combo_good', 'combo_great', 'combo_perfect'];
            let rand = Math.floor(Math.random() * soundList.length);
            
            // 修复：在处理消除列表时，需要先检查是否包含炸弹道具
            // 如果包含炸弹道具，应该触发炸弹的爆炸效果，而不是直接消除
            // 使用Set来存储需要触发炸弹的gridCmpt，避免重复处理
            let bombTriggerSet = new Set<gridCmpt>();
            
            //1:移除
            for (let i = 0; i < samelist.length; i++) {
                let item = samelist[i];
                if (item.length < 3) continue;
                if (item.length > 3) {
                    this.synthesisBomb(item);
                    continue;
                }
                if (item.length > 3) {
                    AudioManager.getInstance().playSound(soundList[rand])
                } else {
                    AudioManager.getInstance().playSound('combo');
                }

                for (let j = 0; j < item.length; j++) {
                    let ele: gridCmpt = item[j];
                    
                    // 修复：检查当前元素是否是炸弹道具（type 8-11）
                    // 如果是炸弹道具，添加到炸弹触发集合中，不直接消除
                    if (this.isBomb(ele)) {
                        bombTriggerSet.add(ele);
                        continue;
                    }
                    
                    /** 在这里检测糖果四周的障碍物 */
                    let listAround = this.getAroundGrid(ele)
                    let obstacleList = this.getObstacleList(listAround);
                    if (obstacleList.length > 0) {
                        for (let m = 0; m < obstacleList.length; m++) {
                            this.destroyGridAndGetScore(obstacleList[m].getComponent(gridCmpt));
                        }
                    }
                    this.destroyGridAndGetScore(ele);

                }
                
            }
            
            // 修复：处理所有需要触发爆炸的炸弹道具
            // 遍历炸弹触发集合，对每个炸弹调用handleBomb方法
            if (bombTriggerSet.size > 0) {
                console.log(`[Game] Found ${bombTriggerSet.size} bombs in elimination, triggering bomb effects`);
                for (let bomb of bombTriggerSet) {
                    if (bomb && bomb.node && bomb.node.isValid) {
                        await this.handleBomb(bomb);
                    }
                }
            }

            if (CM.mainCH && CM.mainCH.vibrateShort) {
                CM.mainCH.vibrateShort();
            }
            await ToolsHelper.delayTime(0.2);
            await this.checkMoveDown();
            resolve("");
        });
    }

    /**
     * 消除并获得积分
     * 消除水果并处理特效和积分
     * @param {gridCmpt} ele - 要消除的水果组件
     */
    destroyGridAndGetScore(ele: gridCmpt) {
        if (!ele) return;

        // 1. 播放消除粒子特效
        this.playDestroyParticle(ele);

        // 2. 攻击上方同类型下落水果
        this.attackTopDownGrid(ele);

        // 3. 处理物品飞行效果
        this.handleItemFly(ele);

        // 4. 销毁水果
        this.destroyGridNode(ele);

        // 5. 检查是否为新玩家，若为新玩家则设置为非新玩家
        if (GameData.isNewPlayer()==0) {
            GameData.setNewPlayer(1);
        }
    }

    /**
     * 播放消除粒子特效
     * @param {gridCmpt} ele - 要消除的水果组件
     */
    private playDestroyParticle(ele: gridCmpt) {
        let particle = this.particleManager.playParticle('particle', this.blockPosArr[ele.h][ele.v]);
        particle.children.forEach(item => {
            item.active = +item.name == ele.type;
            item.getComponent(ParticleSystem2D).resetSystem();
        });
        // 粒子特效播放完成后回收，设置0.8秒，只关注视觉爆炸时间
        this.particleManager.ParticleWithTimer('particle', particle, 0.8);
    }

    /**
     * 攻击上方同类型下落水果
     * @param {gridCmpt} ele - 要消除的水果组件
     */
    private attackTopDownGrid(ele: gridCmpt) {
        // 查找上面的水果水果能找到没有被锁定 同类型的水果水果
        let targetNode = this.DownGridMgr.getFrontGridByType(ele.type);
        
        if (targetNode) {
            // 扣除虚拟血量
            this.DownGridMgr.damageVirtualHealthByType(targetNode, ele.getAttack());

            // 发射子弹粒子
            this.fireBulletToTarget(ele, targetNode);
        } else {
            // 如果没有找到目标下落水果，将水果的类型和攻击值添加到炮塔的gridDataList中
            if (this.turret) {          
                 this.flyItemToTurret(ele, ele.node.worldPosition,this.turret.node);
            }
        }
    }

    /**
     * 发射子弹粒子到目标
     * @param {gridCmpt} source - 源水果组件
     * @param {Node} target - 目标下落水果节点
     */
    private fireBulletToTarget(source: gridCmpt, target: Node) {
        let pbullet = this.particleManager.playParticle('bulletParticle', this.blockPosArr[source.h][source.v]);
        pbullet.getComponent(BulletParticle).setAttack(source.getAttack());
        
        MoveManager.getInstance().moveToTargetWithBezier(pbullet, target, 1, () => {
            // 子弹击中目标，回收目标节点
            this.handleBulletHit(target, pbullet.getComponent(BulletParticle).getAttack());   
            
            // 子弹粒子指定回收（用户要求的显式回收）
            this.particleManager.releaseParticle('bulletParticle', pbullet);
        });
    }

    /**
     * 处理子弹击中效果
     * @param {Node} target - 目标下落水果节点
     * @param {number} damage - 伤害值
     */
    private handleBulletHit(target: Node, damage: number) {
        // 检查目标节点是否还有父节点（确保它还存在）
        if (!target || !target.parent) return;

        let targetComp = target.getComponent(gridDownCmpt);
        if (!targetComp) return;

        // 子弹击中目标粒子
        let hitParticle = this.particleManager.playParticle('particle', target.getPosition());
        hitParticle.children.forEach(item => {
            item.active = +item.name == targetComp.type;
            item.getComponent(ParticleSystem2D).resetSystem();
        });
        // 粒子特效播放完成后回收，设置0.8秒，只关注视觉爆炸时间
        this.particleManager.ParticleWithTimer('particle', hitParticle, 0.8);

        // 扣除真实血量并处理销毁
        targetComp.takeDamage(damage, () => {
            // grid死亡，回收目标节点
            this.DownGridMgr.recycleGridByNode(target);
        });
    }

    /**
     * 处理物品飞行效果
     * @param {gridCmpt} ele - 要消除的水果组件
     */
    private handleItemFly(ele: gridCmpt) {
        let tp = ele.type;
        let worldPosition = ele.node.worldPosition;
        this.flyItem(tp, worldPosition,this.targetBg);
    }

    /**
     * 销毁水果节点
     * @param {gridCmpt} ele - 要消除的水果组件
     */
    private destroyGridNode(ele: gridCmpt) {
        this.blockArr[ele.h][ele.v] = null;
        ele.node.destroy();
    }

    /**
     * 获取障碍物列表
     * 从水果列表中筛选出障碍物类型的水果
     * @param {Node[]} list - 水果节点列表
     * @returns {Node[]} 障碍物节点列表
     */
    getObstacleList(list: Node[]) {
        let obstacleList = [];
        for (let i = 0; i < list.length; i++) {
            let type = list[i].getComponent(gridCmpt).type;
            if (App.gameCtr.sideObstacleList.indexOf(type) > -1) {
                obstacleList.push(list[i]);
            }
        }
        return obstacleList;
    }

    /**
     * 获取一颗糖果四周的糖果
     * 获取指定水果周围的相邻水果
     * @param {gridCmpt} grid - 中心水果组件
     * @returns {Node[]} 周围相邻的水果节点列表
     */
    getAroundGrid(grid: gridCmpt) {
        if (grid.type > Constant.NormalType) return [];
        let h = grid.h;
        let v = grid.v;
        let left = h - 1;
        let right = h + 1;
        let up = v + 1;
        let down = v - 1;
        let list = [];
        if (left >= 0 && this.blockArr[left][v]) {
            list.push(this.blockArr[left][v]);
        }
        if (right < Constant.layCount && this.blockArr[right][v]) {
            list.push(this.blockArr[right][v]);
        }
        if (down >= 0 && this.blockArr[h][down]) {
            list.push(this.blockArr[h][down]);
        }
        if (up < Constant.layCount && this.blockArr[h][up]) {
            list.push(this.blockArr[h][up]);
        }
        return list;
    }

    /**
     * 炸弹消除
     * 处理炸弹爆炸后的消除逻辑
     * @param {any[]} samelist - 炸弹影响的水果列表
     * @returns {Promise<void>} 异步操作，完成炸弹消除
     */
    private async handleSamelistBomb(samelist: gridCmpt[]) {
        if (samelist.length < 1) {
            return;
        }
        
        try {
            let soundList = ['combo_cool', 'combo_excellent', 'combo_good', 'combo_great', 'combo_perfect'];
            let rand = Math.floor(Math.random() * soundList.length);
            this.scheduleOnce(() => {
                if (this.isValid) {
                    AudioManager.getInstance().playSound(soundList[rand])
                }
            }, 0.2);
            
            // 移除
            for (let i = 0; i < samelist.length; i++) {
                let ele: gridCmpt = samelist[i];
                if (!ele || !ele.node || !ele.node.isValid) continue;
                
                /** 在这里检测糖果四周的障碍物 */
                let listAround = this.getAroundGrid(ele);
                let obstacleList = this.getObstacleList(listAround);
                if (obstacleList.length > 0) {
                    for (let m = 0; m < obstacleList.length; m++) {
                        let obstacle = obstacleList[m].getComponent(gridCmpt);
                        if (obstacle && obstacle.node && obstacle.node.isValid) {
                            this.destroyGridAndGetScore(obstacle);
                            console.log("有杂物")
                        }
                    }
                }
                this.destroyGridAndGetScore(ele);
            }

            await ToolsHelper.delayTime(0.2);
            await this.checkMoveDown();
        } catch (error) {
            console.error("handleSamelistBomb error:", error);
        }
    }
    /**
     * 合成炸弹
     * 将多个水果合成为炸弹
     * @param {gridCmpt[]} item - 要合成的水果列表
     */
    synthesisBomb(item: gridCmpt[]) {
        /** 先找当前item中是否包含curTwo,包含就以curTwo为中心合成 */
        let center: gridCmpt = null;
        for (let j = 0; j < item.length; j++) {
            for (let m = 0; m < this.curTwo.length; m++) {
                if (item[j].h == this.curTwo[m].h && item[j].v == this.curTwo[m].v) {
                    center = item[j];
                    break;
                }
            }
        }
        if (!center) {
            center = item[Math.floor(item.length / 2)];
        }
        let bombType = App.gameCtr.getBombType(item);
        AudioManager.getInstance().playSound("ui_banner_up_hide");
        for (let j = 0; j < item.length; j++) {
            let ele: gridCmpt = item[j];
            let tp = ele.type;
            let worldPosition = ele.node.worldPosition
            // this.flyItem(tp, worldPosition);
            // this.addScoreByType(tp);
            tween(ele.node).to(0.1, { position: this.blockPosArr[center.h][center.v] }).call((target) => {
                let gt = target.getComponent(gridCmpt);
                console.log(gt.h, gt.v)
                if (gt.h == center.h && gt.v == center.v) {
                    gt.setType(bombType);
                }
                else {
                    this.blockArr[gt.h][gt.v] = null;
                    gt.node.destroy();
                }
            }).start();

        }
    }
    /**
     * 去掉不合法的
     * 筛选出合法的消除组合
     * @param {any[]} samelist - 待检查的消除组合列表
     * @returns {any[]} 合法的消除组合列表
     */
    private jugetLegitimate(samelist: any[]) {
        let arr: any[] = [];
        for (let i = 0; i < samelist.length; i++) {
            let itemlist = samelist[i];
            let bool: boolean = this.startJuge(itemlist);
            if (bool) {
                arr.push(itemlist);
            }
        }
        return arr;
    }

    /**
     * 判断消除组合是否合法
     * 根据消除组合的长度判断是否合法
     * @param {gridCmpt[]} list - 消除组合列表
     * @returns {boolean} 是否合法
     */
    private startJuge(list: gridCmpt[]): boolean {
        let bool = false;
        let len = list.length;
        switch (len) {
            case 3:
                bool = this._atTheSameHorOrVer(list);
                break;

            case 4:
                bool = this._atTheSameHorOrVer(list);
                break;

            case 5:
                bool = this._atTheSameHorOrVer(list);
                if (!bool) {
                    bool = this._atLeastThreeSameHorAndVer(list);
                }
                break;

            case 6:
                bool = this._atLeastThreeSameHorAndVer(list);
                break;

            case 7:
                bool = this._atLeastThreeSameHorAndVer(list);
                break;

            default://全在行或者列
                bool = this._atLeastThreeSameHorAndVer(list);
                break;

        }
        return bool;
    }

    /**
     * 至少有三个同行且三个同列
     * 检查消除组合是否至少有三个同行和三个同列的水果
     * @param {gridCmpt[]} list - 消除组合列表
     * @returns {boolean} 是否满足条件
     */
    private _atLeastThreeSameHorAndVer(list: gridCmpt[]): boolean {
        let bool = false;
        let count = 0;
        //同一列
        for (let i = 0; i < list.length; i++) {
            let item1 = list[i];
            for (let j = 0; j < list.length; j++) {
                let item2 = list[j];
                if (item1.data.h == item2.data.h) {
                    count++;
                    break;
                }
            }
        }
        if (count < 3) return bool;
        count = 0;
        //同一行
        for (let i = 0; i < list.length; i++) {
            let item1 = list[i];
            for (let j = 0; j < list.length; j++) {
                let item2 = list[j];
                if (item1.data.v == item2.data.v) {
                    count++;
                    break;
                }
            }
        }
        if (count < 3) return bool;
        return true;
    }

    /**
     * 处在同一行/或者同一列
     * 检查消除组合是否在同一行或同一列
     * @param {gridCmpt[]} list - 消除组合列表
     * @returns {boolean} 是否在同一行或同一列
     */
    private _atTheSameHorOrVer(list: gridCmpt[]): boolean {
        let item = list[0];
        let bool = true;
        //同一列
        for (let i = 0; i < list.length; i++) {
            if (item.data.h != list[i].data.h) {
                bool = false;
                break;
            }
        }
        if (bool) return bool;
        bool = true;
        //同一行
        for (let i = 0; i < list.length; i++) {
            if (item.data.v != list[i].data.v) {
                bool = false;
                break;
            }
        }
        return bool;
    }
    /**
     * 去重复
     * 去除消除组合列表中的重复水果
     * @param {any[]} samelist - 消除组合列表
     */
    private _deleteDuplicates(samelist: any[]) {
        for (let i = 0; i < samelist.length; i++) {
            let itemlist = samelist[i];
            let bool = true;
            do {
                let count = 0;
                for (let m = 0; m < itemlist.length - 1; m++) {
                    for (let n = m + 1; n < itemlist.length; n++) {
                        if (itemlist[m].data.h == itemlist[n].data.h && itemlist[m].data.v == itemlist[n].data.v) {
                            samelist[i].splice(i, 1);
                            count++;
                            console.log('------------repeat----------');
                            break;
                        }
                    }
                }
                bool = count > 0 ? true : false;
            } while (bool);
        }
    }
    /**
     * 以当前滑块为中心沿水平方向检查
     * 检查水平方向上是否有可消除的水果组合
     * @param {gridCmpt} item - 中心水果组件
     * @returns {gridCmpt[]} 水平方向上的可消除水果列表
     */
    private _checkHorizontal(item: gridCmpt): gridCmpt[] {
        let arr: gridCmpt[] = [item];
        let startX = item.data.h;
        let startY = item.data.v;
        // 右边
        for (let i = startX + 1; i < this.H; i++) {
            if (!this.blockArr[i][startY]) break;
            let ele = this.blockArr[i][startY].getComponent(gridCmpt);
            if (!ele || item.getMoveState()) break;
            if (ele.type == item.type && ele.type < Constant.NormalType) {
                arr.push(ele);
            }
            else {
                break;
            }
        }
        // 左边
        for (let i = startX - 1; i >= 0; i--) {
            if (i < 0) break;
            if (!this.blockArr[i][startY]) break;
            let ele = this.blockArr[i][startY].getComponent(gridCmpt);
            if (!ele || item.getMoveState()) break;
            if (ele.type == item.type && ele.type < Constant.NormalType) {
                arr.push(ele);
            }
            else {
                break;
            }
        }
        if (arr.length < 3) return [];
        return arr;
    }

    /**
     * 以当前滑块为中心沿竖直方向检查
     * 检查竖直方向上是否有可消除的水果组合
     * @param {gridCmpt} item - 中心水果组件
     * @returns {gridCmpt[]} 竖直方向上的可消除水果列表
     */
    private _checkVertical(item: gridCmpt): gridCmpt[] {
        let arr: gridCmpt[] = [item];
        let startX = item.data.h;
        let startY = item.data.v;
        // 上边
        for (let i = startY + 1; i < this.V; i++) {
            if (!this.blockArr[startX][i]) break;
            let ele = this.blockArr[startX][i].getComponent(gridCmpt);
            if (!ele || item.getMoveState()) break;
            if (ele.type == item.type && ele.type < Constant.NormalType) {
                arr.push(ele);
            }
            else {
                break;
            }
        }
        // 下边
        for (let i = startY - 1; i >= 0; i--) {
            if (i < 0) break;
            if (!this.blockArr[startX][i]) break;
            let ele = this.blockArr[startX][i].getComponent(gridCmpt);
            if (!ele || item.getMoveState()) break;
            if (ele.type == item.type && ele.type < Constant.NormalType) {
                arr.push(ele);
            }
            else {
                break;
            }
        }
        if (arr.length < 3) return [];
        return arr;
    }

    /**
     * 数据交换，网格位置交换
     * 交换两个水果的数据和位置
     * @param {gridCmpt} item1 - 第一个水果组件
     * @param {gridCmpt} item2 - 第二个水果组件
     */
    changeData(item1: gridCmpt, item2: gridCmpt) {
        // 核心保护：确保组件和数据均有效，防止 Cannot read properties of null (reading 'h')
        if (!item1 || !item2 || !item1.data || !item2.data) {
            console.error("changeData failed: item or item.data is null.", { item1, item2 });
            return;
        }

        /** 数据交换 */
        let temp = item1.data;
        item1.data = item2.data;
        item2.data = temp;

        /** 位置交换 */
        let x1 = item1.data.h;
        let y1 = item1.data.v;
        let x2 = item2.data.h;
        let y2 = item2.data.v;
        
        // 索引越界检查
        if (!this.blockArr[x1] || !this.blockArr[x2]) return;

        let pTemp = this.blockArr[x1][y1];
        this.blockArr[x1][y1] = this.blockArr[x2][y2]
        this.blockArr[x2][y2] = pTemp;

        // 节点有效性检查后再初始化
        if (this.blockArr[x1][y1] && this.blockArr[x1][y1].isValid) {
            const comp = this.blockArr[x1][y1].getComponent(gridCmpt);
            if (comp && comp.data) {
                comp.initData(comp.data.h, comp.data.v);
            }
        }
        if (this.blockArr[x2][y2] && this.blockArr[x2][y2].isValid) {
            const comp = this.blockArr[x2][y2].getComponent(gridCmpt);
            if (comp && comp.data) {
                comp.initData(comp.data.h, comp.data.v);
            }
        }
    }

    /**
     * 是否点击在水果上
     * 检查点击位置是否在某个水果上
     * @param {Vec3} pos - 点击位置
     * @returns {gridCmpt} 点击的水果组件
     */
    checkClickOnBlock(pos: Vec3): gridCmpt {
        if (!this.isValid) return;
        if (this.blockArr.length < 1) return;
        for (let i = 0; i < this.H; i++) {
            for (let j = 0; j < this.V; j++) {
                let block = this.blockArr[i][j];
                if (block && block.getComponent(gridCmpt).type < Constant.NormalType) {
                    if (block.getComponent(gridCmpt).isInside(pos)) {
                        return block.getComponent(gridCmpt);
                    }
                }
            }
        }
        return null;
    }

    /**
     * 消除后向下滑动
     * 处理消除水果后，上方水果向下移动填补空缺
     * @returns {Promise<void>} 异步操作，完成水果下移
     */
    async checkMoveDown() {
        return new Promise<void>(async resolve => {
       
            
            for (let i = 0; i < this.H; i++) {
                let count = 0;
        
                
                for (let j = 0; j < this.V; j++) {
                    if (!this.isValid) {
                  
                        resolve();
                        return;
                    }
                    
                    let block = this.blockArr[i][j];
                    let isHide = App.gameCtr.checkInHideList(i, j);
                    
                   // console.log(`[Game] Checking position (${i}, ${j}): block=${!!block}, isHide=${isHide}, count=${count}`);
                    
                    if (!block) {
                        if (!isHide) {
                            count++;
                         //   console.log(`[Game] Empty position (${i}, ${j}), count increased to ${count}`);
                        } else {
                            //当前格子以下是不是全是边界空的，是边界空的就忽略，否则就+1
                            let bool = App.gameCtr.checkAllInHideList(i, j);
                           // console.log(`[Game] Hide position (${i}, ${j}), checkAllInHideList=${bool}, count=${count}`);
                            if (!bool && count > 0) {
                                count++;
                            //    console.log(`[Game] Hide position (${i}, ${j}) contributes to count, count increased to ${count}`);
                            }
                        }
                    }
                    else if (block && count > 0) {
                      //  console.log(`[Game] Found block at (${i}, ${j}) that needs to move down by ${count} positions`);
                        
                        let count1 = await this.getDownLastCount(i, j, count);
                     //   console.log(`[Game] Calculated final move count: ${count1}`);
                        
                        // 检查目标位置是否已经被占用
                        if (this.blockArr[i][j - count1]) {
                        //    console.log(`[Game] WARNING: Target position (${i}, ${j - count1}) is already occupied!`);
                        //    console.log(`[Game] Current block: ${block.getComponent(gridCmpt).h},${block.getComponent(gridCmpt).v}`);
                         //   console.log(`[Game] Occupying block: ${this.blockArr[i][j - count1].getComponent(gridCmpt).h},${this.blockArr[i][j - count1].getComponent(gridCmpt).v}`);
                        }
                        
                        this.blockArr[i][j] = null;
                        this.blockArr[i][j - count1] = block;
                        block.getComponent(gridCmpt).initData(i, j - count1);
                        this.resetTimeInterval();
                        
                       
                        
                        tween(block).to(0.5, { position: this.blockPosArr[i][j - count1] }, { easing: 'backOut' }).call(() => {
                           
                            resolve();
                        }).start();
                    }
                }
            }
            
         
            await this.checkReplenishBlock();
         
            resolve();  
        });
    }

    /**
     * 获取最终下落的格子数
     * 计算水果需要下落的最终格子数
     * @param {number} i - 水果的行坐标
     * @param {number} j - 水果的列坐标
     * @param {number} count - 初始下落格子数
     * @returns {Promise<number>} 异步操作，返回最终下落的格子数
     */
    async getDownLastCount(i, j, count): Promise<number> {
        return new Promise(resolve => {
            let tempCount = 0;
            let func = (i, j, count) => {
                tempCount = count;
                let bool = App.gameCtr.checkInHideList(i, j - count);
                if (bool || this.blockArr[i][j - count]) {
                    func(i, j, count - 1);
                }
            }
            func(i, j, count);
            resolve(tempCount);
        })
    }

    /**
     * 补充新水果填补空缺
     * 在空缺位置补充新的水果
     * @returns {Promise<void>} 异步操作，完成水果补充
     */
    async checkReplenishBlock() {
        return new Promise<void>(async resolve => {
           // console.log("[Game] Start checkReplenishBlock");
            
            for (let i = 0; i < this.H; i++) {
                for (let j = 0; j < this.V; j++) {
                    let block = this.blockArr[i][j];
                    let isHide = App.gameCtr.checkInHideList(i, j);
                    
                 //   console.log(`[Game] Checking position (${i}, ${j}) for replenish: block=${!!block}, isHide=${isHide}`);
                    
                    if (!block && !isHide) {
                     //   console.log(`[Game] Replenishing block at (${i}, ${j})`);
                        
                        let pos = this.blockPosArr[i][this.V - 1];
                     //   console.log(`[Game] New block starting position: (${pos.x}, ${pos.y})`);
                        
                        let block = this.addGrid(i, j, v3(pos.x, pos.y + Constant.Width + 20, 1));
                        this.blockArr[i][j] = block;
                        this.resetTimeInterval();
                        
                      //  console.log(`[Game] Dropping new block to (${i}, ${j})`);
                        
                        tween(block)
                            .to(0.5, { position: this.blockPosArr[i][j] }, { easing: 'backOut' })
                            .call(() => {
                              //  console.log(`[Game] New block dropped to (${i}, ${j}) successfully`);
                                resolve();
                            })
                            .start();
                    }
                }
            }
            
          //  console.log("[Game] Waiting for replenish delay");
            await ToolsHelper.delayTime(0.5);
          //  console.log("[Game] checkReplenishBlock completed");
            resolve();
        });
    }

    /**
     * 初始化布局
     * 初始化游戏网格布局和水果
     * @returns {Promise<void>} 异步操作，完成布局初始化
     */
    async initLayout() {
        this.clearData();
        await this.gridMgr.initGrid();
        this.hideList = App.gameCtr.hideList;
        let gap = 0;
        let count = 0;
        let width = Constant.Width;

        /** 先初始化网格坐标 */
        for (let i = 0; i < this.H; i++) {
            this.blockPosArr.push([]);
            this.blockArr.push([]);
            for (let j = 0; j < this.V; j++) {
                let xx = (width + gap) * (i + 0) - (width + gap) * (this.H - 1) / 2;
                let yy = (width + gap) * (j + 0) - (width + gap) * (this.V - 1) / 2;
                let pos = v3(xx, yy, 1);
                this.blockPosArr[i][j] = pos;
                this.blockArr[i][j] = null;
            }
        }
        /** 先初始化障碍物 */
        let obsList = this.AchievetheGoal[0];
        let count2 = 0;
        if (obsList[0] > Constant.NormalType) {
            let len = obsList[1];
            let c1 = Math.ceil(Math.sqrt(len));
            let start = Math.floor((Constant.layCount - c1) / 2);
            let end = start + c1;
            console.log("start=============== " + start);
            console.log("end=============== " + end);
            for (let m = start; m < end; m++) {
                for (let n = start; n < end; n++) {
                    if (count2 < len) {
                        let pos = this.blockPosArr[m][n];
                        let block = this.addGrid(m, n, pos, obsList[0]);
                        block.setScale(v3(0, 0, 0));
                        tween(block).to(0.5, { scale: v3(1, 1, 1) }).start();
                        this.blockArr[m][n] = block;
                    }
                    count2++;
                }
            }

        }

        /** 普通糖果 */
        for (let i = 0; i < this.H; i++) {
            for (let j = 0; j < this.V; j++) {
                if (App.gameCtr.hideFullList.length < this.H * this.V) {
                    App.gameCtr.hideFullList.push([i, j]);
                }
                let xx = (width + gap) * (i + 0) - (width + gap) * (this.H - 1) / 2;
                let yy = (width + gap) * (j + 0) - (width + gap) * (this.V - 1) / 2;
                let pos = v3(xx, yy, 1);
                if (App.gameCtr.checkInHideList(i, j)) {
                    this.blockArr[i][j] = null;
                    continue;
                }
                count++;
                let type = -1;
                if (this.blockArr[i][j])
                    continue;
                let block = this.addGrid(i, j, pos, type);
                block.setScale(v3(0, 0, 0));
                tween(block).to(count / 100, { scale: v3(1, 1, 1) }).start();
                this.blockArr[i][j] = block;
            }
        }
        await ToolsHelper.delayTime(0.8);
        // this.checkAgain();
        /** 进入游戏选择的道具炸弹 */
        // let list = App.gameCtr.toolsArr;
        // for (let i = 0; i < list.length; i++) {
        //     this.throwTools(list[i]);
        // }
        // App.gameCtr.toolsArr = [];
    }

    /**
     * 添加水果
     * 创建并添加新的水果水果到网格中
     * @param {number} i - 水果水果的行坐标
     * @param {number} j - 水果水果的列坐标
     * @param {Vec3} pos - 水果水果的位置
     * @param {number} type - 水果水果的类型，-1表示随机类型
     * @returns {Node} 创建的水果水果节点
     */
    addGrid(i: number, j: number, pos: Vec3 = null, type: number = -1) {
        let block = instantiate(this.gridPre);
        this.gridNode.addChild(block);
        block.getComponent(gridCmpt).initData(i, j, type);
        if (pos) {
            block.setPosition(pos);
        }
        return block;
    }

    /**
     * 清除数据
     * 清除游戏数据和水果
     * @description 重置游戏状态和数据，准备重新开始游戏
     */
    clearData() {
        App.gameCtr.resetHdeList(GameData.getCurLevel());
        if (this.blockArr.length < 1) return;
        for (let i = 0; i < this.H; i++) {
            for (let j = 0; j < this.V; j++) {
                let block = this.blockArr[i][j];
                if (block) {
                    block.destroy();
                }
            }
        }
        this.blockArr = [];
        this.blockPosArr = [];
        this.isStartChange = false;
        this.isStartTouch = false;
        // 2024-01-20: 重置等待状态
        this.isGameOverWaiting = false;
        this.gameOverWaitTime = 0;
    }

    // /** 加积分 */
    // addScoreByType(type: number) {
    //     if (type > this.data.blockRatio.length - 1) {
    //         type = this.data.blockRatio.length - 1;
    //     }
    //     let score = this.data.blockRatio[type];
    //     this.curScore += score;
    //     this.updateScorePercent();
    // }

    // 计算位置
    tempstartPos = new Vec3();
    tempendPos = new Vec3();
    /**
     * 飞舞动画
     * 播放水果消除后的飞舞动画
     * @param {number} type - 水果类型
     * @param {Vec3} pos - 水果位置
     * @param {Node} target - 目标节点
     * @returns {Promise<void>} 异步操作，完成飞舞动画
     */
    async flyItem(type: number, pos: Vec3, target: Node) {
        // 检查类型是否在映射数据中
        const typeIndex = this.data.mapData[0].m_id.indexOf(type);
        if (typeIndex < 0) return;

        // 从对象池获取水果实例
        const item = this.getFlyItemFromPool();
        if (!item) return;
        
        // 计算位置
        this.node.getComponent(UITransform).convertToNodeSpaceAR(pos, this.tempstartPos);
        this.node.getComponent(UITransform).convertToNodeSpaceAR(target.worldPosition, this.tempendPos);
        
        // 设置水果属性
        item.setPosition(this.tempstartPos);
        this.node.addChild(item);
        item.getComponent(gridCmpt).setType(type);
        
        // 使用 MoveManager 执行飞舞动画
        MoveManager.getInstance().flyItem(item, this.tempstartPos, this.tempendPos, undefined, () => {
            // 处理关卡目标
            this.handleLevelTarget(type);
            // 回收水果到对象池
            this.recycleFlyItemToPool(item);
            // 播放音效
            // AudioManager.getInstance().playSound('Full');
        });
    }

        /**
     * 飞舞动画到炮塔
     * 播放水果消除后的飞舞动画
     * @param {gridCmpt} ele - 水果组件
     * @param {Vec3} pos - 水果位置
     * @param {Node} target - 目标节点
     * @returns {Promise<void>} 异步操作，完成飞舞动画
     */
    async flyItemToTurret(ele: gridCmpt, pos: Vec3, target: Node) {

        // 从对象池获取水果实例
        const item = this.getFlyItemFromPool();
        if (!item) return;

        // 计算位置
        this.node.getComponent(UITransform).convertToNodeSpaceAR(pos, this.tempstartPos);
        this.node.getComponent(UITransform).convertToNodeSpaceAR(target.worldPosition, this.tempendPos);

        // 设置水果属性
        item.setPosition(this.tempstartPos);
        this.node.addChild(item);
        item.getComponent(gridCmpt).setType(ele.type);
        const gridData = {
            type: ele.type,
            attack: ele.getAttack()
        };
        // 使用 MoveManager 执行飞舞动画
        MoveManager.getInstance().flyItem(item, this.tempstartPos, this.tempendPos, 0.5, () => {
            //更新的炮塔的已经有的数量
            this.turret.addGridData(gridData);
            this.turret.getComponent(Turret).updateGridDataCountLb();
            // 处理关卡目标
            this.handleLevelTarget(gridData.type);
            // 回收水果到对象池
            this.recycleFlyItemToPool(item);
            // 播放音效
            // AudioManager.getInstance().playSound('Full');
        });
    }

    handleLevelTarget(type: number) {
        for (let i = 0; i < this.AchievetheGoal.length; i++) {
            if (type == this.AchievetheGoal[i][0]) {
                this.AchievetheGoal[i][1]--
                if (this.AchievetheGoal[i][1] < 0) {
                    this.AchievetheGoal[i][1] = 0;
                }
            }
        }
        this.updateTargetCount();
    }

    /*********************************************  btn *********************************************/
    /*********************************************  btn *********************************************/
    /*********************************************  btn *********************************************/
    // 重新开始游戏就是重头开始
    evtRestart() {
        this.loadExtraData(1);
        // 2026-01-22: 重启时也重新开始速度递增
        this.startSpeedIncrease();
    }
    /**
     *消除最前面3排水果水果
     */
    eliminateFrontNRows(rowsNum: number = 6) {
        // 假设 this.downGridManager 是 DownGridManager 的实例
        if (this.DownGridMgr) {
            const eliminatedPositions = this.DownGridMgr.eliminateFrontRows(rowsNum);

            eliminatedPositions.forEach((pos, index) => {
                // 释放特效粒子
                let particle = this.particleManager.playParticle('particle', new Vec3(pos.x, pos.y, pos.z));
                particle.children.forEach(item => {
                    item.active = +item.name == pos.type;
                    item.getComponent(ParticleSystem2D).resetSystem();
                });
                // 粒子特效播放完成后回收，设置0.8秒，只关注视觉爆炸时间
                this.particleManager.ParticleWithTimer('particle', particle, 0.8);
            });
        }
    }

    /** 设置 */
    onClick_setBtn() {
        // 2024-01-20: 游戏结束等待期间禁止操作
        if (this.isGameOverWaiting) return;
        App.gameCtr.setPause(true);
        LoaderManeger.instance.loadPrefab('prefab/ui/settingGameView').then((prefab) => {
            let settingNode = instantiate(prefab);
            ViewManager.show({
                node: settingNode,
                name: "SettingGameView"
            });
        });
    }

    /** 购买金币 */
    onClick_buyBtn() {
        // 2024-01-20: 游戏结束等待期间禁止操作
        if (this.isGameOverWaiting) return;
        AudioManager.getInstance().playSound('button_click');
        // App.view.openView(ViewName.Single.eBuyView);
           LoaderManeger.instance.loadPrefab('prefab/ui/getGold').then((prefab) => {
                let getGold = instantiate(prefab);
                ViewManager.show({
                    node: getGold,
                    name: "GetGold"
                });
            });
    }

    // /** 暂停 */
    // async onClick_pauseBtn() {
    //     AudioManager.getInstance().playSound('button_click');
    //     // App.view.openView(ViewName.Single.esettingGameView);
    //     LoaderManeger.instance.loadPrefab('prefab/ui/settingGameView').then((prefab) => {
    //         let settingNode = instantiate(prefab);
    //         ViewManager.show({
    //             node: settingNode,
    //             name: "SettingGameView"
    //         });
    //     });
    // }

    /** 添加道具，广告位 */
    onClickAddButton(btnNode: Node) {
        AudioManager.getInstance().playSound('button_click');
        let type: number = -1;
        switch (btnNode.name) {
            case "addBtn1":
                type = Bomb.bomb;
                break;
            case "addBtn2":
                type = Bomb.hor;
                break;
            case "addBtn3":
                type = Bomb.ver;
                break;
            case "addBtn4":
                type = Bomb.allSame;
                break;
            case "addBtn5":
                type = Bomb.changecolor;
                break;
        }

        if (type === -1) {
            return;
        }

        const cost = 100;
        const success = GameData.spendGold(cost);

        if (success) {
            GameData.setBomb(type, 1);
            this.updateToolsInfo();
        } else {
            LoaderManeger.instance.loadPrefab('prefab/ui/getGold').then((prefab) => {
                let getGold = instantiate(prefab);
                ViewManager.show({
                    node: getGold,
                    name: "GetGold"
                });
            });
        }
    }

    /** 通过分享获取道具 */
    private shareToGetProp(type: number) {
        if (CM.mainCH && CM.mainCH.share) {
            CM.mainCH.share((isSuccess: boolean) => {
                if (isSuccess) {
                    GameData.setBomb(type, 1);
                    this.updateToolsInfo();
                }
            });
        } else {
            console.error("分享功能不可用");
        }
    }

    onClickVideoButton(btnNode: Node) {
        // 2024-01-20: 游戏结束等待期间禁止操作
        if (this.gameState === GameState.GAME_OVER || this.isGameOverWaiting) return;
        AudioManager.getInstance().playSound('button_click');
        let type: number = -1;
        switch (btnNode.name) {
            case "video1":
                type = Bomb.bomb;
                break;
            case "video2":
                type = Bomb.hor;
                break;
            case "video3":
                type = Bomb.ver;
                break;
            case "video4":
                type = Bomb.allSame;
                break;
        }

        // 调用渠道的视频广告方法
        if (CM.mainCH && CM.mainCH.showVideoAd) {
            CM.mainCH.showVideoAd((isSuccess: boolean) => {
                if (isSuccess) {
                    // 视频观看成功，增加道具数量
                    GameData.setBomb(type, 1);
                    this.updateToolsInfo();
                }
            });
        }
    }
    /** 道具使用状态：防止道具重复使用的标记 */
    private isUsingBomb: boolean = false;
    /** 道具 */
    onClickToolButton(btnNode: Node) {
        // 2024-01-20: 游戏结束等待期间禁止操作
        if (this.isGameOverWaiting) return;
        if (this.getTimeInterval() > 0) {
            ViewManager.toast("操作太快")
            return;
        }

        AudioManager.getInstance().playSound('button_click');
        if (this.isUsingBomb) return;
        this.isUsingBomb = true;
        this.scheduleOnce(() => {
            this.isUsingBomb = false;
            this.isStartChange = false;
            this.isStartTouch = false;
        }, 1);
        let type: number = -1;
        switch (btnNode.name) {
            case "toolBtn1":
                type = Bomb.bomb;
                break;
            case "toolBtn2":
                type = Bomb.hor;
                break;
            case "toolBtn3":
                type = Bomb.ver;
                break;
            case "toolBtn4":
                type = Bomb.allSame;
                break;
            case "toolBtn5":
                type = Bomb.changecolor;
                break;
        }
        let bombCount = GameData.getBomb(type);
        if (bombCount <= 0) {
            ViewManager.toast("道具数量不足");
            return;
        }
        GameData.setBomb(type, -1);
        
        let pos = this.gridMgr.node.getComponent(UITransform).convertToNodeSpaceAR(btnNode.worldPosition);
        // 2026-01-22: 特殊处理 changecolor：直接释放技能，不生成炸弹
        // 技能效果：将棋盘上数量最少的一种水果，全部变成下方(DownGridMgr)数量最多的那种类型
        if (type === Bomb.changecolor) {
            this.updateToolsInfo();
            this.triggerChangeColorSkill(pos);
            return;
        }
        this.throwTools(type, pos);
        this.updateToolsInfo();
    }

    /**
     * 触发变色技能
     */
    triggerChangeColorSkill(pos: Vec3) {
        // 1. 找 DownGridMgr 中最多的类型
        let targetType = this.DownGridMgr.getMostFrequentType();
        
        // 如果下方没有怪，或者 targetType 无效，随机选一个普通类型
        if (targetType === -1) {
             targetType = Math.floor(Math.random() * (App.gameCtr.blockCount || 5));
        }

        // 2. 优化：获取棋盘上数量最多的普通类型及其对应的组件列表
        let result = this.getMostFrequentNormalTypeInfo();
        
        if (result.type === -1 || result.list.length === 0) {
            ViewManager.toast("棋盘上没有可消除的水果");
            return; 
        }

        // 3. 锁定玩家操作，防止技能期间被干扰
        this.isStartChange = true;
        this.isChecking = true;

        // 4.飞特效：从道具按钮位置飞向目标水果
        let hasChange = false;
        // 记录完成的动画数量
        let finishedCount = 0;
        let totalCount = result.list.length;

        // 定义完成回调：当所有特效都播放完毕或变色完成后，解除锁定
        const onSkillComplete = () => {
            finishedCount++;
            if (finishedCount >= totalCount) {
                // 所有变色都已完成，解除锁定
                this.isStartChange = false;
                this.isChecking = false;
                console.log("ChangeColor skill completed, input unlocked.");
            }
        };
        
        // 4. 直接使用返回的列表进行变换，无需再次遍历棋盘
        for (let gc of result.list) {
            if (gc && gc.isValid) {
                // 创建并移动特效
                let effect = this.particleManager.playParticle('bulletParticle', pos);
                if (effect) {
                    MoveManager.getInstance().moveToTargetWithBezier(effect, gc.node, 0.5, () => {
                        // 特效到达后回收并变色
                        this.particleManager.releaseParticle('bulletParticle', effect);
                        if (gc && gc.isValid) {
                            gc.setType(targetType);
                        }
                        onSkillComplete(); // 动画完成回调
                    });
                } else {
                    // 特效失败直接变色
                    gc.setType(targetType);
                    onSkillComplete(); // 立即回调
                }
                hasChange = true;
            } else {
                // 如果节点无效，也算作完成，防止死锁
                onSkillComplete();
            }
        }
        
        if (hasChange) {
            AudioManager.getInstance().playSound("prop_bomb"); 
        } else {
            // 如果没有发生任何改变（例如列表全空或全无效），立即解锁
            this.isStartChange = false;
            this.isChecking = false;
        }

    }

    /**
     * 获取棋盘上数量最多的普通水果信息
     * 优化：一次遍历同时获取类型和所有对应的组件列表，提升性能
     */
    getMostFrequentNormalTypeInfo(): { type: number, list: gridCmpt[] } {
        // 键：类型，值：该类型的组件数组
        let typeGroups = new Map<number, gridCmpt[]>();
        
        // 统计所有普通类型
        for (let i = 0; i < this.H; i++) {
            for (let j = 0; j < this.V; j++) {
                let block = this.blockArr[i][j];
                if (block && block.isValid) {
                    let gc = block.getComponent(gridCmpt);
                    if (gc && gc.type < Constant.NormalType) { // 只统计普通类型
                        if (!typeGroups.has(gc.type)) {
                            typeGroups.set(gc.type, []);
                        }
                        typeGroups.get(gc.type).push(gc);
                    }
                }
            }
        }
        
        let maxCount = 0;
        let maxType = -1;
        let maxList: gridCmpt[] = [];
        
        for (let [type, list] of typeGroups) {
            if (list.length > maxCount) {
                maxCount = list.length;
                maxType = type;
                maxList = list;
            }
        }
        
        return { type: maxType, list: maxList };
    }
    
    /**
     * 提示可以交换的水果
     * 从棋盘中找到第一组通过一次交换即可形成三消的组合
     * 逻辑：
     * 1. 遍历 blockArr 中每个格子，调用 GameCtr.checkTipsGroup 检测该格子为中心时是否存在可消除组合
     * 2. 过滤掉包含特殊类型水果（type > NormalType）的组合
     * 3. 一旦找到第一组合法组合，立即在界面上显示提示并返回该组合
     * @param isGuide 是否为引导模式（true 时调用 showTipsGuide，false 调用 showTips）
     * @returns 第一组可用提示组合（group 列表）；找不到则返回 null
     */
    onClick_tipsBtn(isGuide: boolean=false): Node[] | null {
        // 2024-01-20: 游戏结束等待期间禁止操作
        if (this.isGameOverWaiting) return null;

        if (!this.blockArr || this.blockArr.length === 0) {
            return null;
        }
        for (let i = 0; i < this.H; i++) {
            for (let j = 0; j < this.V; j++) {
                if (!this.blockArr[i]) continue;
                let node = this.blockArr[i][j];
                if (!node) continue;
                let ele = node.getComponent(gridCmpt);
                if (!ele) continue;
                let arr = App.gameCtr.checkTipsGroup(ele, this.blockArr);
                if (arr.length > 0) {
                    let count = 0;
                    for (let m = 0; m < arr.length; m++) {
                        if (arr[m].getComponent(gridCmpt).type > Constant.NormalType) {
                            count++;
                        }
                    }
                    if (count == 0) {
          
                        arr.forEach(item => {
                            if (isGuide) {
                                item.getComponent(gridCmpt).showTipsGuide(true);
                            } else {
                                item.getComponent(gridCmpt).showTips();
                            }
                        })
                        return arr;
                    }
                }
            }
        }

        ViewManager.toast("没有可以交换的糖果了");
        return null;
    }

    /**
     * 获取提示组合中需要移动的格子以及移动方向
     * 逻辑修正：
     * 1. 遍历 group 中的每一个格子，检查它是否可以通过与“外部”的某个格子交换来形成消除。
     *    注意：这里的“外部”指的是 group 列表之外的格子，或者是 group 内部但位置不对的格子。
     *    实际上，提示系统返回的 group 是指“这几个格子将会连成一线”。
     *    所以我们需要找的是：谁移动一步，就能让这几个格子（可能加上移动的目标格子）连起来。
     * 2. 遍历 group 中的每个格子，尝试往 4 个方向交换。
     * 3. 关键点：我们不仅要看能不能消除，还要看消除的主体是不是 group 里的这些格子。
     *    不过简化逻辑，只要能促成三消，就是有效提示。
     * @param group onClick_tipsBtn 返回的组合结果
     */
    /**
     * 获取提示组合中需要移动的格子以及移动方向
     * 逻辑修正：
     * 完全基于几何位置分析，不再进行模拟交换
     * 核心思想：给定的3个格子中，必然有两个构成了“消除基座”（相邻或隔一格），
     * 第三个格子（Mover）就在基座的“补位点”旁边。
     * @param group onClick_tipsBtn 返回的组合结果
     */
    getTipsMoveInfo(group: Node[] | null): { grid: gridCmpt, dir: Direction } | null {
        if (!group || group.length < 3) return null;

        // 提取组件
        let comps: gridCmpt[] = [];
        for (let i = 0; i < group.length; i++) {
            if (group[i] && group[i].isValid) {
                let c = group[i].getComponent(gridCmpt);
                if (c) comps.push(c);
            }
        }
        if (comps.length < 3) return null;

        // 遍历所有可能的两两组合作为“基座”
        // 性能说明：通常 group 只有 3 个元素，循环次数极少 (C(3,2)=3次)，
        // 即使是 5 连消提示 (C(5,2)=10次)，性能消耗也可忽略不计。
        for (let i = 0; i < comps.length; i++) {
            for (let j = i + 1; j < comps.length; j++) {
                let c1 = comps[i];
                let c2 = comps[j];

                // 快速剪枝：如果两个基座距离太远（曼哈顿距离 > 2），直接跳过
                // 因为即使是夹心型 X_X，坐标差最大也是 2。
                if (Math.abs(c1.data.h - c2.data.h) > 2 || Math.abs(c1.data.v - c2.data.v) > 2) {
                    continue;
                }

                // 检查函数：判断 Mover 是否在补位点旁边
                // 使用闭包避免创建 holes 数组，减少 GC
                const checkHoleAndFindMover = (holeH: number, holeV: number): { grid: gridCmpt, dir: Direction } | null => {
                     // 坐标合法性检查
                    if (holeH < 0 || holeH >= this.H || holeV < 0 || holeV >= this.V) return null;

                    // 在剩余的格子中寻找“Mover”
                    for (let k = 0; k < comps.length; k++) {
                        if (k === i || k === j) continue;
                        let mover = comps[k];

                        let dh = holeH - mover.data.h;
                        let dv = holeV - mover.data.v;

                        // 判断是否相邻 (曼哈顿距离为1)
                        if (Math.abs(dh) + Math.abs(dv) === 1) {
                            let dir: Direction;
                            if (dh === 1) dir = Direction.right;
                            else if (dh === -1) dir = Direction.left;
                            else if (dv === 1) dir = Direction.up;
                            else dir = Direction.down;
                            
                            if (DEV) {
                                console.log(`Tips Geometric: Found pair (${c1.data.h},${c1.data.v})&(${c2.data.h},${c2.data.v}), Mover (${mover.data.h},${mover.data.v}) -> ${dir}`);
                            }
                            return { grid: mover, dir: dir };
                        }
                    }
                    return null;
                };

                // 检查水平关系
                if (c1.data.v === c2.data.v) {
                    let diffH = Math.abs(c1.data.h - c2.data.h);
                    if (diffH === 1) { 
                        // 情况1：XX型（相邻），补位点在两头：_XX 或 XX_
                        let res = checkHoleAndFindMover(Math.min(c1.data.h, c2.data.h) - 1, c1.data.v);
                        if (res) return res;
                        res = checkHoleAndFindMover(Math.max(c1.data.h, c2.data.h) + 1, c1.data.v);
                        if (res) return res;
                    } else if (diffH === 2) {
                        // 情况2：X_X型（夹心），补位点在中间
                        let res = checkHoleAndFindMover((c1.data.h + c2.data.h) / 2, c1.data.v);
                        if (res) return res;
                    }
                }
                // 检查垂直关系
                else if (c1.data.h === c2.data.h) {
                    let diffV = Math.abs(c1.data.v - c2.data.v);
                    if (diffV === 1) {
                        // 情况3：垂直相邻，补位点在上下
                        let res = checkHoleAndFindMover(c1.data.h, Math.min(c1.data.v, c2.data.v) - 1);
                        if (res) return res;
                        res = checkHoleAndFindMover(c1.data.h, Math.max(c1.data.v, c2.data.v) + 1);
                        if (res) return res;
                    } else if (diffV === 2) {
                        // 情况4：垂直夹心，补位点在中间
                        let res = checkHoleAndFindMover(c1.data.h, (c1.data.v + c2.data.v) / 2);
                        if (res) return res;
                    }
                }
            }
        }

        return null;
    }

    // canSwapFormMatch removed

    /**
     * 从对象池获取火箭效果
     */
    private getRocketFromPool(): Node {
        if (this.rocketPool.length > 0) {
            let rocket = this.rocketPool.pop();
            rocket.active = true;
            return rocket;
        } else {
            return instantiate(this.rocketPre);
        }
    }

    /**
     * 回收火箭效果到对象池
     */
    private recycleRocket(rocket: Node) {
        if (this.rocketPool.length < this.rocketPoolCapacity) {
            rocket.active = false;

            // 重置位置到初始点，避免下次使用时位置错误
            rocket.setPosition(v3(0, 0, 0));
            this.rocketPool.push(rocket);
        } else {
            rocket.destroy();
        }
    }

    onClick_xialevelbtn() {
        AudioManager.getInstance().playSound('button_click');
        // 发送事件
        EventManager.emit(EventName.Game.NextLevel);

    }

    updateLevelLb() {
        this.levelLb.getComponent(Label).string = '第 ' + App.gameCtr.curLevel.toString() + ' 关';
    }

    
    upTurret() {
        if (this.turret) {
            this.turret.gridDataList = [];
            this.turret.updateGridDataCountLb();
            this.turret.updateCapacityView();
        }
    }

    /**
     * 开始游戏录屏
     * 在开始关卡时调用渠道的录屏功能
     */
    private startGameRecorder() {
        if (CM.mainCH && CM.mainCH.startGameRecorderManager) {
            CM.mainCH.startGameRecorderManager();
            console.log('开始游戏录屏');
        } else {
            console.log('当前平台不支持录屏功能');
        }
    }

    /**
     * 结束录屏
     * 在游戏结束时调用渠道的录屏功能
     */
    private endGameRecorder() {
        if (CM.mainCH && CM.mainCH.stopGameRecorderManager) {
            CM.mainCH.stopGameRecorderManager();
            console.log('结束游戏录屏');
        } else {
            console.log('当前平台不支持录屏功能');
        }
    }
    
}
