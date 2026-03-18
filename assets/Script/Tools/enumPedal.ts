/**
 * 单个踏板类型的默认参数
 * 说明：游戏运行时创建/复用踏板节点时，统一以这里的参数为准（不再依赖外部配置文件）。
 */
export interface PedalDefaultConfig {
    /** 跳跃力度 (决定跳跃高度) */
    jumpForce: number;
    /** 跳跃速度 (上升时间) */
    jumpSpeed: number;
    /** 重力加速度 */
    _gravity: number;
    /** Y 轴间隔最小值（下一个踏板与当前踏板的最小间隔） */
    minYInterval: number;
    /** Y 轴间隔最大值（下一个踏板与当前踏板的最大间隔） */
    maxYInterval: number;
    /** 默认技能（当前由逻辑随机决定，保留字段用于兜底/扩展） */
    skill: PedalSkill;
    /** 移动速度（仅移动类踏板生效） */
    moveSpeed: number;
    /** 移动时间（仅移动类踏板生效） */
    moveTime: number;
    /** 移动距离（仅移动类踏板生效） */
    moveDistance: number;
}


/**
 * 踏板类型枚举
 * 与预制体名称一致，用于加载资源与对象池索引
 */
export enum PedalType {
    PEDAL1 = 'pedal1',            // 最开始的白踏板：基础踏板PEDAL1
    WOOD = 'woodPedal',           // 木踏板：基础踏板
    FRACTURE_PEDAL = 'fracturePedal', // 断裂踏板：偏向特殊/易碎行为
    MOVE_PEDAL = 'movePedal',     // 移动踏板：偏向移动
    // 云踏板CLOUD
    CLOUD = 'cloudPedal',
}

/**
 * 踏板技能枚举
 * 控制 Hero 落到踏板时触发的特殊效果
 */
export enum PedalSkill {
    NONE = 'none',// 无效果
    SPRING = 'springPedal',// 弹簧跳跃高度
    //尖刺
    SPIKE = 'spikePedal',
    //金币堆
    GOLD = 'goldPedal',
    //护盾
    SHIELD = 'shieldPedal',
    //金币雨
    GOLD_RAIN = 'goldRainPedal',
    //陨石
    METEOR = 'meteorPedal',
    //火箭
    ROCKET = 'rocketPedal'  
}

/** 踏板技能层数限制 */
export const SkillFloorLimit: Record<PedalSkill, number> = {
    [PedalSkill.NONE]: 0,
    [PedalSkill.SPRING]: 20,
    [PedalSkill.SPIKE]: 20,
    [PedalSkill.GOLD]: 0,
    [PedalSkill.SHIELD]: 20,
    [PedalSkill.GOLD_RAIN]: 0,
    [PedalSkill.METEOR]: 30,
    [PedalSkill.ROCKET]: 50,
};

/** 技能权重配置 (可在代码中灵活修改) */
export const SkillWeights: Record<PedalSkill, number> = {
    [PedalSkill.NONE]: 9200,         // 无技能
    [PedalSkill.SPRING]: 100,       // 弹簧
    [PedalSkill.SPIKE]: 100,         // 尖刺
    [PedalSkill.GOLD]: 200,         // 金币
    [PedalSkill.SHIELD]: 100,      // 护盾 (调低点)
    [PedalSkill.GOLD_RAIN]: 5000,     // 金币雨
    [PedalSkill.METEOR]: 100,        // 陨石
    [PedalSkill.ROCKET]: 100,        // 火箭
};
/**
 * 导出：按枚举值组织的踏板默认参数映射
 * 供运行时在创建踏板节点后快速设置其物理属性
 */
export const PedalDefaults: Record<PedalType, PedalDefaultConfig> = {
        // 基础踏板PEDAL1
    [PedalType.PEDAL1]: {
        // 跳跃力度
        jumpForce: 400,
        /** 跳跃速度 */ 
        jumpSpeed: 0.3,
        /** 重力加速度 */
        _gravity: -5000,
        /** Y轴间隔最小值 下一个pedal与当前pedal的最小间隔*/
        minYInterval: 50,
        /** Y轴间隔最大值 下一个pedal与当前pedal的最大间隔*/
        maxYInterval: 80,
        /** 技能 */
        skill: PedalSkill.NONE,
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
        jumpForce: 400,
        /** 跳跃速度 */
        jumpSpeed: 0.3,
        /** 重力加速度 */
        _gravity: -5000,
        /** Y轴间隔最小值 下一个pedal与当前pedal的最小间隔*/
        minYInterval: 50,
        /** Y轴间隔最大值 下一个pedal与当前pedal的最大间隔*/
        maxYInterval: 100,
        /** 技能 */
        skill: PedalSkill.NONE,
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
        jumpForce: 500,
        /** 跳跃速度 */
        jumpSpeed: 0.3,
        /** 重力加速度 */
        _gravity: -5000,
        /** Y轴间隔最小值 下一个pedal与当前pedal的最小间隔*/
        minYInterval: 50,
        /** Y轴间隔最大值 下一个pedal与当前pedal的最大间隔*/
        maxYInterval: 80,
        /** 技能 */
        skill: PedalSkill.NONE,
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
        jumpForce: 500,
        /** 跳跃速度 */
        jumpSpeed: 0.3,
        /** 重力加速度 */
        _gravity: -5000,
        /** Y轴间隔最小值 下一个pedal与当前pedal的最小间隔*/
        minYInterval: 100,
        /** Y轴间隔最大值 下一个pedal与当前pedal的最大间隔*/
        maxYInterval: 300,
        /** 技能 */
        skill: PedalSkill.NONE,
        /** 移动速度 */
        moveSpeed: 200,
        /** 移动时间 */
        moveTime: 0.1,
        /** 移动距离 */         
        moveDistance: 600,
    },
  // 云踏板CLOUD
    [PedalType.CLOUD]: {
        /** 跳跃力度 */
        jumpForce: 500,
        /** 跳跃速度 */
        jumpSpeed: 0.3,
        /** 重力加速度 */
        _gravity: -5000,
        /** Y轴间隔最小值 下一个pedal与当前pedal的最小间隔*/
        minYInterval: 100,
        /** Y轴间隔最大值 下一个pedal与当前pedal的最大间隔*/
        maxYInterval: 300,
        /** 技能 */
        skill: PedalSkill.NONE,
        /** 移动速度 */
        moveSpeed: 100,
        /** 移动时间 */
        moveTime: 1,
        /** 移动距离 */         
        moveDistance: 200,
    },


};

/**
 * 低层数踏板默认参数（新手区间用）
 * 说明：
 * - 只在低层数区间生效，用于把“间隔更小/移动更慢”，让前期更稳。
 * - 具体在哪个层数区间启用，由生成逻辑决定（pedalManager）。
 */
export const PedalDefaultsLowLayer: Record<PedalType, PedalDefaultConfig> = {
    [PedalType.PEDAL1]: {
        jumpForce: 420,
        jumpSpeed: 0.3,
        _gravity: -5000,
        minYInterval: 40,
        maxYInterval: 65,
        skill: PedalSkill.NONE,
        moveSpeed: 0,
        moveTime: 0,
        moveDistance: 0,
    },
    [PedalType.WOOD]: {
        jumpForce: 420,
        jumpSpeed: 0.3,
        _gravity: -5000,
        minYInterval: 45,
        maxYInterval: 75,
        skill: PedalSkill.NONE,
        moveSpeed: 0,
        moveTime: 0,
        moveDistance: 0,
    },
    [PedalType.FRACTURE_PEDAL]: {
        jumpForce: 450,
        jumpSpeed: 0.3,
        _gravity: -5000,
        minYInterval: 45,
        maxYInterval: 70,
        skill: PedalSkill.NONE,
        moveSpeed: 0,
        moveTime: 0,
        moveDistance: 0,
    },
    [PedalType.MOVE_PEDAL]: {
        jumpForce: 450,
        jumpSpeed: 0.3,
        _gravity: -5000,
        minYInterval: 60,
        maxYInterval: 140,
        skill: PedalSkill.NONE,
        moveSpeed: 120,
        moveTime: 0.15,
        moveDistance: 320,
    },
    [PedalType.CLOUD]: {
        jumpForce: 450,
        jumpSpeed: 0.3,
        _gravity: -5000,
        minYInterval: 60,
        maxYInterval: 140,
        skill: PedalSkill.NONE,
        moveSpeed: 60,
        moveTime: 1,
        moveDistance: 120,
    },
};
