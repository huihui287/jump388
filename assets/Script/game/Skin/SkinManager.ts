
import { _decorator } from 'cc';
const { ccclass } = _decorator;

/**
 * 皮肤管理器
 */
@ccclass
export class SkinManager {
    private static _instance: SkinManager = null;
    private currentSkinId: number = 1001; // 默认ID

    public static getInstance(): SkinManager {
        if (!this._instance) {
            this._instance = new SkinManager();
        }
        return this._instance;
    }

    /**
     * 获取当前装备的皮肤ID
     */
    public getCurrentSkinId(): number {
        // 这里可以从持久化数据中读取
        return this.currentSkinId; // 默认ID
    }

    /**
     * 设置当前装备的皮肤ID
     */
    public setCurrentSkinId(id: number): void {
        // 这里可以将ID保存到持久化数据中
        this.currentSkinId = id;
    }
}
