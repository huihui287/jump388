import { Node } from 'cc';
import EventManager from '../../Common/view/EventManager';
import { EventName } from '../../Tools/eventName';
import { PedalSkill, SkillFloorLimit, SkillWeights } from '../../Tools/enumPedal';
import { SkillConfigs } from '../../Tools/enumSkill';

export interface PedalSkillTriggerTarget {
    node: Node;
    jumpForce: number;
    jumpSpeed: number;
}

export interface PedalSkillRandomParams {
    /** 当前生成层数（使用 pedalManager.NewlayerS，保持与旧逻辑一致） */
    currentLayer: number;
    /** 上一次生成的技能（用于去重，NONE 允许连续） */
    lastSkill: PedalSkill;
    /** 金币蛙等被动对金币踏板出现率的倍率（仅影响 GOLD 的权重） */
    goldWeightMultiplier?: number;
    /** SHIELD 之后的尖刺冷却：>0 时本次不允许生成 SPIKE */
    blockSpikeForPedals?: number;
    /** 是否允许在本次随机中生成 SPIKE（用于“必须有护盾才允许出尖刺”等更高层规则） */
    allowSpike?: boolean;
}

/**
 * PedalSkill 的统一入口：
 * - 生成：按权重随机 + 层数门槛过滤 + 与上一次技能去重（NONE 例外）
 * - 触发：踩到踏板时执行技能效果（尽量保持旧行为与日志不变）
 *
 * 说明：这里刻意不“自动清空技能”，由 Pedal.releaseSkill 在触发后统一 setSkill(NONE)，
 * 以保持原先“一次性触发”的时序与数据流不变。
 */
export class PedalSkillRegistry {
    /** 初始化对象池时需要加载的技能预制体列表（与旧逻辑一致：排除 NONE） */
    static getSkillTypesForPools(): PedalSkill[] {
        return Object.keys(SkillWeights)
            .filter((s) => s !== PedalSkill.NONE) as PedalSkill[];
    }

    /**
     * 从 SkillWeights 中按权重随机选一个技能，并应用层数门槛与去重规则。
     * 算法细节保持与旧版 pedalManager.RandomSkill 一致（包括 randomVal 边界兜底）。
     */
    static selectRandomSkill(params: PedalSkillRandomParams): PedalSkill {
        const candidates: { skill: PedalSkill; weight: number }[] = [];
        let totalWeight = 0;

        for (const key in SkillWeights) {
            const skill = key as PedalSkill;
            let weight = SkillWeights[skill];

            if (skill === PedalSkill.SPIKE) {
                if ((params.blockSpikeForPedals ?? 0) > 0) continue;
                if (params.allowSpike === false) continue;
            }

            if (skill === PedalSkill.GOLD) {
                const mul = params.goldWeightMultiplier ?? 1;
                weight = Math.floor(weight * mul);
            }

            if (weight <= 0) continue;

            const floorLimit = SkillFloorLimit[skill] || 0;
            if (params.currentLayer < floorLimit) continue;

            if (skill !== PedalSkill.NONE && skill === params.lastSkill) continue;

            candidates.push({ skill, weight });
            totalWeight += weight;
        }

        if (candidates.length === 0 || totalWeight <= 0) {
            return PedalSkill.NONE;
        }

        const randomVal = Math.random() * totalWeight;
        let accumulatedWeight = 0;
        let selectedSkill = PedalSkill.NONE;

        for (const candidate of candidates) {
            accumulatedWeight += candidate.weight;
            if (randomVal < accumulatedWeight) {
                selectedSkill = candidate.skill;
                break;
            }
        }

        if (randomVal >= totalWeight) {
            selectedSkill = candidates[candidates.length - 1].skill;
        }

        return selectedSkill;
    }

    /** 执行技能效果（主要通过事件派发给 Game/Hero），并保留旧版 console.log 文案 */
    static trigger(skill: PedalSkill, target: PedalSkillTriggerTarget): void {
        const resolved = skill ?? PedalSkill.NONE;
        if (resolved === PedalSkill.NONE) return;

        switch (resolved) {
            case PedalSkill.SPRING:
                console.log('Triggered SPRING skill');
                this.applySpringEffect(target);
                break;
            case PedalSkill.GOLD:
                console.log('Triggered GOLD skill');
                EventManager.emit(EventName.Game.GetGold, target.node);
                break;
            case PedalSkill.SPIKE:
                console.log('Triggered SPIKE skill');
                EventManager.emit(EventName.Game.HitSpike);
                break;
            case PedalSkill.SHIELD:
                console.log('Triggered SHIELD skill');
                EventManager.emit(EventName.Game.GetShield);
                break;
            case PedalSkill.GOLD_RAIN:
                console.log('Triggered GOLD_RAIN skill');
                EventManager.emit(EventName.Game.GetGoldRain, target.node);
                break;
            case PedalSkill.METEOR:
                console.log('Triggered METEOR skill');
                break;
            case PedalSkill.ROCKET:
                console.log('Triggered ROCKET skill');
                EventManager.emit(EventName.Game.GetRocket, 10);
                break;
            default:
                break;
        }
    }

    private static applySpringEffect(target: PedalSkillTriggerTarget): void {
        const config = SkillConfigs[PedalSkill.SPRING];
        const forceMul = config?.jumpForceMul ?? 3.5;
        const speedMul = config?.jumpSpeedMul ?? 1.8;

        target.jumpForce *= forceMul;
        target.jumpSpeed *= speedMul;
    }
}
