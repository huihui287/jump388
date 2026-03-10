import { HeroSkillType, HeroType } from "../../Tools/enumHero";




/**
 * 技能信息
 */
export interface SkillInfo {
    type: HeroSkillType;
    description: string;
    value?: number; // 技能数值 (如金币加成百分比)
    cooldown?: number; // 冷却时间 (秒)
}

/**
 * 皮肤配置接口
 */
export interface SkinConfig {
    id: number;
    name: string;
    spineSkinName: string;  // Spine 皮肤名称
    price: number;
    //描述：皮肤描述
    description: string;
    
    // 主动技能
    activeSkill?: SkillInfo;
    // 被动技能
    passiveSkill?: SkillInfo;
}

/**
 * 获取皮肤配置
 * @param id 皮肤ID
 */
export function getSkinConfig(id: number): SkinConfig | null {
    switch (id) {
        case HeroType.Default:
            return {
                id: HeroType.Default,
                name: "小青蛙",
                spineSkinName: "famugong",
                price: 0,
                description: "无技能",
                activeSkill: { type: HeroSkillType.NONE, description: "无" },
            };

        case HeroType.StrawHatFrog:
            return {
                id: HeroType.StrawHatFrog,
                name: "草帽蛙",
                spineSkinName: "jianzhugong", 
                price: 1000, 
                description: "无主动技能，结算金币+5%",
                activeSkill: { type: HeroSkillType.NONE, description: "无" },
                passiveSkill: { 
                    type: HeroSkillType.PASSIVE_GOLD_BONUS, 
                    description: "结算金币+5%", 
                    value: 0.05 
                }
            };
        
        case HeroType.GoldenToad:
            return {
                id: HeroType.GoldenToad,
                name: "金蟾",
                spineSkinName: "xingchunzhe", 
                price: 3000,
                description: "来财：金币出现概率+50%，额外获得10金币",
                activeSkill: { type: HeroSkillType.NONE, description: "无" },
                passiveSkill: { 
                    type: HeroSkillType.PASSIVE_EXTRA_GOLD, 
                    description: "额外获得10金币", 
                    value: 10 
                }
            };

        case HeroType.SkatingFrog:
            return {
                id: HeroType.SkatingFrog,
                name: "溜冰蛙",
                spineSkinName: "yiliaobin", 
                price: 8000,
                description: "我可以滑着走：移动速度增加30%",
                activeSkill: { type: HeroSkillType.NONE, description: "无" },
                passiveSkill: { 
                    type: HeroSkillType.PASSIVE_MOVE_SPEED, 
                    description: "移动速度+30%", 
                    value: 0.3 
                }
            };

        case HeroType.NinjaFrog:
            return {
                id: HeroType.NinjaFrog,
                name: "忍者蛙",
                spineSkinName: "ninja", 
                price: 10000,
                description: "居合斩：跳跃期间挥刀清除陷阱",
                activeSkill: { type: HeroSkillType.NONE, description: "无" },
                passiveSkill: { 
                    type: HeroSkillType.PASSIVE_DESTROY_TRAP, 
                    description: "接触陷阱时清除之" 
                }
            };

        case HeroType.GundamFrog:
            return {
                id: HeroType.GundamFrog,
                name: "高达蛙",
                spineSkinName: "mecha", 
                price: 50000,
                description: "喷气背包：空中跳跃，5秒充能",
                activeSkill: { 
                    type: HeroSkillType.ACTIVE_JETPACK, 
                    description: "空中跳跃", 
                    cooldown: 5 
                }
            };

        case HeroType.MeteorFrog:
            return {
                id: HeroType.MeteorFrog,
                name: "流星蛙",
                spineSkinName: "meteor", 
                price: 100000,
                description: "流星化：向上冲刺10层，30次踩踏充能",
                activeSkill: { 
                    type: HeroSkillType.ACTIVE_METEOR, 
                    description: "向上冲刺10层", 
                    value: 10 // 冲刺层数
                    // cooldown 由踩踏次数控制，不使用时间冷却
                }
            };

        default:
            return null;
    }
}
