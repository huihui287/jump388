
/**
 * 皮肤配置接口
 */
export interface SkinConfig {
    id: number;
    name: string;
    spineSkinName: string;  // Spine 皮肤名称
    price: number;
}

/**
 * 获取皮肤配置
 * @param id 皮肤ID
 */
export function getSkinConfig(id: number): SkinConfig | null {
    // 示例配置
    if (id === 1001) {
        return {
            id: 1001,
            name: "Default Hero",
            spineSkinName: "famugong", // 请根据实际Spine资源中的皮肤名称修改
            price: 0
        };
    }
    // 添加更多皮肤...
    if (id === 1002) {
        return {
            id: 1002,
            name: "Default Hero",
            spineSkinName: "jianzhugong", // 请根据实际Spine资源中的皮肤名称修改
            price: 0
        };
    }
    return null;
}
