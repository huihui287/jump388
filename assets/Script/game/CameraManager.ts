import { _decorator, Component, Node, Vec3, v3 } from 'cc';
import { App } from '../Controller/app';
const { ccclass, property } = _decorator;

@ccclass('CameraManager')
export class CameraManager extends Component {
    /** 要跟随的目标节点 */
    @property(Node)
    public target: Node = null;
    
    /** 是否使用平滑跟随 */
    @property
    public useSmoothFollow: boolean = true;
    
    /** 跟随速度，值越大跟随越快 */
    @property
    public followSpeed: number = 10;
    
    /** 相机与目标的偏移量 */
    @property
    public offset: Vec3 = v3(0, 0, 0);
    
    /** 是否只跟随Y值 */
    @property
    public onlyFollowY: boolean = true;
    
    /** 临时向量，用于计算 */
    private _tempVec: Vec3 = v3();
    private _tempVec2: Vec3 = v3();
    
    protected onLoad(): void {
        
    }
        
    start() {
        // 初始化时，如果有目标，直接设置相机位置
        if (this.target) {
            if (this.onlyFollowY) {
                // 只设置Y坐标，保持X和Z不变
                this._tempVec.set(this.node.position.x, this.target.position.y + this.offset.y, this.node.position.z);
            } else {
                // 设置完整位置
                this._tempVec.set(this.target.position).add(this.offset);
            }
            this.node.setPosition(this._tempVec);
        }
    }

    protected lateUpdate(deltaTime: number) {
        if (App.gameCtr.isPause) return;
        // 如果有目标，实现跟随逻辑
        if (this.target) {
            // 计算目标位置的Y值（包含偏移）
            const targetY = this.target.position.y + this.offset.y;
            
            // 记录当前相机位置
            const currentY = this.node.position.y;
            
            // 如果目标Y大于当前相机Y（向上跳），或者目标掉出了屏幕下方（向下掉）
            // 我们通过一个简单的平滑跟随来处理这两种情况
            
            if (this.onlyFollowY) {
                // 只跟随Y值，保持X和Z不变
                this._tempVec.set(this.node.position.x, targetY, this.node.position.z);
            } else {
                // 跟随完整位置
                this._tempVec.set(this.target.position).add(this.offset);
            }

            // 只有在需要更新位置时才进行计算
            // 向上跟随是必须的，向下跟随则是在“掉出屏幕”时需要
            // 阈值设为 500 (屏幕半高约 667)，当 Hero 掉到屏幕底部区域时，相机开始向下平滑跟随
            const fallThreshold = 700;
            
            if (targetY > currentY) {
                // 向上跟随：目标是 Hero 的位置
                if (this.onlyFollowY) {
                    this._tempVec.set(this.node.position.x, targetY, this.node.position.z);
                } else {
                    this._tempVec.set(this.target.position).add(this.offset);
                }
                
                // 执行平滑跟随
                this.doSmoothFollow(deltaTime);
            } 
            else if (targetY < currentY - fallThreshold) {
                 // 向下跟随：保持 Hero 在屏幕底部 (即相机位置 = Hero位置 + 阈值)
                 // 这样可以避免相机直接跳变到 Hero 位置，而是平滑地保持距离
                 const desiredCamY = targetY + fallThreshold;
                 
                 if (this.onlyFollowY) {
                    this._tempVec.set(this.node.position.x, desiredCamY, this.node.position.z);
                 } else {
                    // 对于 X/Z，保持原样或跟随? 这里假设只处理 Y
                    this._tempVec.set(this.target.position).add(this.offset);
                    this._tempVec.y = desiredCamY;
                 }
                 
                 // 执行平滑跟随
                 this.doSmoothFollow(deltaTime);
            }
        }
    }

    private doSmoothFollow(deltaTime: number) {
        if (this.useSmoothFollow) {
            // 使用平滑插值实现相机跟随
            // 修正 lerp 的使用方式：使用预分配的 _tempVec2 避免每帧创建对象
            const lerpRatio = Math.min(deltaTime * this.followSpeed, 1.0);
            Vec3.lerp(this._tempVec2, this.node.position, this._tempVec, lerpRatio);
            this.node.setPosition(this._tempVec2);
        } else {
            // 直接设置相机位置
            this.node.setPosition(this._tempVec);
        }
    }
    
    /**
     * 设置跟随目标
     * @param target 要跟随的目标节点
     */
    public setTarget(target: Node): void {
        this.target = target;
        // 设置目标后，立即更新相机位置
        if (this.target) {
            if (this.onlyFollowY) {
                // 只设置Y坐标，保持X和Z不变
                this._tempVec.set(this.node.position.x, this.target.position.y + this.offset.y, this.node.position.z);
            } else {
                // 设置完整位置
                this._tempVec.set(this.target.position).add(this.offset);
            }
            this.node.setPosition(this._tempVec);
        }
    }
    
    /**
     * 设置相机偏移量
     * @param offset 相机与目标的偏移量
     */
    public setOffset(offset: Vec3): void {
        this.offset = offset;
        // 设置偏移量后，立即更新相机位置
        if (this.target) {
            if (this.onlyFollowY) {
                // 只设置Y坐标，保持X和Z不变
                this._tempVec.set(this.node.position.x, this.target.position.y + this.offset.y, this.node.position.z);
            } else {
                // 设置完整位置
                this._tempVec.set(this.target.position).add(this.offset);
            }
            this.node.setPosition(this._tempVec);
        }
    }
    
    /**
     * 设置跟随速度
     * @param speed 跟随速度
     */
    public setFollowSpeed(speed: number): void {
        this.followSpeed = speed;
    }
    
    /**
     * 设置是否使用平滑跟随
     * @param useSmooth 是否使用平滑跟随
     */
    public setUseSmoothFollow(useSmooth: boolean): void {
        this.useSmoothFollow = useSmooth;
    }
    
    /**
     * 设置是否只跟随Y值
     * @param onlyY 是否只跟随Y值
     */
    public setOnlyFollowY(onlyY: boolean): void {
        this.onlyFollowY = onlyY;
        // 设置后立即更新相机位置
        if (this.target) {
            if (this.onlyFollowY) {
                // 只设置Y坐标，保持X和Z不变
                this._tempVec.set(this.node.position.x, this.target.position.y + this.offset.y, this.node.position.z);
            } else {
                // 设置完整位置
                this._tempVec.set(this.target.position).add(this.offset);
            }
            this.node.setPosition(this._tempVec);
        }
    }
}


