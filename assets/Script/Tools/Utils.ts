/**
 * 工具类
 * 提供各种通用工具方法
 */
export class Utils {
    /**
     * 比较版本号
     * @param version1 版本号1
     * @param version2 版本号2
     * @returns 1: version1 > version2, 0: version1 = version2, -1: version1 < version2
     */
    public static compareVersion(version1: string, version2: string): number {
        const arr1 = version1.split('.');
        const arr2 = version2.split('.');
        const length1 = arr1.length;
        const length2 = arr2.length;
        const minlength = Math.min(length1, length2);
        let i = 0;
        for (; i < minlength; i++) {
            const a = parseInt(arr1[i]);
            const b = parseInt(arr2[i]);
            if (a > b) {
                return 1;
            } else if (a < b) {
                return -1;
            }
        }
        if (length1 > length2) {
            for (let j = i; j < length1; j++) {
                if (parseInt(arr1[j]) != 0) {
                    return 1;
                }
            }
            return 0;
        } else if (length1 < length2) {
            for (let j = i; j < length2; j++) {
                if (parseInt(arr2[j]) != 0) {
                    return -1;
                }
            }
            return 0;
        }
        return 0;
    }
}