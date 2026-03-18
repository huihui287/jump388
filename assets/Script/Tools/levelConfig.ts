import { PedalType } from "./enumPedal";

export interface PedalRunRule {
    pedalType: PedalType;
    fromLayer: number;
    toLayer: number;
    minRun: number;
    maxRun: number;
}

export interface LevelConfigData {
    AlllayerNum: number;
    goldReward: number;
    pedalGold: number;
    bgIndex?: number;
    pedalTypeCounts?: Partial<Record<PedalType, number>>;
    pedalRunRules?: PedalRunRule[];
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

// 游戏关卡配置
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
    }
};

// 游戏关卡配置工具类
export class LevelConfig {
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
        };
    }
}
