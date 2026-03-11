
export enum HeroType {
    //小青蛙默认
    Default = 1000,
    //草帽蛙
    StrawHatFrog = 1001,
    //金蟾
    GoldenToad = 1002,
    //溜冰蛙
    SkatingFrog = 1003,
    //忍者蛙
    NinjaFrog = 1004,
    //高达蛙
    GundamFrog = 1005,
    //流星蛙
    MeteorFrog = 1006,
}

/**
 * 英雄技能类型
 */
export enum HeroSkillType {
    NONE = 0,
    
    // --- 被动技能 ---
    /** 结算金币加成 (百分比) */
    PASSIVE_GOLD_BONUS = 1,
    /** 额外金币获取 (固定数值) */
    PASSIVE_EXTRA_GOLD = 2,
    /** 跳跃速度加成 (百分比) 它就是溜冰蛙的技能*/
    PASSIVE_JUMP_SPEED = 3,
    /** 清除陷阱/免疫陷阱 */
    PASSIVE_DESTROY_TRAP = 4,
    
    // --- 主动技能 ---
    /** 喷气背包 (空中跳跃) */
    ACTIVE_JETPACK = 101,
    /** 流星冲刺 (向上冲刺N层) */
    ACTIVE_METEOR = 102,
}
