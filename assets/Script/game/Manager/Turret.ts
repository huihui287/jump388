import { _decorator, Component, Node, instantiate, Prefab, Vec3, tween, v3, director, Quat,Tween, Label, CCFloat, CCInteger } from 'cc';
import { BaseNodeCom } from '../BaseNodeCom';
import { DownGridManager } from './DownGridManager';
import { gridDownCmpt } from '../item/gridDownCmpt';
import StateMachine, { IState } from '../../Common/StateMachine';
import { GridData, GridType } from '../../Tools/enumConst';
import LoaderManeger from '../../sysloader/LoaderManeger';
import { gridCmpt } from '../item/gridCmpt';
import { DEV } from 'cc/env';
import { App } from '../../Controller/app';
import GameData from '../../Common/GameData';
import ViewManager from '../../Common/view/ViewManager';
const { ccclass, property } = _decorator;

/**
 * 炮塔状态枚举
 * 定义炮塔的不同状态
 */
export enum TurretState {
    /** 空闲状态：炮塔未激活 */
    IDLE = 'idle',
    /** 活跃状态：炮塔正在攻击 */
    ACTIVE = 'active',
    /** 重新装填状态：炮塔正在重新装填 */
    RELOADING = 'reloading',
    /** 升级状态：炮塔正在升级 */
    UPGRADING = 'upgrading',
    /** 禁用状态：炮塔被禁用 */
    DISABLED = 'disabled'
}

/**
 * 炮塔数据接口
 */
interface TurretData {
    turret: Turret;
    isAttacking: boolean;
    reloadTime: number;
    upgradeTime: number;
    attackCooldown: number; // 攻击冷却时间
}

/**
 * 空闲状态
 */
class IdleState implements IState {
    readonly name: string = TurretState.IDLE;
    private _data: TurretData;
    
    constructor(data: TurretData) {
        this._data = data;
    }
    
    onEnter(fromState: IState | null, params?: any) {
        this._data.isAttacking = false;
        this._data.turret.unscheduleAllCallbacks();
        console.log('Turret is now idle');
    }
    
    onUpdate(dt: number) {
        // 空闲状态下的更新逻辑
    }
    
    onExit(toState: IState | null) {
        console.log('Turret is leaving idle state');
    }
    
    onEvent(eventName: string, data?: any): boolean {
        switch (eventName) {
            case 'activate':
                // 激活炮塔
                return true;
            case 'disable':
                // 禁用炮塔
                return true;
            case 'upgrade':
                // 开始升级
                return true;
            default:
                return false;
        }
    }
}

/**
 * 活跃状态
 */
class ActiveState implements IState {
    readonly name: string = TurretState.ACTIVE;
    private _data: TurretData;
    
    constructor(data: TurretData) {
        this._data = data;
    }
    
    onEnter(fromState: IState | null, params?: any) {
        this._data.isAttacking = true;
        this._data.attackCooldown = 0; // 重置攻击冷却时间
        this._data.turret.startAttack();
        console.log('Turret is now active and attacking');
    }
    
    onUpdate(dt: number) {
        // 活跃状态下的更新逻辑
        this._data.attackCooldown -= dt;
        if (this._data.attackCooldown <= 0) {
            // 执行攻击
            this._data.turret.fireAttack();
            // 重置攻击冷却时间
            this._data.attackCooldown = this._data.turret.attackInterval;
        }
    }
    
    onExit(toState: IState | null) {
        this._data.turret.stopAttack();
        console.log('Turret is leaving active state');
    }
    
    onEvent(eventName: string, data?: any): boolean {
        switch (eventName) {
            case 'deactivate':
                // 停用炮塔
                return true;
            case 'reload':
                // 开始重新装填
                return true;
            case 'upgrade':
                // 开始升级
                return true;
            case 'disable':
                // 禁用炮塔
                return true;
            default:
                return false;
        }
    }
}


/**
 * 禁用状态
 */
class DisabledState implements IState {
    readonly name: string = TurretState.DISABLED;
    private _data: TurretData;
    
    constructor(data: TurretData) {
        this._data = data;
    }
    
    onEnter(fromState: IState | null, params?: any) {
        this._data.isAttacking = false;
        this._data.turret.unscheduleAllCallbacks();
        console.log('Turret is now disabled');
    }
    
    onUpdate(dt: number) {
        // 禁用状态下的更新逻辑
    }
    
    onExit(toState: IState | null) {
        console.log('Turret is leaving disabled state');
    }
    
    onEvent(eventName: string, data?: any): boolean {
        switch (eventName) {
            case 'enable':
                // 启用炮塔
                return true;
            default:
                return false;
        }
    }
}

/**
 * 炮塔类
 * 继承自BaseNodeCom，负责发射攻击并击中DownGridManager中的gridDown
 * @description 炮塔系统，具有攻击速度、攻击范围和伤害属性，可从多个grid节点发射攻击
 */
@ccclass('Turret')
export class Turret extends BaseNodeCom {
    
    /** 存储的grid数据数组：用于发射攻击的grid数据 */
    public gridDataList: GridData[] = [];
    
    /** 攻击间隔时间（秒）：控制炮塔的攻击速度 */
    @property({
        type: CCFloat,
        tooltip: "攻击间隔时间（秒）"
    })
    public attackInterval: number = 1.0;
    
    /** 发射的grid预制体：炮塔发射的子弹预制体 */
    public bulletPrefab: Prefab = null;
    
    /** 攻击伤害值：每次攻击对目标造成的伤害 */
    @property({
        type: CCInteger,
        tooltip: "攻击伤害值"
    })
    public attackDamage: number = 1;
    
    /** 下落方块管理器引用：用于获取和攻击活跃的gridDown */
    @property(DownGridManager)
    private DownGridMgr: DownGridManager = null;
    
    /** 状态机实例 */
    private _stateMachine: StateMachine = new StateMachine();
    
    /** 炮塔数据 */
    private _turretData: TurretData;
    
    /** 子弹对象池：存储可复用的子弹节点 */
    private bulletPool: Node[] = [];
    /** 最大子弹池大小：控制对象池的最大容量 */
    private maxBulletPoolSize: number = 20;

    /** 基础容量：初始值为50 */
    private _baseCapacity: number = 50;
    /** 发射位置节点：用于计算子弹的初始位置和方向 */
    private spawnPosition: Node = null;
    /**
     * 获取最大容量
     * 容量 = 基础容量 * 炮塔等级
     */
    public get maxCapacity(): number {
        return this._baseCapacity * GameData.loadData(GameData.TurretLevel, 1);
    }
    /**
* 容量显示
*/
    Capacity: Node = null;

    /** 存储的grid数据还剩多少个 */
    public gridDataCountLb: Label = null;

    /** 炮管 */
    public gunBarrel: Node = null;

    /**
     * 组件加载时调用
     * 初始化DownGridManager引用
     * @description 炮塔初始化时获取必要的组件引用
     */
    protected async onLoad(): Promise<void> {
        // 调用父类的onLoad方法
        super.onLoad();

        // 初始化炮塔数据
        this._turretData = {
            turret: this,
            isAttacking: false,
            reloadTime: 0,
            upgradeTime: 0,
            attackCooldown: this.attackInterval // 初始化攻击冷却时间
        };

        // 初始化状态机
        this.initStateMachine();

        // 检查DownGridManager是否获取成功
        if (!this.DownGridMgr) {
            console.error('Turret: 无法获取DownGridManager组件');
            this.disable();
        }
        if (!this.bulletPrefab) {
            this.bulletPrefab = await LoaderManeger.instance.loadPrefab('prefab/pieces/grid');
        }
        this.gridDataCountLb = this.viewList.get('Node/Label').getComponent(Label);

        this.Capacity = this.viewList.get('Capacity');
        this.updateCapacityView();

        // 初始化发射位置节点
        this.spawnPosition = this.viewList.get('coin1/SpawnPosition');

    }
    
    /**
     * 组件启用时调用
     * 开始攻击循环
     * @description 炮塔启用后开始自动攻击
     */
    protected start(): void {
        // 默认激活炮塔
        this.activate();
    }
    update(dt: number) {
        if (App.gameCtr.isPause) {
            return;
        }
        this.updateStateMachine(dt);
    }
    /**
     * 组件销毁时调用
     * 停止攻击循环
     * @description 炮塔销毁前清理资源和定时器
     */
    public onDestroy(): void {
        super.onDestroy();
        this.deactivate();
        this.clearBulletPool();
    }
    
    /**
     * 组件禁用时调用
     * 停止攻击循环
     * @description 炮塔禁用时暂停攻击
     */
    protected onDisable(): void {
        this.deactivate();
    }
    
    /**
     * 清理子弹对象池
     */
    private clearBulletPool(): void {
        for (const bullet of this.bulletPool) {
            if (bullet && bullet.isValid) {
                bullet.destroy();
            }
        }
        this.bulletPool = [];
    }
    
    /**
     * 初始化状态机
     */
    private initStateMachine(): void {
        // 启用调试模式
        this._stateMachine.debugMode = true;
        
        // 设置状态变化回调
        this._stateMachine.onStateChange = this.onStateChange.bind(this);
        
        // 创建状态实例
        const idleState = new IdleState(this._turretData);
        const activeState = new ActiveState(this._turretData);
        const disabledState = new DisabledState(this._turretData);
        
        // 添加所有状态
        this._stateMachine.addStates([idleState, activeState, disabledState]);
        
        // 初始状态设为空闲
        this._stateMachine.changeState(TurretState.IDLE);
    }
    
    /**
     * 更新状态机
     * @param dt 时间间隔
     */
    private updateStateMachine(dt: number): void {
        this._stateMachine.update(dt);
    }
    
    /**
     * 状态变化回调
     * @param fromState 上一个状态
     * @param toState 下一个状态
     * @param params 参数
     */
    private onStateChange(fromState: IState | null, toState: IState | null, params?: any): void {
        console.log(`Turret state changed: ${fromState?.name || 'None'} -> ${toState?.name || 'None'}`, params);
    }
    
    /**
     * 激活炮塔
     * 将炮塔设置为活跃状态
     */
    public activate(): void {
        if (this._stateMachine.currentStateName !== TurretState.DISABLED) {
            this._stateMachine.changeState(TurretState.ACTIVE);
        }
    }
    
    /**
     * 停用炮塔
     * 将炮塔设置为空闲状态
     */
    public deactivate(): void {
        this._stateMachine.changeState(TurretState.IDLE);
    }
    
    /**
     * 禁用炮塔
     * 将炮塔设置为禁用状态
     */
    public disable(): void {
        this._stateMachine.changeState(TurretState.DISABLED);
    }
    
    /**
     * 开始攻击循环
     * 开始攻击
     * @description 开始炮塔的自动攻击行为
     */
    public startAttack(): void {
        if (this._stateMachine.currentStateName !== TurretState.ACTIVE) return;
        
        // 攻击逻辑在ActiveState的onUpdate方法中处理
    }
    
    /**
     * 停止攻击循环
     * 停止攻击行为
     * @description 停止炮塔的自动攻击行为
     */
    public stopAttack(): void {
        // 不需要做什么，因为攻击逻辑在update方法中，会根据状态自动停止
    }
    

    
    /**
     * 执行攻击
     * 使用gridDataList中最前面的一项数据进行攻击，攻击后释放该数据
     * 如果找不到同类型目标，则将数据放到列表最后，继续寻找下一个
     * @description 执行实际的攻击操作，从gridDataList中取出数据发射攻击
     */
    public fireAttack(): void {
        // 检查gridDataList是否有数据
        if (this.gridDataList.length > 0 && this.DownGridMgr) {
            // 遍历所有数据，寻找可攻击的目标
            let foundTarget = false;
            let originalLength = this.gridDataList.length;
            let processedCount = 0;
            
            while (!foundTarget && this.gridDataList.length > 0 && processedCount < originalLength) {
                // 取出最前面的一项数据
                const gridData = this.gridDataList[0];
                
                // 寻找同类型的攻击目标
                const target = this.findTargetByType(gridData.type);
                
                // 如果找到目标，则发射攻击
                if (target && target.isValid) {
                    try {
                        // 扣除虚拟血量
                        this.DownGridMgr.damageVirtualHealthByType(target, gridData.attack);
                        
                        // 发射子弹
                        this.fire(target, gridData);
                        
                        // 攻击后释放这一条数据
                        this.gridDataList.shift(); // 直接移除第一个元素
                        
                        foundTarget = true;
                    } catch (error) {
                        console.error('Fire attack error:', error);
                        // 出错时也移除数据，避免卡住
                        this.gridDataList.shift();
                    }
                } else {
                    // 如果找不到目标，将数据放到列表最后
                    this.gridDataList.push(this.gridDataList.shift()!);
                }
                
                processedCount++;
            }
        }
        this.updateGridDataCountLb();
        this.updateCapacityView();
    }

    /**
     * 按类型寻找攻击目标
     * 寻找同类型最下面的活跃gridDown
     * @param type 目标类型
     * @returns 找到的目标节点，如果没有找到则返回null
     * @description 在DownGridManager中寻找指定类型的目标
     */
    private findTargetByType(type: number): Node | null {
        // 使用DownGridManager的方法寻找同类型最下面的gridDown
        if (this.DownGridMgr) {
            return this.DownGridMgr.getFrontGridByType(type);
        }
        return null;
    }

    /**
     * 从对象池获取子弹
     * @returns 子弹节点
     */
    private getBulletFromPool(): Node | null {
        if (this.bulletPool.length > 0) {
            return this.bulletPool.pop();
        }
        
        if (!this.bulletPrefab) return null;
        
        // 如果对象池未达到最大容量，创建新子弹
        if (this.bulletPool.length < this.maxBulletPoolSize) {
            return instantiate(this.bulletPrefab);
        }
        
        return null;
    }

    /**
     * 回收子弹到对象池
     * @param bullet 要回收的子弹节点
     */
    private recycleBulletToPool(bullet: Node): void {
        if (!bullet) return;
        
        // 确保子弹未被销毁
        if (!bullet.isValid) return;
        
        // 停止子弹上的所有动画
     //   tween.stopAllByTarget(bullet);
    
        // 重置子弹状态
        bullet.setParent(null);
        bullet.active = true;
        bullet.setPosition(Vec3.ZERO);
        bullet.setScale(1, 1, 1);
        bullet.setRotation(Quat.IDENTITY);
        
        // 如果对象池未达到最大容量，回收子弹
        if (this.bulletPool.length < this.maxBulletPoolSize) {
            this.bulletPool.push(bullet);
        } else {
            // 否则销毁子弹
            bullet.destroy();
        }
    }

    /**
     * 发射攻击
     * 从指定的grid数据发射子弹到目标
     * @param target 目标节点
     * @param gridData 发射攻击的grid数据
     * @description 从源grid数据向目标发射子弹
     */
    private fire(target: Node, gridData: GridData): void {
        // 检查目标和炮塔节点是否有效
        if (!target || !target.isValid || !this.node || !this.node.isValid) return;
        
        try {
            // 从对象池获取子弹
            const bullet = this.getBulletFromPool();
            if (!bullet) return;

            // 设置子弹的父节点为场景根节点，避免继承炮塔的变换
            bullet.setParent(this.node.parent);
            let bulletcom = bullet.getComponent(gridCmpt);
            if (!bulletcom) {
                this.recycleBulletToPool(bullet);
                return;
            }
            // 设置子弹的类型为gridData的类型
            bulletcom.setType(gridData.type);
            
            // 设置子弹的初始位置为炮塔的位置
            bullet.setWorldPosition(this.spawnPosition.worldPosition);
            // 设置子弹的初始缩放
            bullet.setScale(1, 1, 1);
            
            // 获取目标的位置
            const targetPos = target.worldPosition;
            
            // 计算距离，动态调整飞行时间
            const distance = Vec3.distance(this.node.worldPosition, targetPos);
            const flightTime = Math.max(0.3, Math.min(1.0, distance / 500)); // 飞行时间在0.3-1.0秒之间
            
            // 创建子弹飞行的动画
            tween(bullet)
                .to(flightTime, { 
                    worldPosition: targetPos,
                    scale: new Vec3(0.3, 0.3, 0.3) // 飞行过程中缩小
                }, {
                    easing: 'linear' // 线性运动，使速度更均匀
                })
                .call(() => {
                    // 检查目标是否仍然有效
                    if (target && target.isValid) {
                        // 子弹到达目标后，击中目标
                        this.hitTarget(target, gridData.attack);
                    }
                    
                    // 回收子弹到对象池
                    this.recycleBulletToPool(bullet);
                })
                .start();

            // 仅在开发模式下输出日志
            if (DEV) {
             //   console.log('Fire bullet to target:', target, 'Flight time:', flightTime);
            }
        } catch (error) {
         //   console.error('Fire error:', error);
        }
    }

    /**
     * 击中目标
     * 对目标造成伤害
     * @param target 被击中的目标节点
     * @param damage 伤害值
     * @description 处理子弹击中目标的逻辑，造成伤害
     */
    private hitTarget(target: Node, damage: number): void {
        // 检查目标节点是否有效
        if (!target || !target.isValid) return;
        
        // 获取目标的gridDownCmpt组件
        const gridDownCmptcom = target.getComponent(gridDownCmpt);
        
        // 如果目标有gridDownCmpt组件，则造成伤害
        if (gridDownCmptcom) {
            gridDownCmptcom.takeDamage(damage,()=>{
                // 目标被消灭后，从DownGridManager中移除
                this.DownGridMgr.recycleGridByNode(target);
            });
        }
    }
    
    /**
     * 添加grid数据
     * 向存储的grid数据数组中添加新的grid数据
     * @param gridData 新的grid数据
     * @description 动态添加发射点到炮塔，只添加GridType中包含的类型
     */
    public updateGridDataCountLb(count?: number): void {
        if (!this.gridDataCountLb || !this.gridDataCountLb.isValid) {
            return;
        }
        const value = typeof count === 'number' ? count : this.gridDataList.length;
        // 显示当前数量 / 最大容量
        this.gridDataCountLb.string = `${value}/${this.maxCapacity}`;
    }

    /**
     * 更新容量显示
     * 将gridDataList的数据同步显示到CapacityAm的子节点上
     */
    public updateCapacityView() {
        if (!this.Capacity) return;
        
        // 获取所有GridType类型，按照枚举顺序排列
        const allGridTypes = Object.values(GridType).filter(value => typeof value === 'number') as GridType[];
        
        // 获取当前水果数据，创建映射
        let gridDataMap = new Map<GridType, number>();
        this.getGroupedGridData().forEach(item => {
            gridDataMap.set(item.type, item.count);
        });
        
        const children = this.Capacity.children;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const children1 = child.getChildByName('Label');
            if (!children1) return;
            
            if (i < allGridTypes.length) {
                // 按照GridType顺序显示，没有的显示0
                const type = allGridTypes[i];
                const count = gridDataMap.get(type) || 0;
                children1.getComponent(Label).string = count.toString();
            } else {
                // 超出GridType数量的节点显示0
                children1.getComponent(Label).string = '0';
            }
        }
    }

    public addGridData(gridData: GridData): void {
        // 检查是否达到最大容量
        if (this.gridDataList.length >= this.maxCapacity) {
            // console.warn('Turret: 已达到最大容量，无法添加新的grid数据');
            return;
        }

        // 检查grid数据是否有效
        if (gridData) {
            // 检查类型是否在GridType中
            const isValidType = (Object as any).values(GridType).includes(gridData.type);
            if (isValidType) {
                // 添加数据到数组
                this.gridDataList.push(gridData);
                this.updateGridDataCountLb();
                this.updateCapacityView();
            }
        }
    }
    
    /**
     * 获取归类后的Grid数据
     * 将gridDataList按水果种类分类，并统计每种的数量
     * @returns 包含种类和数量的对象数组
     */
    public getGroupedGridData(): { type: GridType, count: number }[] {
        const summary = new Map<GridType, number>();

        // 统计每种类型的数量
        for (const data of this.gridDataList) {
            const count = summary.get(data.type) || 0;
            summary.set(data.type, count + 1);
        }

        // 转换为数组格式
        const result: { type: GridType, count: number }[] = [];
        summary.forEach((count, type) => {
            result.push({ type, count });
        });

        // 按类型排序，保证顺序一致
        result.sort((a, b) => a.type - b.type);

        return result;
    }
    
    // 显示炮塔升级界面
    onClick_TurretBTN() {
        LoaderManeger.instance.loadPrefab('prefab/ui/UpTurret').then((prefab) => {
            let upTurret = instantiate(prefab);
            ViewManager.show({
                node: upTurret,
                name: "UpTurret"
            });
        }).catch((error) => {
            console.error('Failed to load UpTurret prefab:', error);
        });
    }
    /**
     * 设置攻击间隔
     * 调整炮塔的攻击速度
     * @param interval 新的攻击间隔时间（秒）
     * @description 动态调整炮塔的攻击速度
     */
    public setAttackInterval(interval: number): void {
        // 确保攻击间隔不小于0.1秒
        this.attackInterval = Math.max(0.1, interval);
    }
    
    /**
     * 设置攻击伤害
     * 调整炮塔的攻击伤害值
     * @param damage 新的攻击伤害值
     * @description 动态调整炮塔的攻击威力
     */
    public setAttackDamage(damage: number): void {
        // 确保攻击伤害不小于1
        this.attackDamage = Math.max(1, damage);
    }
        
    /**
     * 获取当前状态
     * @returns 当前的炮塔状态名称
     */
    public getCurrentState(): string {
        return this._stateMachine.currentStateName;
    }
    
    /**
     * 开始升级
     * 将炮塔设置为升级状态
     */
    public startUpgradeProcess(): void {
        if (this._stateMachine.currentStateName !== TurretState.DISABLED) {
            this._stateMachine.changeState(TurretState.UPGRADING);
        }
    }
    
    /**
     * 开始重新装填
     * 将炮塔设置为重新装填状态
     */
    public startReloadProcess(): void {
        if (this._stateMachine.currentStateName === TurretState.ACTIVE) {
            this._stateMachine.changeState(TurretState.RELOADING);
        }
    }
    
    /**
     * 发送事件给状态机
     * @param eventName 事件名称
     * @param data 事件数据
     * @returns 事件是否被处理
     */
    public sendEvent(eventName: string, data?: any): boolean {
        return this._stateMachine.sendEvent(eventName, data);
    }
}
