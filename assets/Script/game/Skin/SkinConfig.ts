
/**
 * 皮肤配置接口
 */
export interface SkinConfig {
    id: number;
    name: string;
    spinePath: string;      // Spine 资源路径
    spineSkinName: string;  // Spine 皮肤名称
    price: number;
}

/**
 * 获取皮肤配置
 * @param id 皮肤ID
 */
export function getSkinConfig(id: number): SkinConfig | null {
    // 这里可以返回默认配置或从配置表中查找
    // 示例默认配置
    if (id === 1001) {
        return {
            id: 1001,
            name: "Default Hero",
            spinePath: "spine/hero/hero_default",
            spineSkinName: "default",
            price: 0
        };
    }
    return null;
}
