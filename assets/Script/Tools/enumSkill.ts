import { PedalSkill } from "./enumPedal";

/** 技能具体参数配置 */
export const SkillConfigs: Record<PedalSkill, { jumpForceMul?: number; jumpSpeedMul?: number }> = {
    [PedalSkill.NONE]: {},
    [PedalSkill.SPRING]: {
        jumpForceMul: 1.8,
        jumpSpeedMul: 1.8,
    },
    [PedalSkill.SPIKE]: {},
    [PedalSkill.GOLD]: {},
    [PedalSkill.SHIELD]: {},
    [PedalSkill.GOLD_RAIN]: {},
    [PedalSkill.METEOR]: {},
    [PedalSkill.ROCKET]: {},
};