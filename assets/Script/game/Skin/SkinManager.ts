
import { _decorator } from 'cc';
const { ccclass } = _decorator;

/**
 * 皮肤管理器
 */
@ccclass
export class SkinManager {
    private static _instance: SkinManager = null;
    
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
        return 1001; // 默认ID
    }
}
