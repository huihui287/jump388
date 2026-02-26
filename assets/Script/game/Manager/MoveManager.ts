import { _decorator, Node, tween, Vec3, easing } from 'cc';

/**
 * 移动管理器：使用贝塞尔曲线实现节点间平滑移动，每次移动路径随机生成
 * 单例模式实现，确保全局只有一个实例
 */
export class MoveManager {
    /** 静态实例 */
    private static instance: MoveManager;
    
    // 移动参数配置
    public moveDuration: number = 1.0;
    public maxControlOffset: number = 100;

    /**
     * 私有构造函数，防止外部实例化
     */
    private constructor() {
    }

    /**
     * 获取单例实例
     * @returns MoveManager 单例实例
     */
    public static getInstance(): MoveManager {
        if (!MoveManager.instance) {
            MoveManager.instance = new MoveManager();
        }
        return MoveManager.instance;
    }

    /**
     * 使用贝塞尔曲线将节点从当前位置移动到目标节点位置
     * @param nodeA 要移动的节点
     * @param nodeB 目标节点
     * @param duration 可选，移动持续时间，默认使用组件属性
     * @param onComplete 可选，移动完成后的回调函数
     * @returns Promise<void> 移动完成后的回调
     */
    public moveToTargetWithBezier(nodeA: Node, nodeB: Node, duration: number = this.moveDuration, onComplete?: () => void): Promise<void> {
        return new Promise<void>((resolve) => {
            if (!nodeA || !nodeB) {
                console.error("moveToTargetWithBezier: nodeA or nodeB is null");
                resolve();
                return;
            }
            
            // 确保duration有效
            if (duration <= 0) {
                console.error("moveToTargetWithBezier: duration must be greater than 0");
                // 如果duration无效，直接移动到目标位置（使用世界坐标）
                nodeA.worldPosition = nodeB.worldPosition;
                // 触发回调
                if (onComplete) {
                    onComplete();
                }
                resolve();
                return;
            }

            // 获取起始位置和目标位置（使用世界坐标）
            const startPos = nodeA.worldPosition;
            const endPos = nodeB.worldPosition;

            // 生成随机贝塞尔曲线控制点
            const controlPoints = this.generateRandomControlPoints(startPos, endPos);
            const p0 = startPos;
            const p1 = controlPoints[0];
            const p2 = controlPoints[1];
            const p3 = endPos;

            // 创建一个临时对象用于驱动动画
            const tempObj = { progress: 0 };

            // 创建贝塞尔曲线移动动画
            tween(tempObj)
                .to(duration, { progress: 1 }, {
                    easing: easing.expoIn, // 使用指数缓动函数，实现导弹式的持续加速效果
                    onUpdate: (target, ratio) => {
                        // 三次贝塞尔曲线公式：P(t) = (1-t)^3*P0 + 3*(1-t)^2*t*P1 + 3*(1-t)*t^2*P2 + t^3*P3
                        const t = ratio;
                        const t2 = t * t;
                        const t3 = t2 * t;
                        const mt = 1 - t;
                        const mt2 = mt * mt;
                        const mt3 = mt2 * mt;

                        // 计算当前位置
                        const x = mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x;
                        const y = mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y;
                        const z = mt3 * p0.z + 3 * mt2 * t * p1.z + 3 * mt * t2 * p2.z + t3 * p3.z;

                        // 更新节点位置（使用世界坐标）
                        nodeA.worldPosition = new Vec3(x, y, z);
                    }
                })
                .call(() => {
                    // 移动完成，视为击中目标
                    console.log("Bullet hit target node");
                    // 触发回调
                    if (onComplete) {
                        onComplete();
                    }
                    resolve();
                })
                .start();
        });
    }

    /**
     * 生成随机贝塞尔曲线控制点
     * 使用三次贝塞尔曲线（2个控制点），每次生成不同的控制点以创建不同的路径
     */
    private generateRandomControlPoints(startPos: Vec3, endPos: Vec3): Vec3[] {
        // 计算起点到终点的方向向量
        const direction = new Vec3();
        Vec3.subtract(direction, endPos, startPos);
        const distance = direction.length();
        
        // 如果距离为0，直接返回起点和终点
        if (distance === 0) {
            return [startPos.clone(), endPos.clone()];
        }
        
        // 基于距离动态调整偏移量，确保路径比例协调
        const dynamicOffset = Math.min(this.maxControlOffset, distance * 0.3);
        
        // 生成单位长度的垂直向量
        const unitPerpendicular = new Vec3(-direction.y, direction.x, 0);
        if (unitPerpendicular.length() > 0) {
            unitPerpendicular.normalize();
        }
        
        // 生成垂直于方向的随机向量（2D平面）
        const perpendicular1 = new Vec3();
        const perpendicular2 = new Vec3();
        const tempDir1 = new Vec3();
        const tempDir2 = new Vec3();
        
        // 计算第一个控制点的垂直偏移
        perpendicular1.set(
            unitPerpendicular.x * dynamicOffset * (Math.random() - 0.5) * 2,
            unitPerpendicular.y * dynamicOffset * (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * dynamicOffset * 2
        );
        
        // 计算第二个控制点的垂直偏移
        perpendicular2.set(
            unitPerpendicular.x * dynamicOffset * (Math.random() - 0.5) * 2,
            unitPerpendicular.y * dynamicOffset * (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * dynamicOffset * 2
        );
        
        // 控制点位置：在路径1/3和2/3处，添加垂直方向的随机偏移
        const control1 = new Vec3();
        const control2 = new Vec3();
        
        // 计算1/3位置
        Vec3.multiplyScalar(tempDir1, direction, 1/3);
        Vec3.add(control1, startPos, tempDir1);
        Vec3.add(control1, control1, perpendicular1);
        
        // 计算2/3位置
        Vec3.multiplyScalar(tempDir2, direction, 2/3);
        Vec3.add(control2, startPos, tempDir2);
        Vec3.add(control2, control2, perpendicular2);
        
        return [control1, control2];
    }

    /**
     * 执行物品飞舞动画
     * 使节点从起始位置飞舞到目标位置
     * @param item 要飞舞的节点
     * @param startPos 起始位置（世界坐标）
     * @param targetPos 目标位置（世界坐标）
     * @param duration 可选，动画持续时间，默认0.5-1.5秒随机
     * @param onComplete 可选，动画完成后的回调函数
     */
    public flyItem(item: Node, startPos: Vec3, targetPos: Vec3, duration?: number, onComplete?: () => void): void {
        // 设置起始位置和初始缩放
        item.setPosition(startPos);
        item.setScale(0.5, 0.5, 0.5);
        
        // 计算动画持续时间
        const animationTime = duration || (0.5 + Math.random() * 1);
        
        // 执行飞舞动画
        tween(item)
            .to(animationTime, { position: targetPos }, { easing: 'backIn' })
            .call(() => {
                // 触发回调
                if (onComplete) {
                    onComplete();
                }
            })
            .start();
    }

    /**
     * 执行物品飞舞动画（基于节点）
     * 使节点从起始节点位置飞舞到目标节点位置
     * @param item 要飞舞的节点
     * @param startNode 起始节点
     * @param targetNode 目标节点
     * @param duration 可选，动画持续时间，默认0.5-1.5秒随机
     * @param onComplete 可选，动画完成后的回调函数
     */
    public flyItemToNode(item: Node, startNode: Node, targetNode: Node, duration?: number, onComplete?: () => void): void {
        const startPos = startNode.worldPosition;
        const targetPos = targetNode.worldPosition;
        this.flyItem(item, startPos, targetPos, duration, onComplete);
    }

}
