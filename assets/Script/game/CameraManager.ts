import { _decorator, Component, Node, Vec3, v3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CameraManager')
export class CameraManager extends Component {
    /** 要跟随的目标节点 */
    @property(Node)
    public target: Node = null;
    
    /** 是否使用平滑跟随 */
    @property
    public useSmoothFollow: boolean = false;
    
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

    update(deltaTime: number) {
        // 如果有目标，实现跟随逻辑
        if (this.target) {
            if (this.onlyFollowY) {
                // 只跟随Y值，保持X和Z不变
                this._tempVec.set(this.node.position.x, this.target.position.y + this.offset.y, this.node.position.z);
            } else {
                // 跟随完整位置
                this._tempVec.set(this.target.position).add(this.offset);
            }
            
            if (this.useSmoothFollow) {
                // 使用平滑插值实现相机跟随
                this.node.position.lerp(this._tempVec, deltaTime * this.followSpeed);
            } else {
                // 直接设置相机位置，完全跟随目标
                this.node.setPosition(this._tempVec);
            }
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


