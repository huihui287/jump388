import { _decorator, Component, Node, tween, Tween, Vec3 } from 'cc';
import { Pedal } from './Pedal';
import { Constant, PedalDefaults } from '../../Tools/enumConst';
const { ccclass, property } = _decorator;

@ccclass('movePedal')
export class movePedal extends Pedal {

    /** 移动速度 */
    public moveSpeed: number = 0;
    /** 移动时间 */
    public moveTime: number = 0;
    /** 移动距离 */
    public moveDistance: number = 0;

    /** 移动方向 (1: 向右, -1: 向左) */
    private _moveDirection: number = 1;
    /** 移动范围左边界 */
    private _leftLimit: number = 0;
    /** 移动范围右边界 */
    private _rightLimit: number = 0;
    /** 是否正在移动 */
    private _isMoving: boolean = false;

    update(deltaTime: number) {
        if (!this._isMoving) return;

        // 计算新位置
        let newX = this.node.position.x + this.moveSpeed * this._moveDirection * deltaTime;

        // 边界检测与反转
        if (newX >= this._rightLimit) {
            newX = this._rightLimit;
            this._moveDirection = -1;
        } else if (newX <= this._leftLimit) {
            newX = this._leftLimit;
            this._moveDirection = 1;
        }

        // 仅更新 X 轴，保留 Y 轴 (兼容外部修改 Y)
        this.node.setPosition(newX, this.node.position.y, this.node.position.z);
    }
    /**
     * 初始化踏板
     */
    init(position: Vec3, jumpForce: number = 600, jumpSpeed: number = 1.45, _gravity: number = -2000) {
        super.init(position, jumpForce, jumpSpeed, _gravity);
        
        this._isMoving = false;
        const defaults = PedalDefaults[this.getType()];
        if (defaults) {
            this.startMove(defaults.moveSpeed, defaults.moveTime, defaults.moveDistance);
        }
    }

    /**
     * 开启左右移动
     * @param speed 移动速度 (像素/秒)
     * @param time 单程移动时间 (秒，仅当 speed 为 0 时使用)
     * @param distance 单程移动距离 (像素)
     */
    startMove(speed: number, time: number, distance: number) {
        if (distance <= 0) {
            this._isMoving = false;
            return;
        }

        // 优先使用速度，如果没有速度则用时间倒推速度
        if (speed > 0) {
            this.moveSpeed = speed;
        } else if (time > 0) {
            this.moveSpeed = distance / time;
        } else {
            this.moveSpeed = 100; // 默认速度
        }

        this.moveDistance = distance;

        const startX = this.node.position.x;
        const screenHalfWidth = Constant.Width / 2;
        const pedalHalfWidth = this.getPedalWidth() / 2;
        
        // 计算物理边界
        const minX = -screenHalfWidth + pedalHalfWidth;
        const maxX = screenHalfWidth - pedalHalfWidth;

        // 计算逻辑边界
        const leftLimit = Math.max(startX - distance, minX);
        const rightLimit = Math.min(startX + distance, maxX);

        if (leftLimit >= rightLimit) {
            this._isMoving = false;
            return; 
        }

        this._leftLimit = leftLimit;
        this._rightLimit = rightLimit;
        
        // 随机初始方向
        this._moveDirection = Math.random() > 0.5 ? 1 : -1;
        this._isMoving = true;
    }

}


