import { _decorator, resources, TextAsset, error, log } from 'cc';
const { ccclass } = _decorator;

/**
 * CSV 管理类
 * 用于加载和解析 CSV 配置文件
 * 支持加载 resources 目录下的 .csv 或 .txt 文件
 */
@ccclass('CSVManager')
export class CSVManager {
    private static _instance: CSVManager;
    /** 缓存所有加载的表数据 key: 资源路径, value: 对象数组 */
    private _tables: Map<string, any[]> = new Map();

    public static getInstance(): CSVManager {
        if (!this._instance) {
            this._instance = new CSVManager();
        }
        return this._instance;
    }

    /**
     * 加载 CSV 文件
     * @param path 资源路径（相对于 resources 目录，不带扩展名）
     * @returns Promise<any[]> 解析后的数据数组
     */
    public loadCSV(path: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
            // 如果已经加载过，直接返回缓存数据
            if (this._tables.has(path)) {
                resolve(this._tables.get(path)!);
                return;
            }

            resources.load(path, TextAsset, (err, asset) => {
                if (err) {
                    error(`[CSVManager] Failed to load CSV: ${path}`, err);
                    reject(err);
                    return;
                }

                if (!asset || !asset.text) {
                    error(`[CSVManager] Asset is empty or not a text asset: ${path}`);
                    reject(new Error('Asset is empty'));
                    return;
                }

                try {
                    const data = this.parseCSV(asset.text);
                    this._tables.set(path, data);
                    log(`[CSVManager] Loaded CSV: ${path}, rows: ${data.length}`);
                    resolve(data);
                } catch (e) {
                    error(`[CSVManager] Failed to parse CSV: ${path}`, e);
                    reject(e);
                }
            });
        });
    }

    /**
     * 解析 CSV 字符串
     * @param csvString CSV 内容
     * @returns 对象数组
     */
    private parseCSV(csvString: string): any[] {
        // 统一换行符并分割
        const lines = csvString.split(/\r\n|\n|\r/);
        
        // 过滤空行和注释行（以 # 开头）
        const validLines = lines.filter(line => line.trim() !== '' && !line.trim().startsWith('#'));

        if (validLines.length < 1) return []; 

        // 第一行为表头（字段名）
        const headers = validLines[0].split(',').map(h => h.trim());
        const result: any[] = [];

        // 从第三行开始解析数据 (第一行为表头，第二行为类型定义/注释，跳过)
        for (let i = 2; i < validLines.length; i++) {
            const line = validLines[i].trim();
            // 处理简单的逗号分隔
            const values = line.split(',');
            
            // 数据列数少于表头列数，可能是无效行，跳过
            if (values.length < headers.length) continue;

            const obj: any = {};
            for (let j = 0; j < headers.length; j++) {
                const header = headers[j];
                if (!header) continue; // 跳过空表头

                // 处理可能存在的多余空格
                let value = values[j] ? values[j].trim() : '';
                
                // 尝试转换数据类型
                obj[header] = this.parseValue(value);
            }
            result.push(obj);
        }
        return result;
    }

    /**
     * 解析单个值的数据类型
     * @param value 字符串值
     */
    private parseValue(value: string): any {
        if (value === 'true') return true;
        if (value === 'false') return false;
        
        // 尝试转换为数字 (排除空字符串和纯空格)
        if (value !== '' && !isNaN(Number(value))) {
            return Number(value);
        }

        // 尝试解析 JSON（例如数组或对象）
        // 约定：如果以 [ 或 { 开头，尝试 JSON.parse
        if (value.startsWith('[') || value.startsWith('{')) {
            try {
                // 替换单引号为双引号以符合 JSON 标准（如果 CSV 中使用了单引号）
                const jsonStr = value.replace(/'/g, '"');
                return JSON.parse(jsonStr);
            } catch (e) {
                // 解析失败则按字符串返回
                return value;
            }
        }
        
        // 约定：使用 | 分隔的数组 (简单数组，不包含复杂对象)
        if (value.includes('|')) {
            return value.split('|').map(v => this.parseValue(v.trim()));
        }

        return value;
    }

    /**
     * 获取已加载的表数据
     * @param path 表路径（即 loadCSV 时的 path）
     */
    public getTable(path: string): any[] {
        return this._tables.get(path) || [];
    }
    
    /**
     * 查询某一行（返回第一个匹配项）
     * @param path 表路径
     * @param key 字段名
     * @param value 字段值
     */
    public queryOne(path: string, key: string, value: any): any {
        const table = this.getTable(path);
        return table.find(item => item[key] === value);
    }
    
    /**
     * 根据 ID 查询（假设表中有 id 字段）
     * @param path 表路径
     * @param id ID 值
     */
    public getById(path: string, id: number | string): any {
        return this.queryOne(path, 'id', id);
    }

    /**
     * 查询多行
     * @param path 表路径
     * @param key 字段名
     * @param value 字段值
     */
    public queryAll(path: string, key: string, value: any): any[] {
        const table = this.getTable(path);
        return table.filter(item => item[key] === value);
    }

    /**
     * 清理缓存
     * @param path 可选，指定清理的表路径。不传则清理所有。
     */
    public clear(path?: string) {
        if (path) {
            this._tables.delete(path);
        } else {
            this._tables.clear();
        }
    }
}
