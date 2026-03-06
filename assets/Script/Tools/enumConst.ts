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

//----------------------------------------数据结构接口

/** 分享信息 */
export interface ShareInfo {
    /** 0:链接，1:图片 */
    type: number;
    /** 链接地址 */
    url: string;
    /** 图片地址 */
    imgPath: string;
}

/** 踏板物理配置接口 */
export interface PedalConfig {
    /** 跳跃力度 (决定跳跃高度) */
    jumpForce: number; 
    /** 跳跃速度 (上升时间) */
    jumpSpeed: number; 
    /** 重力加速度 */
    _gravity: number; 
    /** Y轴间隔最小值 (下一个pedal与当前pedal的最小间隔) */
    minYInterval: number; 
    /** Y轴间隔最大值 (下一个pedal与当前pedal的最大间隔) */
    maxYInterval: number; 
    /** 默认携带技能 */
    skill: PedalSkill[];
    /** 移动速度 */
    moveSpeed: number; 
    /** 移动时间 */
    moveTime: number; 
    /** 移动距离 */
    moveDistance: number;
}

//----------------------------------------全局常量

/** 全局常量 */
export const Constant = {
    /** 游戏宽度 */
    Width: 720,
    /** 游戏高度 */
    Height: 1334,
};

/**
 * 踏板类型枚举
 * 与预制体名称一致，用于加载资源与对象池索引
 */
export enum PedalType {
    PEDAL1 = 'pedal1',            // 最开始的白踏板：基础踏板PEDAL1
    WOOD = 'woodPedal',           // 木踏板：基础踏板
    CLOUD = 'cloudPedal',         // 云踏板：偏向强化跳跃
    FRACTURE_PEDAL = 'fracturePedal', // 断裂踏板：偏向特殊/易碎行为
    MOVE_PEDAL = 'movePedal',     // 移动踏板：偏向移动
}

/**
 * 踏板技能枚举
 * 控制 Hero 落到踏板时触发的特殊效果
 */
export enum PedalSkill {
    NONE = 'none',                 // 无效果
    SPRING = 'spring',               // 弹簧跳跃高度
    LOW_GRAVITY = 'low_gravity',   // 降低重力，下落更慢
    FRACTURE = 'fracture',                // 断裂效果（预留，待接入具体逻辑）
    //尖刺
    SPIKE = 'spike',
    //金币堆
    GOLD = 'goldPedal',
}

/** 技能权重配置 (可在代码中灵活修改) */
export const SkillWeights: Record<PedalSkill, number> = {
    [PedalSkill.NONE]: 2000,         // 无技能
    [PedalSkill.SPRING]: 1000,       // 弹簧
    [PedalSkill.LOW_GRAVITY]: 10,  // 低重力
    [PedalSkill.SPIKE]: 1,         // 尖刺
    [PedalSkill.GOLD]: 20,         // 金币
    [PedalSkill.FRACTURE]: 0,      // 断裂通常不通过随机生成，而是由踏板类型决定
};

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
export const PedalDefaults: Record<PedalType, { 
    /** 跳跃力度 */
    jumpForce: number; 
    /** 跳跃速度 */
    jumpSpeed: number; 
    /** 重力加速度 */
    _gravity: number; 
    /** Y轴间隔最小值 下一个pedal与当前pedal的最小间隔*/
    minYInterval: number; 
    /** Y轴间隔最大值 下一个pedal与当前pedal的最大间隔*/
    maxYInterval: number; 
    skill: PedalSkill[];
     moveSpeed: number; moveTime: number; moveDistance: number; }> = {
        // 基础踏板PEDAL1
    [PedalType.PEDAL1]: {
        // 跳跃力度
        jumpForce: 500,
        /** 跳跃速度 */ 
        jumpSpeed: 0.3,
        /** 重力加速度 */
        _gravity: -2000,
        /** Y轴间隔最小值 下一个pedal与当前pedal的最小间隔*/
        minYInterval: 100,
        /** Y轴间隔最大值 下一个pedal与当前pedal的最大间隔*/
        maxYInterval: 200,
        /** 技能 */
        skill: [PedalSkill.NONE],
        /** 移动速度 */
        moveSpeed: 0,
        /** 移动时间 */
        moveTime: 0,
        /** 移动距离 */
        moveDistance: 0,    
    },
    // 木踏板WOOD
    [PedalType.WOOD]: {
        /** 跳跃力度 */
        jumpForce: 600,
        /** 跳跃速度 */
        jumpSpeed: 1.45,
        /** 重力加速度 */
        _gravity: -2000,
        /** Y轴间隔最小值 下一个pedal与当前pedal的最小间隔*/
        minYInterval: 150,
        /** Y轴间隔最大值 下一个pedal与当前pedal的最大间隔*/
        maxYInterval: 250,
        /** 技能 */
        skill: [PedalSkill.NONE],
        /** 移动速度 */
        moveSpeed: 0,
        /** 移动时间 */
        moveTime: 0,
        /** 移动距离 */             
        moveDistance: 0,
    },
    // 云踏板CLOUD
    [PedalType.CLOUD]: {
        /** 跳跃力度 */
        jumpForce: 600,
        /** 跳跃速度 */
        jumpSpeed: 1.45,
        /** 重力加速度 */
        _gravity: -2000,
        /** Y轴间隔最小值 下一个pedal与当前pedal的最小间隔*/
        minYInterval: 500,
        /** Y轴间隔最大值 下一个pedal与当前pedal的最大间隔*/
        maxYInterval: 600,
        /** 技能 */
        skill: [PedalSkill.NONE],
        /** 移动速度 */
        moveSpeed: 0,
        /** 移动时间 */
        moveTime: 0,
        /** 移动距离 */             
        moveDistance: 0,
    },
    // 断裂踏板FRACTURE_PEDAL
    [PedalType.FRACTURE_PEDAL]: {
        /** 跳跃力度 */
        jumpForce: 600,
        /** 跳跃速度 */
        jumpSpeed: 1.45,
        /** 重力加速度 */
        _gravity: -2000,
        /** Y轴间隔最小值 下一个pedal与当前pedal的最小间隔*/
        minYInterval: 250,
        /** Y轴间隔最大值 下一个pedal与当前pedal的最大间隔*/
        maxYInterval: 350,
        /** 技能 */
        skill: [PedalSkill.FRACTURE],
        /** 移动速度 */
        moveSpeed: 0,
        /** 移动时间 */
        moveTime: 0,
        /** 移动距离 */         
        moveDistance: 0,
    },
    // 移动踏板MOVE_PEDAL
    [PedalType.MOVE_PEDAL]: {
        /** 跳跃力度 */
        jumpForce: 600,
        /** 跳跃速度 */
        jumpSpeed: 1.45,
        /** 重力加速度 */
        _gravity: -2000,
        /** Y轴间隔最小值 下一个pedal与当前pedal的最小间隔*/
        minYInterval: 250,
        /** Y轴间隔最大值 下一个pedal与当前pedal的最大间隔*/
        maxYInterval: 350,
        /** 技能 */
        skill: [PedalSkill.NONE],
        /** 移动速度 */
        moveSpeed: 100,
        /** 移动时间 */
        moveTime: 1,
        /** 移动距离 */         
        moveDistance: 200,
    },
};
