import { _decorator, Component, Node, Prefab, v3, instantiate, tween, isValid, CCFloat, CCInteger } from 'cc';
import { Constant, GridType } from '../../Tools/enumConst';
import { gridCmpt } from '../item/gridCmpt';
import LoaderManeger from '../../sysloader/LoaderManeger';
import { gridDownCmpt } from '../item/gridDownCmpt';
import EventManager from '../../Common/view/EventManager';
import { EventName } from '../../Tools/eventName';
import { App } from '../../Controller/app';
import AudioManager from '../../Common/AudioManager';
    /**
     * 表示被回收方块的信息接口
     */
    interface GridPosition {
        x: number;
        y: number;
        z: number;
        type: number;
    }   
const { ccclass, property } = _decorator;

@ccclass('DownGridManager')
export class DownGridManager extends Component {
 
    /** 预制体引用：水果方块预制体 */
    private gridDownPre: Prefab = null;
    /** 预制体引用：粒子特效预制体 */
    private particlePre: Prefab = null;

    //出生点位合集里面有9个children分别是9个出生点位
    @property({
        type: Node,
        tooltip: "出生点位合集"
    })
    public BirthPoint: Node = null;
    
    // 配置属性
    @property({
        type: CCInteger,
        tooltip: "总共生成的水果方块数量"
    })
    public totalGridCount: number = 50;

    @property({
        type: CCFloat,
        tooltip: "下落速度(像素/秒)"
    })
    public fallSpeed: number = 100;

    @property({
        type: CCInteger,
        tooltip: "每次水果到达底部扣除的血量"
    })
    public damagePerFruit: number = 10;

    @property({
        type: CCInteger,
        tooltip: "游戏结束的血量阈值"
    })
    public gameOverHealthThreshold: number = 0;

    // 内部变量
    /** 已生成的水果方块总数：跟踪当前已生成的水果方块数量 */
    private generatedCount: number = 0;
    /** 水果方块对象池：存储可复用的水果方块节点，用于优化性能 */
    private gridPool: Node[] = [];
    /** 活跃水果方块数组：存储当前正在屏幕上活跃的水果方块 */
    private activeGrids: Node[] = [];
    /** 锁定的水果方块集合：存储已被选中的水果方块，防止重复选择 */
    private lockedGrids: Set<Node> = new Set();
    /** 生成状态标志：控制水果方块是否正在生成 */
    private isGenerating: boolean = false;

    /** 路径可用性检查定时器ID */
    private pathCheckIntervalId: any = null;
    
    /**
     * 下落进度映射：跟踪每个水果方块是否正在下落
     */
    private fallProgressMap: Map<Node, boolean> = new Map();
    
    /**
     * 路径最后一个水果方块映射：存储每个下落路径（出生点位）的最后一个水果方块节点
     * 键：出生点位的索引
     * 值：该路径上最后生成的水果方块节点
     */
    private pathLastGridMap: Map<number, Node> = new Map();
    
    /**
     * 水果方块高度：单个水果方块的高度，用于计算下落距离阈值
     */
    private gridHeight: number = Constant.Height + 1;

    /**
     * 生命周期方法：组件销毁时调用
     */
    onDestroy() {
       // this.clearAllGrids();
    }

    protected onLoad(): void {
    }
    /**
     * 加载水果方块预制体
     * 异步从resources目录加载水果方块预制体资源
     */
    async createGrid() {
        // 修复预制体路径，resources.load会自动从assets/resources目录开始查找
        this.gridDownPre = await LoaderManeger.instance.loadPrefab('prefab/pieces/gridDown');
    }

    /**
     * 初始化并开始生成水果方块（新玩家第一关专用）
     * 一次性生成10排水果，然后开始向下移动
     * 
     * 设计思路：
     * 1. 一次性生成10排水果：使用generateRows()方法，跳过路径可用性检查
     * 2. 设置生成状态为true：让水果方块开始下落
     * 3. 启动路径可用性检查定时器：用于后续继续生成水果
     * 4. 不重置generatedCount：保持已生成的数量，避免重复计数
     * 
     * @description 专为新玩家第一关设计的初始化方法，一次性生成10排水果后开始下落
     */
    async initAndStart() {
        // 确保预制体已加载
        if (!this.gridDownPre) {
            console.error("水果方块预制体未加载，无法初始化");
            return;
        }

        // 确保没有正在生成
        if (this.isGenerating) {
            console.warn("已经在生成中，无需重复初始化");
            return;
        }

        // 一次性生成5排水果
        // 参数说明：
        // - rows: 5（生成5排）
        // - skipPathCheck: true（跳过路径可用性检查，因为刚开始没有水果）
        // - startRowIndex: 0（从第0排开始）
        this.generateRows(5, true, 0);

        // 设置生成状态为true，让水果方块开始下落
        this.isGenerating = true;

        // 启动路径可用性检查定时器（每0.1秒检查一次）
        // 用于后续继续生成水果，保持正常的生成节奏
        if (!this.pathCheckIntervalId) {
            this.pathCheckIntervalId = this.schedule(this.checkAllPathsAvailability, 0.1);
        }

        console.log(`新玩家第一关初始化完成：已生成10排水果（共${this.generatedCount}个），开始下落`);
    }
    
    /**
     * 开始生成水果方块
     */
    startGenerate() {
        if (this.isGenerating) {
            return;
        }

        this.isGenerating = true;
        this.generatedCount = 0;
        
        // 立即生成第一批
        this.generateBatch();
        
        // 启动路径可用性检查定时器（每0.1秒检查一次）
        if (!this.pathCheckIntervalId) {
            this.pathCheckIntervalId = this.schedule(this.checkAllPathsAvailability, 0.1);
        }
    }

    
    /**
     * 停止生成水果方块
     */
    stopGenerate() {
        this.isGenerating = false;
        this.unschedule(this.generateBatch);
        
        // 停止路径可用性检查定时器
        if (this.pathCheckIntervalId) {
            this.unschedule(this.pathCheckIntervalId);
            this.pathCheckIntervalId = null;
        }
    }

    /**
     * 生成一批水果方块（一排）
     */
    private generateBatch() {
        if (this.generatedCount >= this.totalGridCount) {
            this.stopGenerate();
            return;
        }

        // 计算本次生成的数量：一次生成一排（9个），不超过剩余数量
        const batchSize = Math.min(this.BirthPoint.children.length, this.totalGridCount - this.generatedCount);
        
        // 检查是否可以生成一排：所有路径都必须可用
        let canGenerateRow = true;
        for (let pathIndex = 0; pathIndex < this.BirthPoint.children.length; pathIndex++) {
            if (!this.isPathAvailable(pathIndex)) {
                canGenerateRow = false;
                break;
            }
        }
        
        // 如果所有路径都可用，生成一排水果方块
        if (canGenerateRow) {
            for (let pathIndex = 0; pathIndex < this.BirthPoint.children.length && this.generatedCount < this.totalGridCount; pathIndex++) {
                // 正常生成时，默认更新路径映射
                this.generateSingleGrid(pathIndex);
            }
        }
    }

    /**
     * 生成单个水果方块
     * @param pathIndex 出生点位索引
     * @param skipPathCheck 是否跳过路径可用性检查，默认为false
     * @param yOffset Y轴偏移量，默认为0
     * @param shouldUpdatePathMap 是否更新路径最后一个水果方块记录，默认为true
     */
    private generateSingleGrid(pathIndex: number, skipPathCheck: boolean = false, yOffset: number = 0, shouldUpdatePathMap: boolean = true) {
        if (!this.gridDownPre) {
            console.error("水果方块预制体未加载");
            return;
        }

        // 检查路径是否可用（除非跳过检查）
        if (!skipPathCheck && !this.isPathAvailable(pathIndex)) {
            console.log(`路径${pathIndex}不可用，跳过本次生成`);
            return;
        }

        // 获取指定路径的出生点位
        const selectedBirthPoint = this.BirthPoint.children[pathIndex];

        // 从对象池获取或创建新水果方块
        let gridNode: Node;
        if (this.gridPool.length > 0) {
            gridNode = this.gridPool.pop();
            this.node.addChild(gridNode);
            gridNode.active = true;
        } else {
            gridNode = instantiate(this.gridDownPre);
            this.node.addChild(gridNode);
             gridNode.active = true;
        //    console.log("创建新的水果方块节点", gridNode);
        }
        // 获取当前GridType的所有类型数量
        const gridTypeCount = Object.values(GridType).filter(value => typeof value === 'number').length;
        const randomType = Math.floor(Math.random() * gridTypeCount); // 根据实际GridType数量生成随机类型
        const gridComponent = gridNode.getComponent(gridDownCmpt);
        if (gridComponent) {
            gridComponent.initData(randomType as GridType);
        }
        // 设置生成位置：使用世界坐标，并应用Y轴偏移
        const worldPosition = selectedBirthPoint.worldPosition;
        gridNode.worldPosition = v3(worldPosition.x, worldPosition.y - yOffset, worldPosition.z);
        //console.log("生成位置:", worldPosition, "路径索引:", pathIndex);

        // 开始下落
        this.startFall(gridNode);

        // 更新路径最后一个水果方块记录（只在需要时更新）
        if (shouldUpdatePathMap) {
            this.pathLastGridMap.set(pathIndex, gridNode);
        }

        // 更新计数
        this.activeGrids.push(gridNode);
        this.generatedCount++;

       // console.log("当前活跃水果方块数量:", this.activeGrids.length, "已生成总数:", this.generatedCount);
    }
    
    /**
     * 手动生成指定行数的水果（公共接口）
     * @param rows 要生成的行数
     * @param skipPathCheck 是否跳过路径可用性检查，默认为true
     * @param startRowIndex 起始行索引，用于计算Y偏移，默认为0
     */
    public generateRows(rows: number, skipPathCheck: boolean = true, startRowIndex: number = 0) {
        for (let row = 0; row < rows; row++) {
            const yOffset = (startRowIndex + row) * this.gridHeight;
            for (let pathIndex = 0; pathIndex < this.BirthPoint.children.length; pathIndex++) {
                // 只在生成第一排（最上面的一排）时更新pathLastGridMap
                // 这样可以确保pathLastGridMap中存储的是最上面的水果方块，避免后续生成时重合
                // 注意：row=0时生成的是最上面的一排（Y坐标最高），row越大生成的位置越低
                const shouldUpdatePathMap = (row === 0);
                this.generateSingleGrid(pathIndex, skipPathCheck, yOffset, shouldUpdatePathMap);
            }
        }
    }

    /**
     * 检查路径是否可用
     * 如果路径上没有水果方块，或者最后一个水果方块已经下落到距离起始点大于等于一个水果方块高度的位置，则路径可用
     */
    private isPathAvailable(pathIndex: number): boolean {
        // 如果路径上没有水果方块，直接可用
        if (!this.pathLastGridMap.has(pathIndex)) {
            return true;
        }
        
        // 获取路径上的最后一个水果方块
        const lastGrid = this.pathLastGridMap.get(pathIndex);
        if (!lastGrid) {
            return true;
        }
        
        // 检查水果方块是否仍然活跃
        if (this.activeGrids.indexOf(lastGrid) === -1) {
            // 如果水果方块不在活跃列表中，说明已经被回收，路径可用
            this.pathLastGridMap.delete(pathIndex);
            return true;
        }
        
        // 获取出生点位的世界坐标
        const birthPoint = this.BirthPoint.children[pathIndex];
        const startY = birthPoint.worldPosition.y;
        
        // 计算当前下落距离（使用世界坐标）
        const currentY = lastGrid.worldPosition.y;
        const fallDistance = startY - currentY;
        
        // 检查下落距离是否大于等于一个水果方块高度
        const isAvailable = fallDistance >= this.gridHeight;
       // console.log(`路径${pathIndex}可用性检查: 下落距离=${fallDistance.toFixed(2)}, 水果方块高度=${this.gridHeight}, 可用=${isAvailable}`);
        
        return isAvailable;
    }
    
    /**
     * 检查所有路径是否都可用
     * 当所有路径都可用时，返回true，表示可以生成下一批
     */
    private areAllPathsAvailable(): boolean {
        // 如果没有BirthPoint或children，返回false
        if (!this.BirthPoint || this.BirthPoint.children.length === 0) {
            return false;
        }
        
        // 检查每个路径是否都可用
        for (let pathIndex = 0; pathIndex < this.BirthPoint.children.length; pathIndex++) {
            if (!this.isPathAvailable(pathIndex)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * 定期检查路径可用性并生成水果方块
     * 当上一排下落距离达到一个GridDown高度时生成下一排
     */
    private checkAllPathsAvailability() {
        if (this.isGenerating && this.generatedCount < this.totalGridCount) {
            // 检查所有路径是否都可用
            if (this.areAllPathsAvailable()) {
                this.generateBatch();
            }
        }
    }

    /**
     * 开始下落
     */
    public startFall(gridNode: Node) {
        
        // 标记为正在下落
        this.fallProgressMap.set(gridNode, true);
    }

    /**
     * 每帧更新
     * 处理所有活跃水果方块的下落
     */
    update(deltaTime: number) {
        // 检查是否暂停
        // if (this.isPaused) return;
        if (App.gameCtr.isPause) return;
        
        // 检查是否有水果到达底部
        let hasReachedBottom = false;
        
        // 遍历所有活跃的水果方块
        for (const gridNode of this.activeGrids) {
            // 检查是否在下落中
            if (this.fallProgressMap.has(gridNode)) {
                // 计算当前下落距离
                const currentPosition = gridNode.position;
                const newY = currentPosition.y - (this.fallSpeed * deltaTime);
                           
                // 更新位置
                gridNode.setPosition(v3(currentPosition.x, newY, 0));
                
                // 检查是否到达底部（Y < 130）
                if (newY < 130) {
                    hasReachedBottom = true;
                }
            }
        }
        
        // 如果有水果到达底部，消除最下面一排并发送扣血事件
        if (hasReachedBottom) {
            this.eliminateFrontRows(1);
            EventManager.emit(EventName.Game.Damage, this.damagePerFruit);
        }
    }

    /**
     * 检查最靠近底部的水果Y坐标是否小于400
     * @returns 如果最靠近底部的水果Y坐标小于400返回true，否则返回false
     */
    public isLowestGridBelowThreshold(): boolean {
        if (this.activeGrids.length === 0) {
            return false;
        }
        
        const lowestGrid = this.activeGrids[0];
        const currentY = lowestGrid.position.y;
        
        return currentY < 400;
    }

    /**
     * 设置下落速度
     */
    public setFallSpeed(speed: number) {
        this.fallSpeed = speed;
    }

    /**
     * 获取当前活跃的水果方块数量
     */
    public getActiveGridCount(): number {
        return this.activeGrids.length;
    }

    /**
     * 回收水果方块到对象池
     */
    private recycleGrid(gridNode: Node) {
         AudioManager.getInstance().playSound('freesound_community_face');
        // 从活跃列表中移除
        const index = this.activeGrids.indexOf(gridNode);
        if (index > -1) {
            this.activeGrids.splice(index, 1);
        }

        // 从锁定集合中移除
        this.lockedGrids.delete(gridNode);

        // 检查并移除路径最后一个水果方块记录
        for (const [pathIndex, lastGrid] of this.pathLastGridMap.entries()) {
            if (lastGrid === gridNode) {
                this.pathLastGridMap.delete(pathIndex);
                console.log(`路径${pathIndex}的最后一个水果方块已被回收，移除记录`);
                break;
            }
        }

        // 先设置为不活跃，确保立即隐藏
        gridNode.active = false;

        // 从父节点移除
        if (gridNode.parent) {
            gridNode.removeFromParent();
        }

        // 重置位置
        gridNode.setPosition(v3(0, 0, 0));
        
        // 清空子节点或重置组件状态
        const gridComponent = gridNode.getComponent(gridDownCmpt);
        if (gridComponent) {
            // 重置水果方块组件状态
            gridComponent.reset();
        }
        
        // 移除下落进度信息
        this.fallProgressMap.delete(gridNode);
        
        // 添加到对象池
        this.gridPool.push(gridNode);
    }

    /**
     * 获取当前活跃方块中数量最多的类型
     */
    public getMostFrequentType(): number {
        if (this.activeGrids.length === 0) return -1;
        
        const typeCounts = new Map<number, number>();
        let maxCount = 0;
        let mostFrequentType = -1;

        for (const gridNode of this.activeGrids) {
            const gridCmpt = gridNode.getComponent(gridDownCmpt);
            if (gridCmpt) {
                const type = gridCmpt.type;
                const count = (typeCounts.get(type) || 0) + 1;
                typeCounts.set(type, count);
                
                if (count > maxCount) {
                    maxCount = count;
                    mostFrequentType = type;
                }
            }
        }
        
        return mostFrequentType;
    }

    /**
     * 清空所有水果方块
     */
    public clearAllGrids() {
        // 立即停止生成
        this.stopGenerate();
        
        // 立即从屏幕上移除所有活跃的水果方块并放回对象池
        for (const grid of this.activeGrids) {
            // 先设置为不活跃，确保立即隐藏
            grid.active = false;
            // 从父节点移除
            if (grid.parent) {
                grid.removeFromParent();
            }
            // 重置组件状态
            const gridComponent = grid.getComponent(gridDownCmpt);
            if (gridComponent) {
                gridComponent.reset();
            }
            // 重置位置
            grid.setPosition(v3(0, 0, 0));
            // 放回对象池
            this.gridPool.push(grid);
        }
        
        // 清空活跃数组
        this.activeGrids = [];
        
        // 已经在放回对象池时完成了节点状态重置，这里不需要重复操作
        
        // 清空下落进度信息
        this.fallProgressMap.clear();
        
        // 清空路径最后一个水果方块记录
        this.pathLastGridMap.clear();
        
        // 清空锁定的水果方块集合
        this.lockedGrids.clear();
        
        // 重置计数
        this.generatedCount = 0;
        
    }

    /**
     * 获取指定类型的最前面的水果方块节点
     * 最前面的定义：Y坐标最小（最靠近底部）的水果方块
     * @param type 水果方块类型
     * @returns 最前面的水果方块节点，未找到则返回null
     */
    public getFrontGridByType(type: number): Node | null {
        let frontGrid: Node | null = null;
        let minY: number = Number.MAX_VALUE;

        for (const gridNode of this.activeGrids) {
            // 跳过已锁定的水果方块
            if (this.lockedGrids.has(gridNode)) {
                continue;
            }

            const gridComponent = gridNode.getComponent(gridDownCmpt);
            if (!gridComponent) continue;

            if (gridComponent.type === type) {
                const currentY = gridNode.position.y;
                if (currentY < minY) {
                    minY = currentY;
                    frontGrid = gridNode;
                }
            }
        }

        // // 如果找到合适的水果方块，将其锁定
        // if (frontGrid) {
            
        //     this.lockedGrids.add(frontGrid);
        // }

        return frontGrid;
    }

    /**
     * 回收指定的水果方块
     * @param gridNode 要回收的水果方块节点
     */
    public recycleGridByNode(gridNode: Node) {
        if (gridNode && this.activeGrids.indexOf(gridNode) !== -1) {
            this.recycleGrid(gridNode);
        }
    }

    /**
     * 通过类型扣除虚拟血量
     * @param frontGrid: Node 水果方块类型
     * @param damage 扣除的虚拟血量值
     * @returns 是否有水果方块的虚拟血量被扣除到小于等于0
     */
    public damageVirtualHealthByType(frontGrid: Node, damage: number = 1): boolean {
            if (!isValid(frontGrid)) {
                return ;
             }
        const gridComponent = frontGrid.getComponent(gridDownCmpt);
        if (!gridComponent)
            return false;

        // 扣除虚拟血量
        gridComponent.virtualHealth -= damage;

        // 当虚拟血量小于等于0时，将其加入到被锁定列表
        if (gridComponent.virtualHealth <= 0) {
            this.lockedGrids.add(frontGrid);
        }
    }

    
    /**
     * 消除最前面的几排水果方块
     * 从性能优化角度设计：
     * 1. 避免多次遍历活跃列表
     * 2. 使用Set提高查找效率
     * 3. 批量处理路径映射更新
     * 4. 复用现有回收逻辑
     * 
     * @param rows 要消除的排数，默认为3排
     * @returns 被回收的水果方块的坐标位置数组
     */
    public eliminateFrontRows(rows: number = 3): GridPosition[] {
        if (this.activeGrids.length === 0 || rows <= 0) {
            return [];
        }

        // 1. 收集所有活跃水果方块的Y坐标和节点映射
        const gridYSorted: { y: number; node: Node }[] = [];
        const yToGridsMap: Map<number, Node[]> = new Map();
        
        for (const gridNode of this.activeGrids) {
            if (this.fallProgressMap.has(gridNode)) {
                const y = Math.floor(gridNode.position.y); // 向下取整，忽略小数部分提高性能
                gridYSorted.push({ y, node: gridNode });
                
                // 按Y坐标分组
                if (!yToGridsMap.has(y)) {
                    yToGridsMap.set(y, []);
                }
                yToGridsMap.get(y)!.push(gridNode);
            }
        }

        if (gridYSorted.length === 0) {
            return [];
        }

        // 2. 按Y坐标从低到高排序（最前面的水果方块Y值最小）
        gridYSorted.sort((a, b) => a.y - b.y);

        // 3. 计算每排的Y坐标范围，确定要消除的Y值
        const gridHeight = this.gridHeight;
        const firstRowY = gridYSorted[0].y;
        const eliminateThresholdY = firstRowY + (rows * gridHeight);

        // 4. 收集所有需要消除的水果方块
        const gridsToEliminate = new Set<Node>();
        for (const { y, node } of gridYSorted) {
            if (y < eliminateThresholdY) {
                gridsToEliminate.add(node);
            } else {
                break; // 因为已经排序，后面的Y值更大，不需要继续检查
            }
        }

        if (gridsToEliminate.size === 0) {
            return [];
        }

        // 5. 更新路径最后一个水果方块映射
        // 遍历所有路径，检查该路径的最后一个水果方块是否在要消除的列表中
        for (const [pathIndex, lastGrid] of this.pathLastGridMap.entries()) {
            if (gridsToEliminate.has(lastGrid)) {
                // 如果该路径的最后一个水果方块要被消除，需要找到新的最后一个水果方块
                let newLastGrid: Node | null = null;
                let maxY = -Infinity;
                
                // 获取当前路径的出生点位X坐标（用于判断同一路径）
                const birthPoint = this.BirthPoint.children[pathIndex];
                if (birthPoint) {
                    const pathX = birthPoint.worldPosition.x;
                    
                    // 在活跃列表中查找该路径上未被消除且Y值最大的水果方块
                    // 通过比较X坐标是否在同一位置来判断是否在同一路径
                    for (const gridNode of this.activeGrids) {
                        if (!gridsToEliminate.has(gridNode)) {
                            const gridComponent = gridNode.getComponent(gridDownCmpt);
                            if (gridComponent) {
                                // 比较X坐标，允许一定的误差范围
                                const gridX = gridNode.worldPosition.x;
                                const isSamePath = Math.abs(gridX - pathX) < 0.1;
                                
                                if (isSamePath) {
                                    const y = gridNode.position.y;
                                    if (y > maxY) {
                                        maxY = y;
                                        newLastGrid = gridNode;
                                    }
                                }
                            }
                        }
                    }
                }
                
                if (newLastGrid) {
                    this.pathLastGridMap.set(pathIndex, newLastGrid);
                } else {
                    this.pathLastGridMap.delete(pathIndex);
                }
            }
        }

        // 6. 批量回收水果方块并收集坐标和类型
        const eliminatedPositions: GridPosition[] = [];
        for (const gridNode of gridsToEliminate) {
            // 获取类型信息
            const gridComponent = gridNode.getComponent(gridDownCmpt);
            const type = gridComponent ? gridComponent.type : -1;
            
            // 收集坐标和类型
            const position = gridNode.position;
            eliminatedPositions.push({
                x: position.x,
                y: position.y,
                z: position.z,
                type: type
            });
            
            // 回收方块
            this.recycleGrid(gridNode);
        }

        return eliminatedPositions;
    }

}
