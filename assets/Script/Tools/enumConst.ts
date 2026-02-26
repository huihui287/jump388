//----------------------------------------大厅

/** 窗口打开类型 */
export enum WindowOpenType {
    /** 只能展示这个，立即打开 */
    eSingle = 1,
    /** 可以多个同时存在，一个关闭另一个再打开 */
    eMultiple,
}
/** 游戏运行环境 */
export enum PlatFormType {
    android = 1,
    ios,
    web,
}

/** 分享 */
export interface ShareInfo {
    /** 0:链接，1:图片 */
    type: number;
    /** 链接地址 */
    url: string;
    /** 图片地址 */
    imgPath: string;
}



/** 三元消除方向 */
export enum Direction {
    left,
    right,
    up,
    down
}

/** 全局常量 */
export let Constant = {
    /**  交换时间 */
    changeTime: 0.3,
    /** 格子行列数 */
    layCount: 9,
    Width: 76,
    Height: 76,
    NormalType: 13,
}


/**
 *  关卡配置
 */
export interface LevelCfgData {
    level?: number,
}

/** 领取金币类型 */
export enum GoldType {
    /** 分享 */
    share = 0,
    /** 等级 */
    level,
    /** 星级 */
    star,
}

/** 水果方块的类型 */
export enum GridType {
    /** 奇异果*/
    KIWIFRUIT   = 0,    
    /** 山竹 */
    MANGOSTEEN = 1,
    /** 西瓜 */
    WATERMELON = 2,
    /** 苹果 */
    APPLE = 3,
    /** 橘子 */
    ORANGE = 4,
    // /** 葡萄 */
    // GRAPE = 5,
}
/** Grid的数据 */
export interface GridData {
    /**  水果的类型 */
    type: GridType; // 使用枚举“GridType”作为类型声明
    // 攻击
    attack: number;
}
export interface mapData {
    m_id: number[],
    m_ct: number[],
    m_mk: number[],
}

export interface LevelData {
    mapCount: number,
    blockCount: number,
    RewardCount: number,
    scores: number[],
    blockRatio: number[],
    mapData: mapData[]
}

/** 炸弹编号 */
export enum Bomb {
    /** 竖向 */
    ver = 8,
    /** 横向 */
    hor = 9,
    /** 周围爆炸 */
    bomb = 10,
    /** 消灭所有同一类型 */
    allSame = 11,
    /** 变颜色 */
    changecolor = 12,
}

/** 页面跳转索引 */
export enum PageIndex {
    shop = 0,
    rank,
    home,
    share,
    setting,
}

/** 游戏状态枚举 */
export enum GameState {
    /** 游戏进行中 */
    PLAYING = 0,
    /** 游戏胜利 */
    WIN = 1,
    /** 游戏失败 */
    GAME_OVER = 2,
    /** 游戏暂停 */
    PAUSED = 3,
}