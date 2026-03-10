
import { _decorator } from 'cc';
import GameData from '../../Common/GameData';
import { getSkinConfig } from './SkinConfig';
import { HeroType } from '../../Tools/enumHero';
const { ccclass } = _decorator;

/**
 * 皮肤管理器
 */
@ccclass
export class SkinManager {
    private static _instance: SkinManager = null;
    private currentSkinId: number = HeroType.Default;
    private unlockedSkins: number[] = [];

    public static getInstance(): SkinManager {
        if (!this._instance) {
            this._instance = new SkinManager();
        }
        return this._instance;
    }

    constructor() {
        this.loadUnlockedSkins();
        this.currentSkinId = Number(GameData.loadData(GameData.CurrentSkin, HeroType.Default));
    }

    /**
     * 加载已解锁的皮肤
     */
    private loadUnlockedSkins() {
        const defaultSkins = [HeroType.Default];
        const data = GameData.loadData(GameData.UnlockedSkins, defaultSkins);
        
        if (Array.isArray(data)) {
            this.unlockedSkins = data;
        } else if (typeof data === 'string') {
            try {
                this.unlockedSkins = JSON.parse(data);
            } catch {
                this.unlockedSkins = defaultSkins;
            }
        } else {
            this.unlockedSkins = defaultSkins;
        }

        if (!Array.isArray(this.unlockedSkins) || this.unlockedSkins.length === 0) {
            this.unlockedSkins = defaultSkins;
        }

        if (this.unlockedSkins.indexOf(HeroType.Default) === -1) {
            this.unlockedSkins.push(HeroType.Default);
        }
    }

    /**
     * 保存已解锁的皮肤
     */
    private saveUnlockedSkins() {
        GameData.saveData(GameData.UnlockedSkins, this.unlockedSkins);
    }

    /**
     * 获取当前装备的皮肤ID
     */
    public getCurrentSkinId(): number {
        return this.currentSkinId;
    }

    /**
     * 设置当前装备的皮肤ID
     */
    public setCurrentSkinId(id: number): void {
        if (this.isSkinUnlocked(id)) {
            this.currentSkinId = id;
            GameData.saveData(GameData.CurrentSkin, id);
        } else {
            console.warn(`Skin ${id} is not unlocked!`);
        }
    }

    /**
     * 判断皮肤是否解锁
     */
    public isSkinUnlocked(id: number): boolean {
        return this.unlockedSkins.indexOf(id) !== -1;
    }

    /**
     * 解锁皮肤
     * @param id 皮肤ID
     * @returns 是否解锁成功 (如果金币不足或已解锁则返回 false)
     */
    public unlockSkin(id: number): boolean {
        if (this.isSkinUnlocked(id)) {
            console.log(`Skin ${id} already unlocked.`);
            return true;
        }

        const config = getSkinConfig(id);
        if (!config) {
            console.warn(`Skin config ${id} not found.`);
            return false;
        }

        const price = config.price;
        if (GameData.getGold() >= price) {
            if (GameData.spendGold(price)) {
                this.unlockedSkins.push(id);
                this.saveUnlockedSkins();
                console.log(`Skin ${id} unlocked!`);
                return true;
            }
        } else {
            console.log(`Not enough gold to unlock skin ${id}.`);
        }
        return false;
    }

    /**
     * 获取所有皮肤配置（包括解锁状态）
     */
    public getAllSkinsInfo() {
        const allIds = [
            HeroType.Default,
            HeroType.StrawHatFrog,
            HeroType.GoldenToad,
            HeroType.SkatingFrog,
            HeroType.NinjaFrog,
            HeroType.GundamFrog,
            HeroType.MeteorFrog,
        ];
        return allIds.map(id => {
            const config = getSkinConfig(id);
            return {
                ...config,
                isUnlocked: this.isSkinUnlocked(id),
                isEquipped: this.currentSkinId === id
            };
        });
    }
}
