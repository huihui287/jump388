import { _decorator, Component, Node, Prefab, instantiate, Vec3, v3, director, NodePool, Quat, UITransform } from 'cc';
import LoaderManeger from '../../sysloader/LoaderManeger';
import { CSVManager } from '../../Tools/CSVManager';
import { App } from '../../Controller/app';
import { PedalType, PedalConfig, PedalDefaults, PedalSkill, SkillWeights, SkillFloorLimit, PedalConfigData } from '../../Tools/enumPedal';
import { Pedal } from '../Pedal/Pedal';
import { Hero } from '../Hero';
import GameData from '../../Common/GameData';
import EventManager from '../../Common/view/EventManager';
import { EventName } from '../../Tools/eventName';
import { Constant } from '../../Tools/enumConst';
import { LevelConfig } from '../../Tools/levelConfig';

const { ccclass, property } = _decorator;
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
    
    /** 层数配置映射 Key: layer, Value: ConfigData */
    private layerConfigMap: Map<number, PedalConfigData> = new Map();
    /** 排序后的层数键值，用于快速查找 */
    private layerKeys: number[] = [];

    /** 生成了的层数 */
    private NewlayerS: number = 0;

    /** 需要生成所有层的数量 */
    private AlllayerNum: number = 0;
    
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

    init() {
        this.recycleAllPedals();
        this._configReady = false;

        this.NewlayerS = 0;
        this.HeroRice = 0;
        this.PedalRice = 0;
        this.tempAllRice = 0;
        this._lastPedalType = PedalType.WOOD;
        
        if (this.hero) {
            this.setHero(this.hero);
        }
    }
    
    start() {

    }
    /** 临时变量，用于存储上一次的 AllRice 值 */
    private tempAllRice: number = 0;

    update(deltaTime: number) {
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
        
        // 假设 activePedals 是按 Y 轴排序的（从低到高），因为是按顺序生成的
        // 所以一旦遇到不需要回收的，后面的都不需要回收
        for (let i = 0; i < this._activePedals.length; i++) {
            const pedalNode = this._activePedals[i];
            if (pedalNode.position.y < recycleThreshold) {
                toRecycle.push(pedalNode);
            } else {
                // 遇到第一个在屏幕内的，后面的肯定也在（假设有序）
                // 如果不能保证完全有序（例如随机位置可能导致错乱），则去掉 break
                break; 
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
     * 将 CSV 中的数字类型转换为 PedalType 字符串
     * 映射关系:
     * 1 -> PedalType.PEDAL1 (pedal1)
     * 2 -> PedalType.WOOD (woodPedal)
     * 3 -> PedalType.CLOUD (cloudPedal)
     * 4 -> PedalType.MOVE_PEDAL (movePedal)
     * 5 -> PedalType.FRACTURE_PEDAL (fracturePedal)
     */
    private convertPedalType(typeVal: string | number): string {
        // 如果已经是字符串且非纯数字，直接返回
        if (typeof typeVal === 'string' && isNaN(Number(typeVal))) {
            return typeVal;
        }

        const typeNum = Number(typeVal);
        switch (typeNum) {
            case 1: return PedalType.PEDAL1;
            case 2: return PedalType.WOOD;
            case 3: return PedalType.CLOUD;
            case 4: return PedalType.MOVE_PEDAL;
            case 5: return PedalType.FRACTURE_PEDAL;
            default: return PedalType.WOOD;
        }
    }

    /**
     * 加载游戏数据并从 CSV 配置生成踏板
     * CSV 结构：每一行代表一个里程碑区间
     * 例如：
     * layer,pedalSype,AlllayerNum,goldReward,pedalGold
     * 描述行...
     * 10,1,30,100,10  (表示 0-10 层使用类型 1)
     * 20,2,30,100,10  (表示 10-20 层使用类型 2)
     * 30,3,30,100,10  (表示 20-30 层使用类型 3)
     */
    public async loadPedalConfig(): Promise<void> {
   
        // 加载当前关卡的踏板配置
        const level = GameData.getCurLevel(); 
        const configPath = `config/pedal_${level}`; // 关卡对应的 CSV 文件路径
        
        try {
            console.log(`Loading pedal config for level ${level} from ${configPath}...`);
            
            // 使用 CSVManager 加载
            await CSVManager.getInstance().loadCSV(configPath);
            // 获取表中的所有有效数据行（CSVManager 已跳过前两行）
            const table = CSVManager.getInstance().getTable(configPath);
            
            if (table && table.length > 0) {
                // 重置当前配置
                this.layerConfigMap.clear();
                this.layerKeys = [];

                // 遍历每一行，填充 layerConfigMap
                for (const row of table) {
                    const layerVal = row.layer;
                    const typeVal = row.pedalSype;
                    const minVal = row.minYInterval;
                    const maxVal = row.maxYInterval;
                    const moveSpeedVal = row.moveSpeed;
                    const moveTimeVal = row.moveTime;
                    const moveDistanceVal = row.moveDistance;

                    let layers: number[] = [];
                    if (Array.isArray(layerVal)) {
                        layers = layerVal.map(Number);
                    } else if (layerVal !== undefined) {
                        layers = [Number(layerVal)];
                    }

                    let types: string[] = [];
                    if (Array.isArray(typeVal)) {
                        types = typeVal.map(t => this.convertPedalType(t));
                    } else if (typeVal !== undefined) {
                        types = [this.convertPedalType(typeVal)];
                    }

                    let minIntervals: number[] = [];
                    if (Array.isArray(minVal)) {
                        minIntervals = minVal.map(Number);
                    } else if (minVal !== undefined) {
                        minIntervals = [Number(minVal)];
                    }

                    let maxIntervals: number[] = [];
                    if (Array.isArray(maxVal)) {
                        maxIntervals = maxVal.map(Number);
                    } else if (maxVal !== undefined) {
                        maxIntervals = [Number(maxVal)];
                    }

                    let moveSpeeds: number[] = [];
                    if (Array.isArray(moveSpeedVal)) {
                        moveSpeeds = moveSpeedVal.map(Number);
                    } else if (moveSpeedVal !== undefined) {
                        moveSpeeds = [Number(moveSpeedVal)];
                    }

                    let moveTimes: number[] = [];
                    if (Array.isArray(moveTimeVal)) {
                        moveTimes = moveTimeVal.map(Number);
                    } else if (moveTimeVal !== undefined) {
                        moveTimes = [Number(moveTimeVal)];
                    }

                    let moveDistances: number[] = [];
                    if (Array.isArray(moveDistanceVal)) {
                        moveDistances = moveDistanceVal.map(Number);
                    } else if (moveDistanceVal !== undefined) {
                        moveDistances = [Number(moveDistanceVal)];
                    }

                    // 填充 Map
                    for (let i = 0; i < layers.length; i++) {
                        const layer = layers[i];
                        // 如果类型数组长度不够，循环使用或者取最后一个？这里假设一一对应，如果不够则取对应索引，若越界则取最后一个
                        const typeIndex = Math.min(i, types.length - 1);
                        const pedalSype = types[typeIndex];
                        
                        const minIndex = Math.min(i, minIntervals.length - 1);
                        const minY = minIntervals.length > 0 ? minIntervals[minIndex] : undefined;

                        const maxIndex = Math.min(i, maxIntervals.length - 1);
                        const maxY = maxIntervals.length > 0 ? maxIntervals[maxIndex] : undefined;

                        const speedIndex = Math.min(i, moveSpeeds.length - 1);
                        const moveSpeed = moveSpeeds.length > 0 ? moveSpeeds[speedIndex] : undefined;

                        const timeIndex = Math.min(i, moveTimes.length - 1);
                        const moveTime = moveTimes.length > 0 ? moveTimes[timeIndex] : undefined;

                        const distIndex = Math.min(i, moveDistances.length - 1);
                        const moveDistance = moveDistances.length > 0 ? moveDistances[distIndex] : undefined;

                        const config: PedalConfigData = {
                            pedalSype: pedalSype,
                            minYInterval: minY,
                            maxYInterval: maxY,
                            moveSpeed: moveSpeed,
                            moveTime: moveTime,
                            moveDistance: moveDistance
                        };
                        
                        this.layerConfigMap.set(layer, config);
                        this.layerKeys.push(layer);
                    }
                }
                
                // 排序 keys
                this.layerKeys.sort((a, b) => a - b);

                // 从 LevelConfig 获取全局配置
                const config = LevelConfig.getConfig(level);
                this.AlllayerNum = config.AlllayerNum;
                this.goldReward = config.goldReward;
                this.pedalGold = config.pedalGold;

                console.log("Loaded layer config from CSV table:", this.layerConfigMap); 
            } else {
                console.warn(`Level ${level} config empty or not found in CSV: ${configPath}, using defaults.`);
                this.useDefaultConfig();
            }

            // 开始初始生成
            this._configReady = true;

        } catch (error) {
            console.error(`Failed to load pedal config for level ${level}:`, error);
            // Fallback
            this.useDefaultConfig();

            this._configReady = true;
        }
    }

    /**
     * 使用默认配置
     */
    private useDefaultConfig() {
        this.layerConfigMap.clear();
        this.layerKeys = [1000, 2000];
        
        this.layerConfigMap.set(1000, { pedalSype: PedalType.WOOD });
        this.layerConfigMap.set(2000, { pedalSype: PedalType.CLOUD });
        
        this.AlllayerNum = 2;
        this.goldReward = 100;
        this.pedalGold = 100;
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
        // 确定当前应该使用的类型名称（字符串）
        let targetTypeName: string = PedalType.WOOD; // 默认类型名
        let targetMinY: number | undefined = undefined;
        let targetMaxY: number | undefined = undefined;
        let targetMoveSpeed: number | undefined = undefined;
        let targetMoveTime: number | undefined = undefined;
        let targetMoveDistance: number | undefined = undefined;

        // 遍历 layerKeys 数组找到匹配的区间
        // 规则：NewlayerS < layerKeys[i] 时，使用对应配置
        // 如果超过了所有 layerKeys，则使用最后一个配置
        let found = false;
        let idx = -1;
        
        for (let i = 0; i < this.layerKeys.length; i++) {
            if (this.NewlayerS < this.layerKeys[i]) {
                idx = i;
                found = true;
                break;
            }
        }

        if (!found && this.layerKeys.length > 0) {
            // 超过最大里程，使用最后一个配置
            idx = this.layerKeys.length - 1;
        }

        if (idx !== -1) {
            const layerKey = this.layerKeys[idx];
            const config = this.layerConfigMap.get(layerKey);
            if (config) {
                targetTypeName = config.pedalSype;
                targetMinY = config.minYInterval;
                targetMaxY = config.maxYInterval;
                targetMoveSpeed = config.moveSpeed;
                targetMoveTime = config.moveTime;
                targetMoveDistance = config.moveDistance;
            }
        }

        // 将字符串类型名解析为 PedalType 枚举
        const targetType: PedalType = this.resolvePedalType(targetTypeName);
        // 使用枚举常量中的默认物理参数
        const def = PedalDefaults[targetType];
        const jumpForce = def.jumpForce;
        const jumpSpeed = def.jumpSpeed;
        const _gravity = def._gravity;

        const finalMinY = targetMinY ?? def.minYInterval;
        const finalMaxY = targetMaxY ?? def.maxYInterval;
        const finalMoveSpeed = targetMoveSpeed ?? def.moveSpeed;
        const finalMoveTime = targetMoveTime ?? def.moveTime;
        const finalMoveDistance = targetMoveDistance ?? def.moveDistance;

        this.spawnPedal(targetType, jumpForce, jumpSpeed, _gravity, finalMinY, finalMaxY, finalMoveSpeed, finalMoveTime, finalMoveDistance);
    }

    /**随机pedal的skill
    * @param type 踏板类型
    */
    /**随机pedal的skill
    * @param type 踏板类型
    */
    private RandomSkill(): PedalSkill[] {
        // 候选技能列表
        const candidates: { skill: PedalSkill; weight: number }[] = [];
        let totalWeight = 0;
        const heroComp = this.hero ? this.hero.getComponent(Hero) : null;
        const goldWeightMul = heroComp ? heroComp.getGoldPedalWeightMultiplier() : 1;

        // 1. 构建候选池（过滤掉不符合条件的技能）
        for (const key in SkillWeights) {
            const skill = key as PedalSkill;
            let weight = SkillWeights[skill];

            if (skill === PedalSkill.GOLD) {
                weight = Math.floor(weight * goldWeightMul);
            }

            // 过滤条件：
            // - 权重必须大于 0
            // - 不能是 FRACTURE (通常由踏板类型决定)
            // - 不能与上一次技能相同，除非是 NONE (允许连续无技能)
            // - 满足层数限制
            if (weight > 0 && skill !== PedalSkill.FRACTURE) {
                const floorLimit = SkillFloorLimit[skill] || 0;
                if (this.NewlayerS >= floorLimit) {
                    if (skill === PedalSkill.NONE || skill !== this._lastSkill) {
                        candidates.push({ skill, weight });
                        totalWeight += weight;
                    }
                }
            }
        }

        // 2. 如果没有有效候选（理论上不应发生），强制返回 NONE
        if (candidates.length === 0 || totalWeight <= 0) {
            this._lastSkill = PedalSkill.NONE;
            return [PedalSkill.NONE];
        }

        // 3. 执行加权随机
        const randomVal = Math.random() * totalWeight;
        let accumulatedWeight = 0;
        let selectedSkill = PedalSkill.NONE;

        for (const candidate of candidates) {
            accumulatedWeight += candidate.weight;
            if (randomVal < accumulatedWeight) {
                selectedSkill = candidate.skill;
                break;
            }
        }

        // 4. 最终结果处理（如果循环结束仍未选中，理论上不会发生，默认取最后一个候选）
        // 这一步是为了防止浮点数精度问题导致的 randomVal === totalWeight 边界情况
        if (randomVal >= totalWeight) {
             selectedSkill = candidates[candidates.length - 1].skill;
        }

        // 5. 更新状态并返回
        this._lastSkill = selectedSkill;
        return [selectedSkill];
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
            const skills = this.RandomSkill();
            pedalComponent.addSkill(skills);
            
            // 为 SPIKE, GOLD, SHIELD 生成预制体
            for (const skill of skills) {
                if (skill === PedalSkill.SPIKE || skill === PedalSkill.GOLD || skill === PedalSkill.SHIELD) {
                    const skillNode = this.getSkillNode(skill);
                    if (skillNode) {
                        pedalComponent.addSkillNode(skill, skillNode);
                    }
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
        const skillTypes = [PedalSkill.SPIKE, PedalSkill.GOLD, PedalSkill.SHIELD];
        for (const skill of skillTypes) {
            // 假设技能预制体路径为 prefab/PedalSkill/{SkillName}
            // 或者直接用 skill 枚举值作为名称
            const prefabPath = `prefab/item/${skill}`+"Skill"; 
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
            for (let i = 0; i < this.initialPoolSize; i++) {
                const pedalNode = instantiate(prefab);
                const pedalComponent = pedalNode.getComponent(Pedal);
                if (pedalComponent) {
                    pedalComponent.setType(type);
                    pedalComponent.init(v3(0, 0, 0), 600, 1.45, -2000, type);
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
            pedalComponent.setType(type);
            pedalComponent.init(v3(0, 0, 0), 600, 1.45, -2000, type);
        }

        return pedalNode;
    }
    
    /**
     * 将字符串类型名解析为 PedalType 枚举值    
     */
    private resolvePedalType(typeName: string): PedalType {
        if (typeName === PedalType.PEDAL1) return PedalType.PEDAL1;
        if (typeName === PedalType.WOOD) return PedalType.WOOD;
        if (typeName === PedalType.CLOUD) return PedalType.CLOUD;
        if (typeName === PedalType.FRACTURE_PEDAL) return PedalType.FRACTURE_PEDAL;
        if (typeName === PedalType.MOVE_PEDAL) return PedalType.MOVE_PEDAL;
        return PedalType.WOOD;  
    }
    
    /**
     * 设置踏板位置 (随机逻辑)
     */
    private setPedalPosition(pedalNode: Node, minYInterval: number, maxYInterval: number): void {
        // 使用Constant中的游戏宽度
        const screenWidth = Constant.Width;
        
        // 获取踏板宽度
        const pedalWidth = this.getPedalWidth(pedalNode);
        const type = pedalNode.getComponent(Pedal).getType();
        
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

        // activePedals 是按生成顺序添加的，通常 index 0 就是最底部的
        // 但为了保险，可以遍历一次找 Y 最小的，或者直接返回第一个
        // 考虑到性能和逻辑一致性，这里假设第一个就是最低的
        return this._activePedals[0];
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


