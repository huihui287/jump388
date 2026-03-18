import { _decorator, Component, Node, Prefab, instantiate, Vec3, v3, NodePool, UITransform } from 'cc';
import LoaderManeger from '../../sysloader/LoaderManeger';
import { App } from '../../Controller/app';
import { PedalType, PedalDefaults, PedalDefaultsLowLayer, PedalSkill, SkillWeights } from '../../Tools/enumPedal';
import { Pedal } from '../Pedal/Pedal';
import { Hero } from '../Hero';
import GameData from '../../Common/GameData';
import EventManager from '../../Common/view/EventManager';
import { EventName } from '../../Tools/eventName';
import { Constant } from '../../Tools/enumConst';
import { LevelConfig, PedalRunRule } from '../../Tools/levelConfig';
import { PedalSkillRegistry } from '../Skill/PedalSkillRegistry';

const { ccclass } = _decorator;
/**
 * 踏板对象池管理类
 */
@ccclass('pedalManager')
export class pedalManager extends Component {

    /** 踏板预制体映射 */
    private _pedalPrefabs: Map<PedalType, Prefab> = new Map();

    /** 踏板对象池映射 */
    private _pedalPools: Map<PedalType, NodePool> = new Map();
    /** 踏板技能预制体映射 */
    private _skillPrefabs: Map<PedalSkill, Prefab> = new Map();
    /** 踏板技能对象池映射 */
    private _skillPools: Map<PedalSkill, NodePool> = new Map();

    /** 初始池大小 */
    private initialPoolSize: number = 10;
    
    /** 当前活跃的踏板列表 */
    private _activePedals: Node[] = [];
    
    /** 上一个踏板的位置 */
    private _lastPedalPosition: Vec3 = v3(0, 0, 0);
    /** 上一个生成的踏板类型 */
    private _lastPedalType: PedalType = PedalType.WOOD;

    /** 米 *////这个米是虚拟屏幕橡树的
    private HeroRice: number = 0;
    /**生成pedal一共的高度 */
    private PedalRice: number = 0;

    /** 所有Rice的比例 */
    private AllRiceBei: number = 100;


    ///////////////////////////////////////////////////////////////////////////

    /** 生成了的层数 */
    private NewlayerS: number = 0;

    /** 需要生成所有层的数量 */
    private AlllayerNum: number = 0;

    /**
     * 关卡踏板类型剩余生成次数（来自 LevelConfigs[level].pedalTypeCounts）
     * 说明：
     * - 数值表示“最多生成 N 次”，每生成一次会扣减 1
     * - 当某个类型剩余次数为 0 时，该类型不会再被生成（包括连续段）
     */
    private _pedalTypeRemaining: Partial<Record<PedalType, number>> = {};

    /**
     * 关卡连续段规则（来自 LevelConfigs[level].pedalRunRules）
     * - 在指定层数区间内，为某个类型生成连续段
     */
    private _pedalRunRules: PedalRunRule[] = [];

    /**
     * 本关允许出现的技能列表（来自 LevelConfigs[level].enabledPedalSkills）
     * - 仅用于“生成哪种技能”的随机过滤
     * - 若为空，则按全局配置随机（兼容旧逻辑）
     */
    private _enabledPedalSkills: PedalSkill[] = [];
    /**
     * GOLD_RAIN 在本关已生成的次数（限制“技能出现次数”，不是“技能触发次数”）
     */
    private _goldRainSpawnedThisLevel: number = 0;
    /**
     * GOLD_RAIN 每关最多出现次数
     */
    private readonly _goldRainMaxPerLevel: number = 3;

    /**
     * 当前连续段状态
     * - 当 _currentRunRemaining > 0 时，后续生成继续返回 _currentRunType
     */
    private _currentRunType: PedalType | null = null;
    private _currentRunRemaining: number = 0;
    
    /** 通关奖励金币 */
    private goldReward: number = 0;
    /** 踏板金币技能奖励 */
    private pedalGold: number = 0;

    /////////////////////////////////////////////////////////////////////////////////
    /** Hero 引用，用于计算 AllRice */
    private hero: Node | null = null;
    /** 起始 Y 坐标，用于计算偏移 */
    private startY: number = 0;
    private _configReady: boolean = false;
    private _poolsReady: boolean = false;

    /** 上一次生成的技能 */
    private _lastSkill: PedalSkill = PedalSkill.NONE;
    private _blockSpikeForPedals: number = 0;
    /**
     * 是否“允许生成下一次尖刺”
     * - true：代表系统已经生成了 SHIELD 踏板，允许在间隔 2 个踏板后生成一次 SPIKE
     * - false：代表当前不允许生成 SPIKE（要么还没生成护盾，要么已经生成过一次 SPIKE 消耗了许可）
     *
     * 说明：遵循用户需求，尖刺不能单独出现，必须在生成护盾后间隔 2 个踏板再生成。
     */
    private _spikePermitFromShield: boolean = false;

    /**
     * 设置 Hero 引用
     * @param heroNode 
     */
    public setHero(heroNode: Node) {
        this.hero = heroNode;
        this.startY = heroNode.position.y;
        this._lastPedalPosition.set(0,  - Constant.Height / 2, 0);
    }

    protected onLoad(){
        EventManager.on(EventName.Game.ReleaseObject, this.onReleaseObject, this);
    }

    protected onDestroy(): void {
        EventManager.off(EventName.Game.ReleaseObject, this.onReleaseObject, this);
    }

    init() {
        this.recycleAllPedals();
        this._configReady = false;

        this.NewlayerS = 0;
        this.HeroRice = 0;
        this.PedalRice = 0;
        this.tempAllRice = 0;
        this._lastPedalType = PedalType.WOOD;
        this._lastSkill = PedalSkill.NONE;
        this._blockSpikeForPedals = 0;
        this._spikePermitFromShield = false;
        this._pedalTypeRemaining = {};
        this._pedalRunRules = [];
        this._enabledPedalSkills = [];
        this._goldRainSpawnedThisLevel = 0;
        this._currentRunType = null;
        this._currentRunRemaining = 0;
        
        if (this.hero) {
            this.setHero(this.hero);
        }
    }
    
    start() {

    }
    /** 临时变量，用于存储上一次的 AllRice 值 */
    private tempAllRice: number = 0;

    update(_deltaTime: number) {
        if (App.gameCtr.isPause) return;
        if (this._configReady && this._poolsReady && this.hero) {
            // 计算当前高度差 (AllRice)
            // 假设 1 像素 = 1 米 (或者按需缩放，例如 / 10)
            this.tempAllRice = this.hero.position.y - this.startY;
            this.HeroRice = this.tempAllRice >= this.HeroRice ? this.tempAllRice :this.HeroRice;

            // 检查是否需要生成新的踏板
            this.checkAndSpawnPedals();

            // 检查并回收屏幕下方的踏板
            this.checkAndRecyclePedals();
        }
    }
    
    /**
     * 检查并回收屏幕下方的踏板
     */
    private checkAndRecyclePedals() {
        if (!this.hero) return;

        // 计算屏幕下边界
        const recycleThreshold = this.hero.position.y - Constant.Height / 2 - 200;

        // 创建一个副本进行遍历，避免在遍历过程中修改数组导致的问题
        // 或者使用倒序遍历
        // 既然是从前往后回收（最下面的先回收），使用 while 循环是可行的，但为了避免潜在的死循环（例如 recyclePedal 失败没有移除）
        // 我们改用一次遍历处理
        
        // 收集需要回收的节点
        const toRecycle: Node[] = [];
        
        for (let i = 0; i < this._activePedals.length; i++) {
            const pedalNode = this._activePedals[i];
            if (pedalNode.position.y < recycleThreshold) {
                toRecycle.push(pedalNode);
            }
        }

        // 执行回收
        if (toRecycle.length > 0) {
            for (const node of toRecycle) {
                this.recyclePedal(node);
            }
        }
    }
    async loadtPools() {
      // 确保对象池已初始化
        if (this._pedalPools.size === 0) {
            try {
                await this.initPools();
                this._poolsReady = true;
            } catch (error) {
                console.error("Failed to initialize pools:", error);
            }
        } else {
            this._poolsReady = true;
        }
    }
    /**
     * 加载踏板相关配置
     * 说明：
     * - 踏板物理属性统一走 PedalDefaults（代码内维护），不再从 CSV 读取。
     * - 这里仍保留异步接口，方便保持外部 await 调用结构不变（例如 Game 初始化流程）。
     */
    public async loadPedalConfig(): Promise<void> {
        const level = GameData.getCurLevel();
        const config = LevelConfig.getConfig(level);
        this.goldReward = config.goldReward;
        this.pedalGold = config.pedalGold;

        this._pedalTypeRemaining = {};
        if (config.pedalTypeCounts) {
            const allTypes: PedalType[] = Object.keys(PedalType).map((k) => PedalType[k as keyof typeof PedalType]);
            let total = 0;
            for (const t of allTypes) {
                const n = Math.max(0, Math.floor(Number(config.pedalTypeCounts[t] ?? 0)));
                this._pedalTypeRemaining[t] = n;
                total += n;
            }
            this.AlllayerNum = Math.max(1, total);
        } else {
            this.AlllayerNum = config.AlllayerNum;
        }

        this._pedalRunRules = config.pedalRunRules ?? [];
        this._enabledPedalSkills = config.enabledPedalSkills ?? [];
        this._goldRainSpawnedThisLevel = 0;
        this._currentRunType = null;
        this._currentRunRemaining = 0;
        this._configReady = true;
    }

    /**
     * 强制生成第一个踏板（如果尚未生成）并返回该节点
     * 用于初始化 Hero 位置
     */
    public spawnFirstPedal(): Node | null {
        // 如果已经有踏板，直接返回第一个
        if (this._activePedals.length > 0) {
             console.warn("this._activePedals[0]");
            return this._activePedals[0];
        }

        // 确保配置已就绪
        if (!this._configReady || !this._poolsReady) {
            console.warn("Cannot spawn first pedal: Config or Pools not ready.");
            return null;
        }

        // 强制生成一个踏板
        this.spawnNextPedal();
        
        // 返回刚刚生成的踏板
        return this.getLastPedal();
    }

    /**
     * 检查并生成新踏板
     * 当最后一个踏板距离 屏幕上面的距离 不够远时，继续生成
     */
    private checkAndSpawnPedals() {
        // 如果生成的层数已经达到总层数，停止生成
        if (this.NewlayerS >= this.AlllayerNum) {
            return;
        }

        const spawnThreshold = Constant.Height * 0.8;
        if (!this.hero) return;
        const visibleTopY = this.hero.position.y + Constant.Height / 2;
        if (this._lastPedalPosition.y-visibleTopY < spawnThreshold) {
            this.spawnNextPedal();
        }
    }

    /**
     * 生成下一个踏板，根据 AllRice 和 Rice 数组决定类型
     */
    private spawnNextPedal() {
        const targetType = this.getNextPedalType();
        const defaults = this.NewlayerS < 30 ? PedalDefaultsLowLayer : PedalDefaults;
        const def = defaults[targetType];
        this.spawnPedal(
            targetType,
            def.jumpForce,
            def.jumpSpeed,
            def._gravity,
            def.minYInterval,
            def.maxYInterval,
            def.moveSpeed,
            def.moveTime,
            def.moveDistance,
        );
    }

    /**
     * 获取下一个踏板类型
     * 说明：
     * - pedalTypeCounts 作为“剩余次数上限”：每生成一次会扣减 1，用完就不出
     * - 第 0 层固定生成 PEDAL1（会计入 PEDAL1 的剩余次数扣减）
     * - 后续层数从“剩余次数 > 0”的类型中随机抽取
     * - 若命中 pedalRunRules，则在规则区间内按 [minRun,maxRun] 随机出连续段长度（连续段同样受剩余次数约束）
     */
    private getNextPedalType(): PedalType {
        if (this.NewlayerS === 0) {
            const rem = Math.max(0, Math.floor(Number(this._pedalTypeRemaining[PedalType.PEDAL1] ?? 0)));
            if (rem > 0) {
                this._pedalTypeRemaining[PedalType.PEDAL1] = rem - 1;
            }
            return PedalType.PEDAL1;
        }

        const layer = this.NewlayerS;

        if (this._currentRunType && this._currentRunRemaining > 0) {
            const rem = Math.max(0, Math.floor(Number(this._pedalTypeRemaining[this._currentRunType] ?? 0)));
            if (rem > 0) {
                this._pedalTypeRemaining[this._currentRunType] = rem - 1;
                this._currentRunRemaining -= 1;
                return this._currentRunType;
            }
            this._currentRunType = null;
            this._currentRunRemaining = 0;
        }

        // 直接通过随机抽取获取下一个类型（已包含层数合法性判定和剩余次数判定）
        const selected = this.pickPedalTypeByRemaining(layer);

        const selectedRem = Math.max(0, Math.floor(Number(this._pedalTypeRemaining[selected] ?? 0)));
        if (selectedRem > 0) {
            this._pedalTypeRemaining[selected] = selectedRem - 1;
        }

        // 检查该类型在当前层数是否配置了“连续段”规则
        const rule = this.findRunRule(selected, layer);
        if (rule) {
            const runLen = this.randomInt(rule.minRun, rule.maxRun);
            this._currentRunType = selected;
            const remainAfterPick = Math.max(0, Math.floor(Number(this._pedalTypeRemaining[selected] ?? 0)));
            const maxAdditionalByRange = Math.max(0, Math.floor(Number(rule.toLayer)) - layer);
            const additional = Math.min(Math.max(0, runLen - 1), remainAfterPick, maxAdditionalByRange);
            this._currentRunRemaining = additional;
            if (additional <= 0) {
                this._currentRunType = null;
                this._currentRunRemaining = 0;
            }
        } else {
            this._currentRunType = null;
            this._currentRunRemaining = 0;
        }

        return selected;
    }

    /**
     * 按“剩余次数”随机抽取一个踏板类型
     * 说明：
     * - 候选仅包含“剩余次数 > 0”的类型
     * - PEDAL1 在第 0 层固定生成；若配置里 PEDAL1 > 1，则后续层数也可能随机到 PEDAL1
     * - 若所有类型剩余次数都为 0，则回退为 WOOD
     */
    private pickPedalTypeByRemaining(layer: number): PedalType {
        const allTypes: PedalType[] = Object.keys(PedalType).map((k) => PedalType[k as keyof typeof PedalType]);
        const candidates: PedalType[] = [];

        for (const t of allTypes) {
            const remain = Math.max(0, Math.floor(Number(this._pedalTypeRemaining[t] ?? 0)));
            if (remain <= 0) continue;
            if (!this.isPedalTypeAllowedInLayer(t, layer)) continue;
            candidates.push(t);
        }

        if (candidates.length <= 0) return PedalType.WOOD;

        // 完全等概率随机抽取一个合法的类型
        const randomIndex = Math.floor(Math.random() * candidates.length);
        return candidates[randomIndex];
    }

    /**
     * 检查某个类型是否在当前层数允许使用
     * 说明：
     * - layer 是“非 PEDAL1 的层数”，从 1 开始
     */
    private isPedalTypeAllowedInLayer(type: PedalType, layer: number): boolean {
        if (!this._pedalRunRules || this._pedalRunRules.length === 0) return true;

        let hasRule = false;
        for (const r of this._pedalRunRules) {
            if (r.pedalType !== type) continue;
            hasRule = true;
            if (layer >= Number(r.fromLayer) && layer <= Number(r.toLayer)) return true;
        }

        return !hasRule;
    }

    /**
     * 查找某个类型在当前层数是否命中连续段规则
     * 说明：
     * - layer 是“非 PEDAL1 的层数”，从 1 开始
     */
    private findRunRule(type: PedalType, layer: number): PedalRunRule | null {
        if (!this._pedalRunRules || this._pedalRunRules.length === 0) return null;
        for (const r of this._pedalRunRules) {
            if (r.pedalType !== type) continue;
            if (layer < Number(r.fromLayer) || layer > Number(r.toLayer)) continue;
            return r;
        }
        return null;
    }

    /**
     * 获取闭区间 [min,max] 的随机整数
     * 说明：
     * - min 至少为 1
     * - max 小于 min 时会被提升到 min
     */
    private randomInt(minVal: number, maxVal: number) {
        const min = Math.max(1, Math.floor(Number(minVal)));
        const max = Math.max(min, Math.floor(Number(maxVal)));
        return min + Math.floor(Math.random() * (max - min + 1));
    }

    /**
     * 随机生成踏板技能
     * 规则与旧实现保持一致，但把“权重/门槛/去重”等逻辑收敛到 PedalSkillRegistry 里统一维护。
     */
    private RandomSkill(): PedalSkill {
        /**
         * 生成规则（按用户最新需求）：
         * 1) 尖刺不能单独出现，必须在生成护盾技能后，间隔 2 个踏板再生成。
         * 2) 当系统生成了 SHIELD 技能后，设置 _blockSpikeForPedals = 2 和 _spikePermitFromShield = true。
         * 3) 在间隔期间（_blockSpikeForPedals > 0），不允许生成 SPIKE。
         * 4) 当间隔结束（_blockSpikeForPedals == 0 且有许可时），强制生成一次 SPIKE 并消耗许可。
         */
        const heroComp = this.hero ? this.hero.getComponent(Hero) : null;
        const goldWeightMul = heroComp ? heroComp.getGoldPedalWeightMultiplier() : 1;

        let selectedSkill: PedalSkill = PedalSkill.NONE;

        const spikeEnabled =
            this._enabledPedalSkills.length <= 0 || this._enabledPedalSkills.indexOf(PedalSkill.SPIKE) !== -1;
        const shieldEnabled =
            this._enabledPedalSkills.length <= 0 || this._enabledPedalSkills.indexOf(PedalSkill.SHIELD) !== -1;
        const goldRainEnabled =
            this._enabledPedalSkills.length <= 0 || this._enabledPedalSkills.indexOf(PedalSkill.GOLD_RAIN) !== -1;
        const goldRainAllowedThisLevel = goldRainEnabled && this._goldRainSpawnedThisLevel < this._goldRainMaxPerLevel;

        // 检查是否应该强制生成尖刺（已生成护盾且过了 2 个间隔踏板）
        if (spikeEnabled && this._spikePermitFromShield && this._blockSpikeForPedals === 0) {
            selectedSkill = PedalSkill.SPIKE;
        } else {
            // 否则进行正常随机（但要受 allowSpike 限制：没有许可或在冷却中则不允许随机到尖刺）
            const allowSpike = spikeEnabled && this._blockSpikeForPedals <= 0 && this._spikePermitFromShield;
            let allowedSkills = this._enabledPedalSkills.length > 0 ? this._enabledPedalSkills : undefined;
            if (!goldRainAllowedThisLevel) {
                const base = allowedSkills && allowedSkills.length > 0 ? allowedSkills : (Object.keys(SkillWeights) as PedalSkill[]);
                allowedSkills = base.filter((s) => s !== PedalSkill.GOLD_RAIN);
            }
            selectedSkill = PedalSkillRegistry.selectRandomSkill({
                currentLayer: this.NewlayerS,
                lastSkill: this._lastSkill,
                allowedSkills,
                goldWeightMultiplier: goldWeightMul,
                blockSpikeForPedals: this._blockSpikeForPedals,
                allowSpike,
            });
        }

        // 状态更新逻辑：
        if (selectedSkill === PedalSkill.SHIELD) {
            // 刚刚生成了护盾，设置间隔和许可
            // 设置为 2，代表接下来的 2 个踏板将作为间隔，不生成尖刺
            this._blockSpikeForPedals = 2;
            this._spikePermitFromShield = shieldEnabled && spikeEnabled;
        } else if (selectedSkill === PedalSkill.SPIKE) {
            // 刚刚生成了尖刺，消耗掉本次许可
            this._spikePermitFromShield = false;
        } else {
            // 只有在生成非护盾、非尖刺踏板（即处于间隔期或普通期）时，才递减计数器
            if (this._blockSpikeForPedals > 0) {
                this._blockSpikeForPedals -= 1;
            }
        }

        if (selectedSkill === PedalSkill.GOLD_RAIN) {
            this._goldRainSpawnedThisLevel += 1;
        }

        this._lastSkill = selectedSkill;
        return selectedSkill;
    }
    /**
     * 添加踏板到管理器 (随机位置)
     * @param type 踏板类型
     * @param jumpForce 提供的跳跃力度
     * @param jumpSpeed 提供的跳跃速度 (上升时间)
     * @param _gravity 提供的重力加速度
     */
    public spawnPedal(type: PedalType, jumpForce: number, jumpSpeed: number, _gravity: number, minYInterval: number, maxYInterval: number, moveSpeed: number, moveTime: number, moveDistance: number): Node | null {
        const pedalNode = this.getPedalFromPool(type);
        if (!pedalNode) return null;
        
        this.node.addChild(pedalNode);

        pedalNode.active = true;
        this._activePedals.push(pedalNode);
        
        this.setPedalPosition(pedalNode, minYInterval, maxYInterval);
        
        // 初始化踏板的物理属性
        const pedalComponent = pedalNode.getComponent(Pedal);
        if (pedalComponent) {
            pedalComponent.init(pedalNode.position, jumpForce, jumpSpeed, _gravity, type, minYInterval, maxYInterval, moveSpeed, moveTime, moveDistance);
            // 随机生成技能
            const skill = this.RandomSkill();
            pedalComponent.setSkill(skill);
            if (skill !== PedalSkill.NONE) {
                const skillNode = this.getSkillNode(skill);
                if (skillNode) {
                    pedalComponent.addSkillNode(skill, skillNode);
                }
            }
            
            pedalComponent.setLayer(this.NewlayerS);
            // 如果是移动踏板，启动移动 (在位置设置后调用，这里先准备参数，实际在 setPedalPosition 后生效可能更好，
            // 但 startMove 使用的是当前位置作为基准，所以必须在 setPedalPosition 之后调用)
        }
        
        // 记录类型
        this._lastPedalType = type;

        // 增加生成的层数
        this.AddNewlayerS(1);
        
        return pedalNode;
    }
    /**
     * 增加生成的层数
     * @param value 增加的层数
     */
    AddNewlayerS(value: number) {
        this.NewlayerS += value;
    }
    /**
     * 初始化对象池
     */
    public async initPools(): Promise<void> {
        // 加载所有踏板预制体
        const pedalTypes = Object.keys(PedalType).map(key => PedalType[key as keyof typeof PedalType]);
        for (const type of pedalTypes) {
            const prefabPath = `prefab/Pedal/${type}`; // 踏板类型与预制体名称一致
            const prefab = await LoaderManeger.instance.loadPrefab(prefabPath);
            if (prefab) {
                this._pedalPrefabs.set(type, prefab);
            } else {
                console.error(`Failed to load prefab for pedal type: ${type}`);
            }
        }

        // 加载所有技能预制体
        const skillTypes = PedalSkillRegistry.getSkillTypesForPools();
        for (const skill of skillTypes) {
            // 假设技能预制体路径为 prefab/PedalSkill/{SkillName}
            // 或者直接用 skill 枚举值作为名称
            const prefabPath = `prefab/item/${skill}`; 
            const prefab = await LoaderManeger.instance.loadPrefab(prefabPath);
            if (prefab) {
                this._skillPrefabs.set(skill, prefab);
            } else {
                // console.warn(`Failed to load prefab for skill type: ${skill}`);
                // 暂时不报错，可能还没做完资源
            }
        }

        // 为每种踏板类型初始化对象池
        this._pedalPrefabs.forEach((prefab, type) => {
            const pool = new NodePool();
            const def = PedalDefaults[type];
            for (let i = 0; i < this.initialPoolSize; i++) {
                const pedalNode = instantiate(prefab);
                const pedalComponent = pedalNode.getComponent(Pedal);
                if (pedalComponent) {
                    pedalComponent.setType(type);
                    pedalComponent.init(v3(0, 0, 0), def.jumpForce, def.jumpSpeed, def._gravity, type, def.minYInterval, def.maxYInterval, def.moveSpeed, def.moveTime, def.moveDistance);
                }
                pool.put(pedalNode);
            }
            this._pedalPools.set(type, pool);
        });

        // 为每种技能类型初始化对象池
        this._skillPrefabs.forEach((prefab, skill) => {
            const pool = new NodePool();
            for (let i = 0; i < 5; i++) { // 技能池可以小一点
                const skillNode = instantiate(prefab);
                pool.put(skillNode);
            }
            this._skillPools.set(skill, pool);
        });
    }

    /**
     * 创建新的踏板节点（供 NodePool 使用）
     * @param prefab 踏板预制体
     * @returns 新创建的踏板节点
     */
    private createPedalNode(prefab: Prefab): Node {
        return instantiate(prefab);
    }

    /**
     * 根据类型获取对应的 NodePool
     */
    private getPoolByType(type: PedalType): NodePool | null {
        return this._pedalPools.get(type) || null;
    }

    /**
     * 根据类型获取对应的预制体
     */
    private getPrefabByType(type: PedalType): Prefab | null {
        return this._pedalPrefabs.get(type) || null;
    }
    
    private onReleaseObject(target: Node): void {
        if (!target) return;
        const pedalComponent = target.getComponent(Pedal);
        if (pedalComponent) {
            this.recyclePedal(target);
            return;
        }
        target.destroy();
    }

    /**
     * 从对象池获取踏板 (不设置位置)
     */
    public getPedalFromPool(type: PedalType): Node | null {
        const pool = this.getPoolByType(type);
        if (!pool) {
            console.error(`Pool for pedal type ${type} not found`);
            return null;
        }

        let pedalNode: Node = null;
        if (pool.size() > 0) {
            pedalNode = pool.get();
        } else {
            // 如果池中没有可用对象，则创建新的
            const prefab = this.getPrefabByType(type);
            if (prefab) {
                pedalNode = this.createPedalNode(prefab);
            } else {
                console.error(`Prefab for pedal type ${type} not found`);
                return null;
            }
        }
        // 确保踏板类型始终正确设置
        const pedalComponent = pedalNode.getComponent(Pedal);
        if (pedalComponent) {
            const def = PedalDefaults[type];
            pedalComponent.setType(type);
            pedalComponent.init(v3(0, 0, 0), def.jumpForce, def.jumpSpeed, def._gravity, type, def.minYInterval, def.maxYInterval, def.moveSpeed, def.moveTime, def.moveDistance);
        }

        return pedalNode;
    }
    
    /**
     * 设置踏板位置 (随机逻辑)
     */
    private setPedalPosition(pedalNode: Node, minYInterval: number, maxYInterval: number): void {
        // 使用Constant中的游戏宽度
        const screenWidth = Constant.Width;
        
        // 获取踏板宽度
        const pedalWidth = this.getPedalWidth(pedalNode);
        // 计算X坐标范围，支持居中对齐的坐标系 (origin at center)
        // 范围从 -360 到 360 (假设屏幕宽度 720)
        // 添加 10 像素的安全边距
        const halfWidth = screenWidth / 2;
        const padding = 10;
        const minX = -halfWidth + pedalWidth / 2 + padding;
        const maxX = halfWidth - pedalWidth / 2 - padding;
        
        // 随机生成X坐标
        let randomX = 0;
        if (maxX > minX) {
            randomX = minX + Math.random() * (maxX - minX);
        } else {
            // 如果踏板太宽，直接居中
            randomX = 0;
        }
        
        // 计算Y坐标，基于上一个踏板的位置加上随机间隔
        /** Y轴间隔最小值 下一个pedal与当前pedal的最小间隔*/
        //  minYInterval: number ;
        // /** Y轴间隔最大值 下一个pedal与当前pedal的最大间隔*/
        //  maxYInterval: number ;
   
        let randomInterval = 0;
        if (this.NewlayerS > 0) {
            randomInterval = minYInterval + Math.random() * (maxYInterval - minYInterval);
        }
        const newY = this._lastPedalPosition.y + randomInterval;
        
        // 设置踏板位置
        pedalNode.setPosition(randomX, newY, 0);
        
        this.PedalRice += randomInterval;
        
        // 更新上一个踏板的位置
        this._lastPedalPosition.set(randomX, newY, 0);
    }
    
    /**
     * 获取踏板宽度
     */
    private getPedalWidth(pedalNode: Node): number {
        const pedalComponent = pedalNode.getComponent(Pedal);
        if (pedalComponent) {
            return pedalComponent.getPedalWidth();
        }
        return 100; // 默认宽度
    }

    /**
     * 根据技能类型获取预制体
     */
    private getSkillPrefab(skill: PedalSkill): Prefab | null {
        return this._skillPrefabs.get(skill) || null;
    }

    /**
     * 从对象池获取技能节点
     */
    private getSkillNode(skill: PedalSkill): Node | null {
        const pool = this._skillPools.get(skill);
        let node: Node = null;
        if (pool && pool.size() > 0) {
            node = pool.get();
        } else {
            const prefab = this.getSkillPrefab(skill);
            if (prefab) {
                node = instantiate(prefab);
            }
        }
        return node;
    }

    /**
     * 回收技能节点
     */
    public recycleSkillNode(skill: PedalSkill, node: Node) {
        if (!node) return;
        const pool = this._skillPools.get(skill);
        if (pool) {
            pool.put(node);
        } else {
            node.destroy();
        }
    }

    /**
     * 回收踏板到对象池
     */
    public recyclePedal(pedalNode: Node): void {
        if (!pedalNode) return;

        const pedalComponent = pedalNode.getComponent(Pedal);
        if (!pedalComponent) {
            console.error('Pedal component not found on node being recycled');
            pedalNode.destroy(); // 如果没有Pedal组件，直接销毁
            return;
        }

        // 回收踏板上的技能节点
        pedalComponent.recycleSkillNodes((skill, node) => {
            this.recycleSkillNode(skill, node);
        });

        const type = pedalComponent.getType();
        const pool = this.getPoolByType(type);

        // 从活跃踏板列表中移除
        const index = this._activePedals.indexOf(pedalNode);
        if (index > -1) {
            this._activePedals.splice(index, 1);
        }

        if (pool) {
            pool.put(pedalNode);
        } else {
            console.warn(`No NodePool found for pedal type ${type}, destroying node.`);
            pedalNode.destroy();
        }
    }

    /**
     * 清理所有对象池
     */
    public clearPools(): void {
        this.recycleAllPedals(); // 先回收所有活跃的
        this._pedalPools.forEach(pool => {
            pool.clear();
        });
        console.log("All pedal pools cleared.");
    }

    /**
     * 回收所有活跃踏板
     */
    public recycleAllPedals(): void {
        // 创建副本以防在遍历时修改数组
        const activePedals = [...this._activePedals];
        for (const pedal of activePedals) {
            this.recyclePedal(pedal);
        }
        this._activePedals = []; // 确保清空
    }

    /**
     * 获取所有当前活跃的踏板节点
     * @returns 所有活跃踏板节点的数组
     */
    public getAllActivePedals(): Node[] {
        return this._activePedals;
    }

    /**
     * 获取最底部的活跃踏板
     * @returns 最底部的活跃踏板节点，如果没有活跃踏板则返回 null
     */
    public getLowestPedal(): Node | null {
        if (this._activePedals.length === 0) return null;

        let lowest: Node = this._activePedals[0];
        let lowestY = lowest.worldPosition.y;
        for (let i = 1; i < this._activePedals.length; i++) {
            const n = this._activePedals[i];
            const y = n.worldPosition.y;
            if (y < lowestY) {
                lowest = n;
                lowestY = y;
            }
        }
        return lowest;
    }
    /**
     * 获取与目标节点发生碰撞的最佳踏板
     * @param targetNode 目标节点
     * @returns 碰撞的踏板节点，如果没有则返回 null
     */
    public getCollisionPedal(targetNode: Node): Node | null {
        if (!targetNode) return null;

        const activePedals = this.getAllActivePedals();
        const targetPos = targetNode.worldPosition;
        const targetUI = targetNode.getComponent(UITransform);
        if (!targetUI) return null;

        const targetBottomY = targetPos.y - targetUI.height * targetUI.anchorY;
        const targetLeftX = targetPos.x - targetUI.width * targetUI.anchorX;
        const targetRightX = targetPos.x + targetUI.width * (1 - targetUI.anchorX);

        let bestPedal: Node | null = null;
        let bestPedalY = -Infinity;

        const collisionThreshold = 10;
        const maxPenetration = targetUI.height;

        for (const pedalNode of activePedals) {
            const pedalPos = pedalNode.worldPosition;
            
            // 快速 Y 轴过滤
            if (pedalPos.y > targetPos.y + collisionThreshold) continue;
            if (pedalPos.y < targetPos.y - maxPenetration - 100) continue;

            const pedalUI = pedalNode.getComponent(UITransform);
            if (!pedalUI) continue;

            // 精确 Y 轴判定 (基于踏板顶部)
            // 默认锚点 0.5，如锚点不同需 pedalUI.anchorY 参与计算
            // 此处沿用 Game.ts 中的假设：pedalTopY = y + height/2
            const pedalTopY = pedalPos.y + pedalUI.height * (1 - pedalUI.anchorY);

            if (targetBottomY > pedalTopY + collisionThreshold) continue;
            if (targetBottomY < pedalTopY - maxPenetration) continue;

            // X 轴重叠检测
            const pedalLeftX = pedalPos.x - pedalUI.width * pedalUI.anchorX;
            const pedalRightX = pedalPos.x + pedalUI.width * (1 - pedalUI.anchorX);

            const isXOverlap = Math.max(targetLeftX, pedalLeftX) < Math.min(targetRightX, pedalRightX);

            if (isXOverlap) {
                // 优先选择位置最高的踏板 (最先接触)
                if (pedalTopY > bestPedalY) {
                    bestPedalY = pedalTopY;
                    bestPedal = pedalNode;
                }
            }
        }

        return bestPedal;
    }

    /**
     * 获取目标附近的踏板
     * @param targetNode 目标节点
     * @param range 范围半径
     * @returns 范围内的踏板节点，如果没有则返回 null
     */
    public getNearbyPedal(targetNode: Node, range: number): Node | null {
        if (!targetNode) return null;

        const activePedals = this.getAllActivePedals();
        const targetPos = targetNode.worldPosition;
        
        let bestPedal: Node | null = null;
        let minDistanceSq = range * range; // 使用平方距离比较，避免开方

        for (const pedalNode of activePedals) {
            const pedalPos = pedalNode.worldPosition;
            const distSq = Vec3.distance(targetPos, pedalPos);

            if (distSq < minDistanceSq) {
                minDistanceSq = distSq;
                bestPedal = pedalNode;
            }
        }

        return bestPedal;
    }

    /**
     * 获取最后一个生成的踏板（最上面的踏板）
     * @returns 最后一个活跃踏板节点，如果没有活跃踏板则返回 null
     */
    public getLastPedal(): Node | null {
        if (this._activePedals.length === 0) return null;
        return this._activePedals[this._activePedals.length - 1];
    }

    /**
     * 检查是否已完成所有踏板的生成
     */
    public isFinished(): boolean {
        return this._configReady && this.NewlayerS >= this.AlllayerNum;
    }

    /**
     * 获取所有踏板的层数
     * @returns 所有踏板的层数
     */
    public getAlllayerNum(): number {
        return this.AlllayerNum;
    }

    /**
     * 获取通关金币奖励
     */
    public getGoldReward(): number {
        return this.goldReward;
    }

    /**
     * 获取金币技能（踏板金币堆）奖励
     */
    public getPedalGold(): number {
        return this.pedalGold;
    }
}


