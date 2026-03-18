import { PedalSkill, PedalType } from "./enumPedal";

export interface PedalRunRule {
    /**
     * 需要执行“连续段”的踏板类型
     */
    pedalType: PedalType;
    /**
     * 连续段生效的起始层数（包含）
     * 说明：层数口径与 pedalManager.NewlayerS 保持一致（非初始 PEDAL1 的层数，从 1 开始）。
     */
    fromLayer: number;
    /**
     * 连续段生效的结束层数（包含）
     */
    toLayer: number;
    /**
     * 连续段最短长度（闭区间随机）
     * 例：minRun=2,maxRun=4 表示一次连续生成 2~4 个同类型踏板。
     */
    minRun: number;
    /**
     * 连续段最长长度（闭区间随机）
     */
    maxRun: number;
}

export interface LevelConfigData {
    /**
     * 本关总层数（用于控制踏板生成上限）
     * 说明：如果同时配置了 pedalTypeCounts，则 AlllayerNum 仅作为兜底，
     * 实际总层数由 pedalTypeCounts 各类型数量求和决定（见 pedalManager.loadPedalConfig）。
     */
    AlllayerNum: number;
    /**
     * 通关奖励金币
     */
    goldReward: number;
    /**
     * 金币踏板（PedalSkill.GOLD）触发时的奖励金币数
     */
    pedalGold: number;
    /**
     * 背景索引（可选）
     * 说明：不填时会默认使用 (level - 1)，以保证旧关卡无需补字段也能工作。
     */
    bgIndex?: number;
    /**
     * 本关踏板类型生成次数配额（可选）
     * - key：PedalType
     * - value：该类型在本关最多生成的次数
     *
     * 说明：
     * - 配置后会在 pedalManager 中做“扣减”，次数为 0 的类型不会再被生成
     * - 本关总层数会用此对象中所有类型数量求和来计算
     */
    pedalTypeCounts?: Partial<Record<PedalType, number>>;
    /**
     * 本关连续段规则（可选）
     * 说明：用于在指定层数区间内，让某种踏板以“连续段”形式出现，提升关卡节奏与辨识度。
     */
    pedalRunRules?: PedalRunRule[];
    /**
     * 本关允许出现的“道具/技能”列表（图片中的“道具”对应项目里的 PedalSkill）
     * 说明：
     * - 只影响“生成哪种技能”的随机逻辑，不影响技能效果本身（效果由各 Skill 脚本实现）
     * - 未配置时：默认不做限制（等同于允许所有技能按全局权重与门槛出现）
     */
    enabledPedalSkills?: PedalSkill[];
}


// /**
//  * 踏板类型枚举
//  * 与预制体名称一致，用于加载资源与对象池索引
//  */
// export enum PedalType {
//     PEDAL1 = 'pedal1',            // 最开始的白踏板：基础踏板PEDAL1
//     WOOD = 'woodPedal',           // 木踏板：基础踏板
//     FRACTURE_PEDAL = 'fracturePedal', // 断裂踏板：偏向特殊/易碎行为
//     MOVE_PEDAL = 'movePedal',     // 移动踏板：偏向移动
//     // 云踏板CLOUD
//     CLOUD = 'cloudPedal',
// }


// /**
//  * 踏板技能枚举
//  * 控制 Hero 落到踏板时触发的特殊效果
//  */
// export enum PedalSkill {
//     NONE = 'none',// 无效果
//     SPRING = 'springPedal',// 弹簧跳跃高度
//     //尖刺
//     SPIKE = 'spikePedal',
//     //金币堆
//     GOLD = 'goldPedal',
//     //护盾
//     SHIELD = 'shieldPedal',
//     //金币雨
//     GOLD_RAIN = 'goldRainPedal',
//     //陨石
//     METEOR = 'meteorPedal',
//     //火箭
//     ROCKET = 'rocketPedal'  
// }


/**
 * 游戏关卡配置表（按关卡编号索引）
 *
 * 使用方式：
 * - 通过 LevelConfig.getConfig(level) 获取某一关的配置（包含默认 bgIndex 兜底）
 * - pedalManager.loadPedalConfig 会读取其中的：
 *   - goldReward / pedalGold
 *   - pedalTypeCounts（决定每种踏板生成配额、以及本关总层数）
 *   - pedalRunRules（连续段规则）
 *   - enabledPedalSkills（本关允许参与随机的技能候选集）
 *
 * 配置约定：
 * - key 为关卡号（1、2、3...）
 * - enabledPedalSkills 可以包含 PedalSkill.NONE（代表“无技能”）
 * - 若某关未配置，将使用 LevelConfig.getConfig 的默认值兜底
 */
export const LevelConfigs: { [key: number]: LevelConfigData } = {
    1: {
        AlllayerNum: 300,
        goldReward: 50,
        pedalGold: 10,
        pedalTypeCounts: {
            [PedalType.PEDAL1]: 1,
            [PedalType.WOOD]: 205,
            [PedalType.FRACTURE_PEDAL]: 25,
            [PedalType.MOVE_PEDAL]: 60,
            [PedalType.CLOUD]: 9,
        },
        pedalRunRules: [
            { pedalType: PedalType.MOVE_PEDAL, fromLayer: 2, toLayer: 120, minRun: 2, maxRun: 4 },
            { pedalType: PedalType.FRACTURE_PEDAL, fromLayer: 20, toLayer: 180, minRun: 1, maxRun: 2 },
            { pedalType: PedalType.CLOUD, fromLayer: 60, toLayer: 260, minRun: 1, maxRun: 2 },
        ],
        enabledPedalSkills: [
            PedalSkill.NONE,
            PedalSkill.GOLD,
            PedalSkill.SPRING,
            PedalSkill.GOLD_RAIN,
            PedalSkill.SHIELD,
            PedalSkill.METEOR,
            PedalSkill.ROCKET,
        ],
    },
    2: {
        AlllayerNum: 300,
        goldReward: 500,
        pedalGold: 20,
        pedalTypeCounts: {
            [PedalType.PEDAL1]: 1,
            [PedalType.WOOD]: 220,
            [PedalType.FRACTURE_PEDAL]: 35,
            [PedalType.MOVE_PEDAL]: 30,
            [PedalType.CLOUD]: 14,
        },
        pedalRunRules: [
            { pedalType: PedalType.MOVE_PEDAL, fromLayer: 2, toLayer: 120, minRun: 2, maxRun: 4 },
            { pedalType: PedalType.FRACTURE_PEDAL, fromLayer: 20, toLayer: 180, minRun: 1, maxRun: 2 },
            { pedalType: PedalType.CLOUD, fromLayer: 60, toLayer: 260, minRun: 1, maxRun: 2 },
        ],
        enabledPedalSkills: [
            PedalSkill.NONE,
            PedalSkill.GOLD,
            PedalSkill.SPRING,
            PedalSkill.GOLD_RAIN,
        ],
    },
    3: {
        AlllayerNum: 300,
        goldReward: 1000,
        pedalGold: 30,
        pedalTypeCounts: {
            [PedalType.PEDAL1]: 1,
            [PedalType.WOOD]: 200,
            [PedalType.FRACTURE_PEDAL]: 40,
            [PedalType.MOVE_PEDAL]: 40,
            [PedalType.CLOUD]: 19,
        },
        pedalRunRules: [
            { pedalType: PedalType.MOVE_PEDAL, fromLayer: 2, toLayer: 120, minRun: 2, maxRun: 4 },
            { pedalType: PedalType.FRACTURE_PEDAL, fromLayer: 20, toLayer: 180, minRun: 1, maxRun: 2 },
            { pedalType: PedalType.CLOUD, fromLayer: 60, toLayer: 260, minRun: 1, maxRun: 2 },
        ],
        enabledPedalSkills: [
            PedalSkill.NONE,
            PedalSkill.GOLD,
            PedalSkill.SPRING,
            PedalSkill.GOLD_RAIN,
            PedalSkill.SHIELD,
        ],
    },
    4: {
        AlllayerNum: 200,
        goldReward: 2000,
        pedalGold: 40,
        pedalTypeCounts: {
            [PedalType.PEDAL1]: 1,
            [PedalType.WOOD]: 120,
            [PedalType.FRACTURE_PEDAL]: 30,
            [PedalType.MOVE_PEDAL]: 30,
            [PedalType.CLOUD]: 19,
        },
        pedalRunRules: [
            { pedalType: PedalType.MOVE_PEDAL, fromLayer: 2, toLayer: 120, minRun: 2, maxRun: 4 },
            { pedalType: PedalType.FRACTURE_PEDAL, fromLayer: 20, toLayer: 180, minRun: 1, maxRun: 2 },
            { pedalType: PedalType.CLOUD, fromLayer: 60, toLayer: 260, minRun: 1, maxRun: 2 },
        ],
        enabledPedalSkills: [
            PedalSkill.NONE,
            PedalSkill.GOLD,
            PedalSkill.SPRING,
            PedalSkill.GOLD_RAIN,
            PedalSkill.SHIELD,
            PedalSkill.METEOR,
        ],
    },
    5: {
        AlllayerNum: 300,
        goldReward: 5000,
        pedalGold: 50,
        pedalTypeCounts: {
            [PedalType.PEDAL1]: 1,
            [PedalType.WOOD]: 170,
            [PedalType.FRACTURE_PEDAL]: 45,
            [PedalType.MOVE_PEDAL]: 50,
            [PedalType.CLOUD]: 34,
        },
        pedalRunRules: [
            { pedalType: PedalType.MOVE_PEDAL, fromLayer: 2, toLayer: 120, minRun: 2, maxRun: 4 },
            { pedalType: PedalType.FRACTURE_PEDAL, fromLayer: 20, toLayer: 180, minRun: 1, maxRun: 2 },
            { pedalType: PedalType.CLOUD, fromLayer: 60, toLayer: 260, minRun: 1, maxRun: 2 },
        ],
        enabledPedalSkills: [
            PedalSkill.NONE,
            PedalSkill.GOLD,
            PedalSkill.SPRING,
            PedalSkill.GOLD_RAIN,
            PedalSkill.SHIELD,
            PedalSkill.METEOR,
            PedalSkill.ROCKET,
        ],
    }
};

/**
 * 游戏关卡配置工具类
 * - 负责读取 LevelConfigs 并补齐默认字段
 * - 兜底策略：未配置的关卡会使用默认配置，避免运行时崩溃
 */
export class LevelConfig {
    /**
     * 获取指定关卡配置
     * @param level 关卡号（从 1 开始）
     */
    public static getConfig(level: number): LevelConfigData {
        if (LevelConfigs[level]) {
            const c = LevelConfigs[level];
            return {
                ...c,
                bgIndex: c.bgIndex ?? (level - 1),
            };
        }
        console.warn(`Level ${level} config not found, using default.`);
        return {
            AlllayerNum: 100,
            goldReward: 100,
            pedalGold: 10,
            bgIndex: level - 1,
            pedalTypeCounts: {
                [PedalType.PEDAL1]: 1,
                [PedalType.WOOD]: 99,
            },
            pedalRunRules: [],
            enabledPedalSkills: [
                PedalSkill.NONE,
                PedalSkill.GOLD,
            ],
        };
    }
}
