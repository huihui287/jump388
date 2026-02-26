import { _decorator, Component, Node, NodePool, instantiate, Prefab, Vec3, Quat, ParticleSystem2D } from 'cc';
import LoaderManeger from '../../sysloader/LoaderManeger';

const { ccclass, property } = _decorator;

/**
 * 特效池配置接口
 */
interface ParticlePoolConfig {
    prefab: Prefab;      // 特效预制体
    pool: NodePool;      // 节点池
    preloadCount: number; // 预加载数量
}

/**
 * 特效信息接口
 */
interface ParticleInfo {
    node: Node;         // 特效节点
    key: string;        // 特效标识
}

/**
 * 特效管理器
 * 负责管理所有特效的生成、播放和释放
 * 使用对象池优化性能，避免频繁创建和销毁节点
 */
@ccclass('ParticleManager')
export class ParticleManager extends Component {
    /** 特效对象池映射表 */
    private particlePools: Map<string, ParticlePoolConfig> = new Map();
    /** 活跃特效映射表 */
    private activeParticles: Map<Node, ParticleInfo> = new Map();
    /** 初始化状态 */
    private isInitialized: boolean = false;

     /** 预制体引用：粒子特效预制体 */
    private particlePre: Prefab = null;
    /** 预制体引用：消除后飞的特效 */
    private bulletParticlePre: Prefab = null;

    /**
     * 组件加载时初始化
     */
    async onLoad() {
        this.isInitialized = true;
        this.particlePre = await LoaderManeger.instance.loadPrefab('prefab/pieces/particle');
        this.bulletParticlePre = await LoaderManeger.instance.loadPrefab('prefab/pieces/bulletParticle');
        this.preloadParticle(this.particlePre, 'particle', 50);
        // 预加载击中特效，预加载5个
        this.preloadParticle(this.bulletParticlePre, 'bulletParticle', 50);

    }

    /**
     * 每帧更新
     * 移除自动回收机制，所有特效由外部手动释放
     * @param deltaTime 帧间隔时间
     */
    update(deltaTime: number) {
        // 移除自动回收机制，所有特效由外部手动释放
    }

    /**
     * 组件销毁时清理
     */
    onDestroy() {
        this.clearAllPools();
        this.activeParticles.clear();
    }

    /**
     * 预加载特效到对象池
     * @param prefab 特效预制体
     * @param key 特效标识
     * @param preloadCount 预加载数量，默认3个
     */
    public preloadParticle(prefab: Prefab, key: string, preloadCount: number = 3): void {
        if (!prefab || !key) {
           // console.error('Prefab or key is invalid.');
            return;
        }

        if (this.particlePools.has(key)) {
          //  console.warn(`Particle pool for key "${key}" already exists.`);
            return;
        }

        const pool = new NodePool();
        for (let i = 0; i < preloadCount; i++) {
            const particleNode = instantiate(prefab);
            if (particleNode) {
                pool.put(particleNode);
            }
        }

        this.particlePools.set(key, { prefab, pool, preloadCount });
       // console.log(`Preloaded ${preloadCount} particles for key "${key}".`);
    }

    /**
     * 从对象池获取特效节点
     * @param key 特效标识
     * @returns 特效节点，若不存在则返回null
     */
    public getParticle(key: string): Node | null {
        if (!this.particlePools.has(key)) {
          //  console.error(`Particle pool for key "${key}" does not exist.`);
            return null;
        }

        const config = this.particlePools.get(key)!;
        let particleNode: Node;

       // console.log(`[ParticleManager] Get particle for key "${key}", pool size: ${config.pool.size()}`);
        
        if (config.pool.size() > 0) {
            // 从对象池获取
            particleNode = config.pool.get() as Node;
           // console.log(`[ParticleManager] Got particle from pool for key "${key}", remaining pool size: ${config.pool.size()}`);
        } else {
            // 对象池为空，创建新节点
            particleNode = instantiate(config.prefab);
           // console.log(`[ParticleManager] Instantiated new particle for key "${key}" (pool was empty).`);
        }

        return particleNode;
    }

    /**
     * 播放特效
     * @param key 特效标识
     * @param position 播放位置
     * @param rotation 播放旋转，默认为IDENTITY
     * @param parent 父节点，默认为管理器节点
     * @returns 播放的特效节点，若失败则返回null
     */
    public playParticle(key: string, position: Vec3, rotation: Quat = Quat.IDENTITY, parent: Node | null = null): Node | null {
        const particleNode = this.getParticle(key);
        if (!particleNode) {
            return null;
        }

        // 设置特效位置和旋转
        particleNode.setWorldPosition(position);    
        particleNode.rotation = rotation;

        // 设置父节点
        if (parent) {
            parent.addChild(particleNode);
        } else {
            this.node.addChild(particleNode);
        }

        // 激活特效
        particleNode.active = true;

        // 记录活跃特效信息
        this.activeParticles.set(particleNode, {
            node: particleNode,
            key: key,
        });

        return particleNode;
    }

    /**
     * 播放特效并在指定时间后自动释放
     * @param key 特效标识
     * @param particleNode NODE
     * @param duration 自动释放延迟时间（秒）
     */
    public ParticleWithTimer(key: string, particleNode: Node, duration = 2) {
        if (!particleNode) {
            return null;
        }
        // 使用定时器延迟释放特效
        setTimeout(() => {
            if (particleNode && particleNode.parent) {
                this.releaseParticle(key, particleNode);
            }
        }, duration * 1000); // 转换为毫秒
    }

    /**
     * 释放特效节点回对象池
     * @param key 特效标识
     * @param particleNode 特效节点
     */
    public releaseParticle(key: string, particleNode: Node): void {
        if (!key || !particleNode) {
          //  console.error('Key or particle node is invalid.');
            return;
        }

        // 从活跃特效中移除
        if (this.activeParticles.has(particleNode)) {
            this.activeParticles.delete(particleNode);
        }

        // 检查对象池是否存在
        if (!this.particlePools.has(key)) {
         //   console.error(`Particle pool for key "${key}" does not exist.`);
            particleNode.destroy();
            return;
        }

        // 重置粒子系统状态
        this.resetParticleSystem(particleNode);

        // 释放节点回对象池
        const config = this.particlePools.get(key)!;
       // console.log(`[ParticleManager] Before releasing particle for key "${key}", pool size: ${config.pool.size()}`);
        particleNode.active = false;
        particleNode.removeFromParent();
        config.pool.put(particleNode);
      //  console.log(`[ParticleManager] After releasing particle for key "${key}", pool size: ${config.pool.size()}`);
    }

    /**
     * 清除指定特效池
     * @param key 特效标识
     */
    public clearPool(key: string): void {
        if (!this.particlePools.has(key)) {
          //  console.error(`Particle pool for key "${key}" does not exist.`);
            return;
        }

        // 清除对象池
        const config = this.particlePools.get(key)!;
        config.pool.clear();
        this.particlePools.delete(key);
        
        // 销毁该类型的活跃特效
        for (const [node, info] of this.activeParticles.entries()) {
            if (info.key === key) {
                node.destroy();
                this.activeParticles.delete(node);
            }
        }
        
      //  console.log(`Cleared particle pool for key "${key}".`);
    }

    /**
     * 清除所有特效池
     */
    public clearAllPools(): void {
        // 清除所有对象池
        for (const key of this.particlePools.keys()) {
            const config = this.particlePools.get(key)!;
            config.pool.clear();
        }
        this.particlePools.clear();
        
        // 销毁所有活跃特效
        for (const [node] of this.activeParticles.entries()) {
            node.destroy();
        }
        this.activeParticles.clear();
        
     //   console.log('Cleared all particle pools.');
    }

    /**
     * 获取指定特效池的大小
     * @param key 特效标识
     * @returns 对象池大小
     */
    public getPoolSize(key: string): number {
        if (!this.particlePools.has(key)) {
            return 0;
        }

        const config = this.particlePools.get(key)!;
        return config.pool.size();
    }

    /**
     * 获取活跃特效数量
     * @param key 特效标识，可选，不指定则返回所有活跃特效数量
     * @returns 活跃特效数量
     */
    public getActiveParticleCount(key?: string): number {
        if (!key) {
            return this.activeParticles.size;
        }

        let count = 0;
        for (const info of this.activeParticles.values()) {
            if (info.key === key) {
                count++;
            }
        }
        return count;
    }

    /**
     * 重置粒子系统状态
     * @param particleNode 特效节点
     */
    private resetParticleSystem(particleNode: Node): void {
        // 重置粒子系统组件
        const particleSystems = particleNode.getComponentsInChildren(ParticleSystem2D);
        particleSystems.forEach((system: any) => {
            if (system && system.resetSystem) {
                system.resetSystem();
            }
        });

        // // 重置拖尾组件
        // const trailRenderers = particleNode.getComponentsInChildren(TrailRenderer);
        // trailRenderers.forEach((trail: any) => {
        //     if (trail && trail.clear) {
        //         trail.clear();
        //     }
        // });
    }


}
