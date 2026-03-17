
export interface LevelConfigData {
    AlllayerNum: number;
    goldReward: number;
    pedalGold: number;
    bgIndex?: number;
}

export const LevelConfigs: { [key: number]: LevelConfigData } = {
    1: {
        AlllayerNum: 300,
        goldReward: 50,
        pedalGold: 10,
    },
    2: {
        AlllayerNum: 300,
        goldReward: 500,
        pedalGold: 20,
    },
    3: {
        AlllayerNum: 300,
        goldReward: 1000,
        pedalGold: 30,
    },
    4: {
        AlllayerNum: 200,
        goldReward: 2000,
        pedalGold: 40,
    },
    5: {
        AlllayerNum: 300,
        goldReward: 5000,
        pedalGold: 50,
    }
};

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
        };
    }
}
