import { _decorator, Component, Node, Prefab, instantiate, Vec3, v3, director, NodePool, Quat } from 'cc';
import LoaderManeger from '../../sysloader/LoaderManeger';
import { PedalType, Constant } from '../../Tools/enumConst';
import { Pedal } from '../Pedal/Pedal';

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
    private _lastPedalPosition: Vec3 = v3(0, -300, 0);
    
    /** Y轴间隔最小值 */
    private minYInterval: number = 200;
    
    /** Y轴间隔最大值 */
    private maxYInterval: number = 400;

    protected  onLoad(){

    }

    start() {

    }

    update(deltaTime: number) {

    }
    /**
     * 加载游戏数据并生成初始踏板
     */
    public async initializePedalGeneration(): Promise<void> {
        // 确保对象池已初始化
        if (this._pedalPools.size === 0) {
            await this.initPools();
        }

        // 生成两个初始踏板供测试
        console.log("Generating 2 temporary pedals...");
        this.spawnPedal(PedalType.WOOD);
        this.spawnPedal(PedalType.WOOD);
        this.spawnPedal(PedalType.WOOD);
        this.spawnPedal(PedalType.WOOD);
        this.spawnPedal(PedalType.WOOD);
        this.spawnPedal(PedalType.WOOD);
    }
    /**
     * 添加踏板到管理器
     * @param type 踏板类型
     */
    public spawnPedal(type: PedalType): Node | null {
        const pedalNode = this.getPedal(type);
        if (!pedalNode) return null;
        this.node.addChild(pedalNode);
        pedalNode.active = true;
        this._activePedals.push(pedalNode); // 添加到活跃踏板列表
        return pedalNode;
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

    /**
     * 从对象池获取踏板
     */
    public getPedal(type: PedalType): Node {
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

        // 设置踏板位置
        this.setPedalPosition(pedalNode);
        pedalNode.active = true;
        return pedalNode;
    }
    
    /**
     * 设置踏板位置
     */
    private setPedalPosition(pedalNode: Node): void {
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
        const randomInterval = this.minYInterval + Math.random() * (this.maxYInterval - this.minYInterval);
        const newY = this._lastPedalPosition.y + randomInterval;
        
        // 设置踏板位置
        pedalNode.position = v3(randomX, newY, 0);
        
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


