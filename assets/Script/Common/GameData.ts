import { _decorator, Component, Node, sys } from 'cc';
import { DEV } from 'cc/env';
import { Bomb } from '../Tools/enumConst';
import { App } from '../Controller/app';
const { ccclass, property } = _decorator;

@ccclass
export default class GameData {

    /** 炸弹 */
    public static BombHor = "BombHor";
    public static BombVer = "BomVerr";
    public static BombBomb = "BombBomb";
    public static BombAllSame = "BombAllSame";
    public static BombChangecolor = "BombChangecolor";
    public static Level = 'Level';
    public static IsNewPlayer = 'IsNewPlayer';
    public static Gold = 'Gold';
    public static TurretLevel = 'TurretLevel';
    public static MusicOn = 'MusicOn';
    public static SoundOn = 'SoundOn';
        /** 当前最新关卡 */
    public static MaxLevel = 'MaxLevel';

    /** 侧边栏奖励最后领取日期 */
    public static SidebarRewardDate = 'SidebarRewardDate';

    /**
     * 获取最大解锁关卡
     * @returns 最大解锁关卡
     */
    static getMaxLevel(): number {
        return Number(GameData.loadData(GameData.MaxLevel, 1));
    }

    /**
     * 更新最大解锁关卡（只升不降）
     * @param level 新关卡
     */
    static updateMaxLevel(level: number): void {
        const currentMax = this.getMaxLevel();
        if (level > currentMax) {
            GameData.saveData(GameData.MaxLevel, level);
            DEV && console.log(`MaxLevel updated: ${currentMax} -> ${level}`);
        }
    }
    /**
     * 保存游戏数据
     * @param key 数据键名
     * @param value 数据值（支持单个值和JSON对象/数组）
     */
    static saveData(key: string, value: any): void {
        try {
        let dataStr: string;
        // 如果是对象或数组，使用JSON序列化
        if (typeof value === 'object' && value !== null) {
            dataStr = JSON.stringify(value);
        } else {
            // 单个值直接保存
            dataStr = String(value);
        }
        sys.localStorage.setItem(key, dataStr);
    } catch (error) {
       DEV &&console.error('保存数据失败:', error);
    }
}

/**
 * 加载游戏数据
 * @param key 数据键名
 * @param defaultValue 默认值
 * @returns 加载的数据
 */
static loadData(key: string, defaultValue: any): any {
        try {
            const dataStr = sys.localStorage.getItem(key);
            if (dataStr === null || dataStr === "") {
                return defaultValue;
            }
        
        // 尝试解析为JSON对象/数组
        try {
            return JSON.parse(dataStr);
        } catch (e) {
            // 如果解析失败，返回原始字符串值并尝试转换为数字
            const num = Number(dataStr);
            return isNaN(num) ? dataStr : num;
        }
    } catch (error) {
       DEV && console.error('加载数据失败:', error);
        return defaultValue;
    }
    
}

   static getBomb(type: Bomb) {
        switch (type) {
            case Bomb.hor:
                return +GameData.loadData(GameData.BombHor,0);
            case Bomb.ver:
                return +GameData.loadData(GameData.BombVer,0);
            case Bomb.bomb:
                return +GameData.loadData(GameData.BombBomb,0);
            case Bomb.allSame:
                return +GameData.loadData(GameData.BombAllSame,0);
            case Bomb.changecolor:
                return +GameData.loadData(GameData.BombChangecolor,0);
        }
    }

   static setBomb(type: Bomb, count: number) {
        let baseNum = this.getBomb(type);
        let ct = baseNum + count >= 0 ? baseNum + count : 0;
        switch (type) {
            case Bomb.hor:
                GameData.saveData(GameData.BombHor, ct + "");
                break;
            case Bomb.ver:
                GameData.saveData(GameData.BombVer, ct + "");   
                break;
            case Bomb.bomb:
                GameData.saveData(GameData.BombBomb, ct + "");
                break;
            case Bomb.allSame:
                GameData.saveData(GameData.BombAllSame, ct + "");
                break;
            case Bomb.changecolor:
                GameData.saveData(GameData.BombChangecolor, ct + "");
                break;
        }
    }
    
    /**
 * 检查是否为新玩家
 * @returns 如果是新玩家则返回true，否则返回false
 */
    static isNewPlayer() {
        return GameData.loadData(GameData.IsNewPlayer, 0);
    }
    /**
 * 设置是否为新玩家
 * @param isNew 是否为新玩家
 */
        static setNewPlayer(isNew: Number) {
        GameData.saveData(GameData.IsNewPlayer, isNew);
    }
    /**
 * 消耗金币
 * @param cost 消耗的金币数量
 */
    static spendGold(cost: number) {
        let gold = GameData.loadData(GameData.Gold, 0);
        if (gold < cost) {
            return false;
        }
        GameData.saveData(GameData.Gold, gold - cost);
        return true;
    }
    /**
 * 获取当前金币数量
 * @returns 当前金币数量
 */
    static getGold() {
        return GameData.loadData(GameData.Gold, 0);
    }
    /**
 * 设置当前金币数量
 * @param gold 新的金币数量
 */
    static setGold(gold: number) {
        GameData.saveData(GameData.Gold, gold);
    }

    static addGold(goldReward: number) {
        let currentGold = Number(GameData.loadData(GameData.Gold, 0));
        currentGold += goldReward;
        GameData.saveData(GameData.Gold, currentGold);
    }

    /**
     * 检查今日是否已领取侧边栏奖励
     */
    static isSidebarRewardClaimedToday(): boolean {
        const lastDate = GameData.loadData(GameData.SidebarRewardDate, '');
        const today = new Date().toDateString();
        return lastDate === today;
    }

    /**
     * 标记今日侧边栏奖励已领取
     */
    static setSidebarRewardClaimed(): void {
        const today = new Date().toDateString();
        GameData.saveData(GameData.SidebarRewardDate, today);
    }

    /** 下一关，并本地缓存已通过关卡 */
  static  nextLevel() {
        let lv = +this.getCurLevel();
        const nextLv = lv + 1;
        GameData.saveData(GameData.Level, nextLv);
        GameData.updateMaxLevel(nextLv);
        App.gameCtr.curLevel = nextLv;
        return App.gameCtr.curLevel;
    }

   static getCurLevel() {
        return GameData.loadData(GameData.Level, 1);
    }

 static   setCurLevel(lv: number) {
        App.gameCtr.curLevel = lv;
        GameData.saveData(GameData.Level, lv);
        GameData.updateMaxLevel(lv);
    }

}
