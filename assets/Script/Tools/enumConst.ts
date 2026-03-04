//----------------------------------------大厅相关常量
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

/** 全局常量 */
export let Constant = {
    /** 游戏宽度 */
    Width: 720,
    /** 游戏高度 */
    Height: 1334,
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
/**
 * 踏板类型枚举
 */
export enum PedalType {
    WOOD = 'woodPedal',
    CLOUD = 'cloudPedal'
}
// /** 踏板类型字符串标识 */
// type: string;
// /** 跳跃力度 */
// jumpForce: number;
// /** 跳跃速度 */
// jumpSpeed: number;
// /** 重力加速度 */
// _gravity: number;
/** Y轴间隔最小值 */
//  minYInterval: number ;
// /** Y轴间隔最大值 */
//  maxYInterval: number ;
/**
 * 导出：按枚举值组织的踏板默认参数映射
 * 供运行时在创建踏板节点后快速设置其物理属性
 */
export const PedalDefaults: Record<PedalType, { jumpForce: number; 
    jumpSpeed: number; _gravity: number; minYInterval: number; maxYInterval: number }> = {
    [PedalType.WOOD]: {
        jumpForce: 600,
        jumpSpeed: 1.45,
        _gravity: -2000,
        minYInterval: 150,
        maxYInterval: 250,

    },
    [PedalType.CLOUD]: {
        jumpForce: 1200,
        jumpSpeed: 5.45,
        _gravity: -2000,
        minYInterval: 200,
        maxYInterval: 300,
    },
};
