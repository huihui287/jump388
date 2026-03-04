import { _decorator, Component, Node, Prefab, instantiate, Vec3, v3, director, NodePool, Quat } from 'cc';
import LoaderManeger from '../../sysloader/LoaderManeger';
import { PedalType, Constant, PedalDefaults } from '../../Tools/enumConst';
import { Pedal } from '../Pedal/Pedal';
import GameData from '../../Common/GameData';
import EventManager from '../../Common/view/EventManager';
import { EventName } from '../../Tools/eventName';

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
    
    /** 对应 Rice 里程碑的踏板类型数组（字符串，来源于 JSON） */
    private pedalSype: string[] = [];

    ///////////////////////////////////////////////////////////////////////////
    /** Hero已经踩多少层数 */
    private HerolayerS: number = 0;

    /** 层数配置 */
    private layer: number[] = [];

    /** 生成了的层数 */
    private NewlayerS: number = 0;
    /////////////////////////////////////////////////////////////////////////////////
    /** Hero 引用，用于计算 AllRice */
    private hero: Node | null = null;
    /** 起始 Y 坐标，用于计算偏移 */
    private startY: number = 0;
    private _configReady: boolean = false;

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

    start() {

    }
    /** 临时变量，用于存储上一次的 AllRice 值 */
    private tempAllRice: number = 0;

    update(deltaTime: number) {
        if (this._configReady && this.hero) {
            // 计算当前高度差 (AllRice)
            // 假设 1 像素 = 1 米 (或者按需缩放，例如 / 10)
            this.tempAllRice = this.hero.position.y - this.startY;
            this.HeroRice = this.tempAllRice >= this.HeroRice ? this.tempAllRice :this.HeroRice;

            // 检查是否需要生成新的踏板
            this.checkAndSpawnPedals();
        }
    }
    /**
     * 加载游戏数据并从 JSON 配置生成踏板
     */
    public async initializePedalGeneration(): Promise<void> {
        // 确保对象池已初始化
        if (this._pedalPools.size === 0) {
            await this.initPools();
        }

        // 加载当前关卡的踏板配置
        const level = GameData.getCurLevel(); 
        const configPath = `json/config/pedal_${level}`;
        
        try {
            console.log(`Loading pedal config for level ${level} from ${configPath}...`);
            const config = await LoaderManeger.instance.loadJSON(configPath) as any;
            
            // 解析 layerS 配置
            if (config && config.json.layerS && config.json.layerS.length > 0) {
                const layerData = config.json.layerS[0];
                this.layer = layerData.layer || [];
                this.pedalSype = layerData.pedalSype || [];
                console.log("Loaded layer config:", this.layer, this.pedalSype); 
            } else {
                console.warn("layerS config not found or empty, using defaults.");
                this.layer = [1000, 2000];
                this.pedalSype = [PedalType.WOOD, PedalType.CLOUD];
            }

            // 开始初始生成
            this._configReady = true;

        } catch (error) {
            console.error(`Failed to load pedal config for level ${level}:`, error);
            // Fallback
            this.layer = [1000, 2000];
            this.pedalSype = [PedalType.WOOD, PedalType.CLOUD];

            this._configReady = true;
        }
    }

    /**
     * 检查并生成新踏板
     * 当最后一个踏板距离 屏幕上面的距离 不够远时，继续生成
     */
    private checkAndSpawnPedals() {
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

        // 遍历 Rice 数组找到匹配的区间
        // 规则：AllRice < Rice[i] 时，使用 pedalSype[i]
        // 如果超过了所有 Rice，则使用最后一个配置
        let found = false;
        for (let i = 0; i < this.layer.length; i++) {
            if (this.NewlayerS < this.layer[i]) {
                targetTypeName = this.pedalSype[i];
                found = true;
                break;
            }
        }

        if (!found && this.pedalSype.length > 0) {
            // 超过最大里程，使用最后一个配置
            targetTypeName = this.pedalSype[this.pedalSype.length - 1];
        }

        // 将字符串类型名解析为 PedalType 枚举
        const targetType: PedalType = this.resolvePedalType(targetTypeName);
        // 使用枚举常量中的默认物理参数
        const def = PedalDefaults[targetType];
        const jumpForce = def.jumpForce;
        const jumpSpeed = def.jumpSpeed;
        const _gravity = def._gravity;

        this.spawnPedal(targetType, jumpForce, jumpSpeed, _gravity);
    }

    /**
     * 在指定位置生成踏板
     * @param type 踏板类型
     * @param position 踏板位置
     * @param jumpForce 提供的跳跃力度
     * @param jumpSpeed 提供的跳跃速度 (上升时间)
     * @param _gravity 提供的重力加速度
     */
    public spawnPedalAt(type: PedalType, position: Vec3, jumpForce: number, jumpSpeed: number, _gravity: number): Node | null {
        const pedalNode = this.getPedalFromPool(type);
        if (!pedalNode) return null;
        
        this.node.addChild(pedalNode);
        pedalNode.setPosition(position);
        pedalNode.active = true;
        
        // 初始化踏板的物理属性
        const pedalComponent = pedalNode.getComponent(Pedal);
        if (pedalComponent) {
            pedalComponent.init(position, jumpForce, jumpSpeed, _gravity);
            pedalComponent.skill = PedalDefaults[type].skill;
        }

        const deltaY = position.y - this._lastPedalPosition.y;
        if (deltaY > 0) {
            this.PedalRice += deltaY;
        }

        // 更新上一个踏板位置记录
        this._lastPedalPosition.set(position);
        this._lastPedalType = type;
        
        this._activePedals.push(pedalNode);
        return pedalNode;
    }

    /**
     * 添加踏板到管理器 (随机位置)
     * @param type 踏板类型
     * @param jumpForce 提供的跳跃力度
     * @param jumpSpeed 提供的跳跃速度 (上升时间)
     * @param _gravity 提供的重力加速度
     */
    public spawnPedal(type: PedalType, jumpForce: number, jumpSpeed: number, _gravity: number): Node | null {
        const pedalNode = this.getPedalFromPool(type);
        if (!pedalNode) return null;
        
        this.node.addChild(pedalNode);
        
        // 初始化踏板的物理属性
        const pedalComponent = pedalNode.getComponent(Pedal);
        if (pedalComponent) {
            pedalComponent.init(pedalNode.position, jumpForce, jumpSpeed, _gravity);
            pedalComponent.skill = PedalDefaults[type].skill;
            pedalComponent.setLayer(this.NewlayerS);
            // 如果是移动踏板，启动移动 (在位置设置后调用，这里先准备参数，实际在 setPedalPosition 后生效可能更好，
            // 但 startMove 使用的是当前位置作为基准，所以必须在 setPedalPosition 之后调用)
        }

        pedalNode.active = true;
        this._activePedals.push(pedalNode);
        
        // 设置随机位置
        this.setPedalPosition(pedalNode);
        
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
        const pedalTypes = Object.values(PedalType).filter(value => typeof value === 'string') as PedalType[];
        for (const type of pedalTypes) {
            const prefabPath = `prefab/Pedal/${type}`; // 踏板类型与预制体名称一致
            const prefab = await LoaderManeger.instance.loadPrefab(prefabPath);
            if (prefab) {
                this._pedalPrefabs.set(type, prefab);
            } else {
                console.error(`Failed to load prefab for pedal type: ${type}`);
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
                    pedalComponent.init(v3(0, 0, 0));
                }
                pool.put(pedalNode);
            }
            this._pedalPools.set(type, pool);
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
            pedalComponent.init(v3(0, 0, 0));
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
    private setPedalPosition(pedalNode: Node): void {
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
            // 使用上一个踏板类型的间隔配置
            const lastPedalDefaults = PedalDefaults[this._lastPedalType];
            randomInterval = lastPedalDefaults.minYInterval + Math.random() * (lastPedalDefaults.maxYInterval - lastPedalDefaults.minYInterval);
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
        this._pedalPools.forEach(pool => {
            pool.clear();
        });
        this._activePedals.length = 0; // 清空活跃踏板列表
        console.log("All pedal pools cleared.");
    }

    /**
     * 获取所有当前活跃的踏板节点
     * @returns 所有活跃踏板节点的数组
     */
    public getAllActivePedals(): Node[] {
        return this._activePedals;
    }

    /**
     * 获取离目标节点最近的踏板
     * @param targetNode 目标节点
     * @returns 离目标节点最近的踏板节点，如果没有活跃踏板则返回 null
     */
    public getClosestPedal(targetNode: Node): Node | null {
        if (!targetNode) {
            console.warn("getClosestPedal: targetNode is null.");
            return null;
        }

        const activePedals = this.getAllActivePedals();
        if (activePedals.length === 0) {
            return null;
        }

        let closestPedal: Node  = null;
        let minDistanceSqr = Infinity;
        const targetPos = targetNode.worldPosition;

        for (const pedalNode of activePedals) {
            const pedalPos = pedalNode.worldPosition;
            
            // 优化性能：排除在目标节点上方的踏板
            if (pedalPos.y >= targetPos.y) {
                continue;
            }

            const distanceSqr = Vec3.distance(targetPos, pedalPos);

            if (distanceSqr < minDistanceSqr) {
                minDistanceSqr = distanceSqr;
                closestPedal = pedalNode;
            }
        }

        return closestPedal;
    }

}


