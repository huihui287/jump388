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
 * 与预制体名称一致，用于加载资源与对象池索引
 */
export enum PedalType {
    PEDAL1 = 'pedal1',            // 最开始的白踏板：基础踏板PEDAL1
    WOOD = 'woodPedal',            // 木踏板：基础踏板
    CLOUD = 'cloudPedal',          // 云踏板：偏向强化跳跃
    FRACTURE_PEDAL = 'fracturePedal', // 断裂踏板：偏向特殊/易碎行为
    MOVE_PEDAL = 'movePedal' // 移动踏板：偏向移动
}
/**
 * 踏板技能枚举
 * 控制 Hero 落到踏板时触发的特殊效果
 */
export enum PedalSkill {
    NONE = 'none',                 // 无效果
    BOOST = 'boost',               // 增强跳跃高度
    LOW_GRAVITY = 'low_gravity',   // 降低重力，下落更慢
    BREAK = 'break'                // 破碎效果（预留，待接入具体逻辑）
}
// /** 踏板类型字符串标识 */
// type: string;
// /** 跳跃力度 */决定跳跃高度
// jumpForce: number;
// /** 跳跃速度 */
// jumpSpeed: number;
// /** 重力加速度 */
// _gravity: number;
/** Y轴间隔最小值 下一个pedal与当前pedal的最小间隔*/
//  minYInterval: number ;
// /** Y轴间隔最大值 下一个pedal与当前pedal的最大间隔*/
//  maxYInterval: number ;
/**
 * 导出：按枚举值组织的踏板默认参数映射
 * 供运行时在创建踏板节点后快速设置其物理属性
 */
export const PedalDefaults: Record<PedalType, { jumpForce: number; 
    jumpSpeed: number; _gravity: number; minYInterval: number; maxYInterval: number; skill: PedalSkill;
     moveSpeed: number; moveTime: number; moveDistance: number; }> = {
    [PedalType.PEDAL1]: {
        jumpForce: 200,
        jumpSpeed: 5,
        _gravity: -2000,
        minYInterval: 100,
        maxYInterval: 200,
        skill: PedalSkill.NONE,
        moveSpeed: 0,
        moveTime: 0,
        moveDistance: 0,    
    },
    [PedalType.WOOD]: {
        jumpForce: 600,
        jumpSpeed: 1.45,
        _gravity: -2000,
        minYInterval: 150,
        maxYInterval: 250,
        skill: PedalSkill.NONE,
        moveSpeed: 0,
        moveTime: 0,
        moveDistance: 0,
    },
    [PedalType.CLOUD]: {
        jumpForce: 500,
        jumpSpeed: 1.45,
        _gravity: -2000,
        minYInterval: 500,
        maxYInterval: 600,
        skill: PedalSkill.NONE,
        moveSpeed: 0,
        moveTime: 0,
        moveDistance: 0,
    },
    [PedalType.FRACTURE_PEDAL]: {
        jumpForce: 500,
        jumpSpeed: 1.45,
        _gravity: -2000,
        minYInterval: 250,
        maxYInterval: 350,
        skill: PedalSkill.BREAK,
        moveSpeed: 0,
        moveTime: 0,
        moveDistance: 0,
    },
    [PedalType.MOVE_PEDAL]: {
        jumpForce: 500,
        jumpSpeed: 1.45,
        _gravity: -2000,
        minYInterval: 250,
        maxYInterval: 350,
        skill: PedalSkill.NONE,
        moveSpeed: 100,
        moveTime: 1,
        moveDistance: 200,
    },
};
