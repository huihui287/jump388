/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
/**踏板cvs 配置文件 */
export interface PedalConfigData {
    /** 踏板类型 */
    pedalSype: string;
    /** Y轴间隔最小值 (下一个pedal与当前pedal的最小间隔) */
    minYInterval?: number;
    /** Y轴间隔最大值 (下一个pedal与当前pedal的最大间隔) */
    maxYInterval?: number;
    /** 移动速度 */
    moveSpeed?: number;
    /** 移动时间 */
    moveTime?: number;
    /** 移动距离 */
    moveDistance?: number;
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
    NONE = 'none',                 // 无效果
    SPRING = 'spring',               // 弹簧跳跃高度
    LOW_GRAVITY = 'low_gravity',   // 降低重力，下落更慢
    FRACTURE = 'fracture',                // 断裂效果（预留，待接入具体逻辑）
    //尖刺
    SPIKE = 'spikePedal',
    //金币堆
    GOLD = 'goldPedal',
    //护盾
    SHIELD = 'shieldPedal',
    //金币雨
    GOLD_RAIN = 'goldRain',
    //移动飞蛇
    FLYING_SNAKE = 'flyingSnake',
    //陨石
    METEOR = 'meteor',
    //火箭
    ROCKET = 'rocket'
}

/** 踏板技能层数限制 */
export const SkillFloorLimit: Record<PedalSkill, number> = {
    [PedalSkill.NONE]: 0,
    [PedalSkill.SPRING]: 20,
    [PedalSkill.LOW_GRAVITY]: 0,
    [PedalSkill.FRACTURE]: 0,
    [PedalSkill.SPIKE]: 0,
    [PedalSkill.GOLD]: 0,
    [PedalSkill.SHIELD]: 20,
    [PedalSkill.GOLD_RAIN]: 0,
    [PedalSkill.FLYING_SNAKE]: 0,
    [PedalSkill.METEOR]: 30,
    [PedalSkill.ROCKET]: 50,
};

/** 技能权重配置 (可在代码中灵活修改) */
export const SkillWeights: Record<PedalSkill, number> = {
    [PedalSkill.NONE]: 5000,         // 无技能
    [PedalSkill.SPRING]: 400,       // 弹簧
    [PedalSkill.LOW_GRAVITY]: 10,  // 低重力
    [PedalSkill.SPIKE]: 400,         // 尖刺
    [PedalSkill.GOLD]: 400,         // 金币
    [PedalSkill.FRACTURE]: 0,      // 断裂通常不通过随机生成，而是由踏板类型决定
    [PedalSkill.SHIELD]: 400,      // 护盾 (调低点)
    [PedalSkill.GOLD_RAIN]: 400,     // 金币雨
    [PedalSkill.FLYING_SNAKE]: 400,  // 移动飞蛇
    [PedalSkill.METEOR]: 400,        // 陨石
    [PedalSkill.ROCKET]: 400,        // 火箭
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
        _gravity: -5000,
        /** Y轴间隔最小值 下一个pedal与当前pedal的最小间隔*/
        minYInterval: 50,
        /** Y轴间隔最大值 下一个pedal与当前pedal的最大间隔*/
        maxYInterval: 80,
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
        jumpForce: 200,
        /** 跳跃速度 */
        jumpSpeed: 0.3,
        /** 重力加速度 */
        _gravity: -5000,
        /** Y轴间隔最小值 下一个pedal与当前pedal的最小间隔*/
        minYInterval: 50,
        /** Y轴间隔最大值 下一个pedal与当前pedal的最大间隔*/
        maxYInterval: 100,
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
        jumpForce: 200,
        /** 跳跃速度 */
        jumpSpeed: 0.3,
        /** 重力加速度 */
        _gravity: -5000,
        /** Y轴间隔最小值 下一个pedal与当前pedal的最小间隔*/
        minYInterval: 50,
        /** Y轴间隔最大值 下一个pedal与当前pedal的最大间隔*/
        maxYInterval: 80,
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
        jumpSpeed: 0.3,
        /** 重力加速度 */
        _gravity: -5000,
        /** Y轴间隔最小值 下一个pedal与当前pedal的最小间隔*/
        minYInterval: 100,
        /** Y轴间隔最大值 下一个pedal与当前pedal的最大间隔*/
        maxYInterval: 300,
        /** 技能 */
        skill: [PedalSkill.NONE],
        /** 移动速度 */
        moveSpeed: 100,
        /** 移动时间 */
        moveTime: 1,
        /** 移动距离 */         
        moveDistance: 200,
    },
  // 云踏板CLOUD
    [PedalType.CLOUD]: {
        /** 跳跃力度 */
        jumpForce: 600,
        /** 跳跃速度 */
        jumpSpeed: 0.3,
        /** 重力加速度 */
        _gravity: -5000,
        /** Y轴间隔最小值 下一个pedal与当前pedal的最小间隔*/
        minYInterval: 100,
        /** Y轴间隔最大值 下一个pedal与当前pedal的最大间隔*/
        maxYInterval: 300,
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
