import { resources, JsonAsset, SpriteFrame, Texture2D, Prefab, SpriteAtlas, Sprite } from 'cc';
import { sys, director } from 'cc';

/**
 * 资源加载 管理器
 */
export default class LoaderManeger {

    // 资源路径常量
    public static JSON_PATH = 'json/';
    
    // 单例实例
    private static _instance: LoaderManeger;
    
    // 资源缓存映射
    private _cache: Map<string, any> = new Map();
    
    // 加载中的Promise缓存，避免重复加载
    private _loadingPromises: Map<string, Promise<any>> = new Map();
    
    // 图集缓存
    private _atlasCache: Map<string, SpriteAtlas> = new Map();
    
    // 图集内精灵帧缓存
    private _spriteFrameCache: Map<string, SpriteFrame> = new Map();
    
    /**
     * 获取单例实例
     */
    public static get instance(): LoaderManeger {
        if (!LoaderManeger._instance) {
            LoaderManeger._instance = new LoaderManeger();
        }
        return LoaderManeger._instance;
    }
    
    /**
     * 私有构造函数，防止外部实例化
     */
    public constructor() {
        // 初始化缓存
        this._cache = new Map();
        this._loadingPromises = new Map();
        this._atlasCache = new Map();
        this._spriteFrameCache = new Map();
    }
    
    /**
     * 设置资源基础路径
     * @param basePath 基础路径
     */
    public setBasePath(basePath: string): void {
        // Cocos资源加载默认基于assets/resources目录
        // 此方法可用于设置CDN基础路径等
    }
    
    /**
     * 通过URL加载JSON文件（支持本地路径和网络URL）
     * @param urlOrPath JSON文件的URL或本地路径
     * @param useCache 是否使用缓存
     * @returns Promise<JsonAsset | object> JSON资源或解析后的JSON对象
     */
    public loadJSON(urlOrPath: string, useCache: boolean = true): Promise<JsonAsset | object> {
        // 检查是否为URL
        const isUrl = urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://') || urlOrPath.startsWith('file://');
        
        // 生成缓存键
        const cacheKey = `json_${urlOrPath}`;
        
        // 检查缓存
        if (useCache && this._cache.has(cacheKey)) {
            return Promise.resolve(this._cache.get(cacheKey));
        }
        
        // 检查是否正在加载
        if (this._loadingPromises.has(cacheKey)) {
            return this._loadingPromises.get(cacheKey);
        }
        
        let promise: Promise<JsonAsset | object>;
        
        if (isUrl) {
            // 加载网络或本地文件URL
            promise = new Promise((resolve, reject) => {
                fetch(urlOrPath)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        // 缓存结果
                        if (useCache) {
                            this._cache.set(cacheKey, data);
                        }
                        resolve(data);
                        // 移除加载中的Promise
                        this._loadingPromises.delete(cacheKey);
                    })
                    .catch(error => {
                        console.error('Failed to load JSON from URL:', urlOrPath, error);
                        reject(error);
                        // 移除加载中的Promise
                        this._loadingPromises.delete(cacheKey);
                    });
            });
        } else {
            // 加载本地resources目录下的JSON文件
            // 如果路径不以JSON_PATH开头，则添加JSON_PATH前缀
            const fullPath = urlOrPath.startsWith(LoaderManeger.JSON_PATH) ? urlOrPath : LoaderManeger.JSON_PATH + urlOrPath;
            
            promise = new Promise<JsonAsset>((resolve, reject) => {
                resources.load(fullPath, JsonAsset, (err, asset) => {
                    if (err) {
                        console.error('Failed to load JSON asset:', fullPath, err);
                        reject(err);
                        // 移除加载中的Promise
                        this._loadingPromises.delete(cacheKey);
                        return;
                    }
                    
                    // 缓存结果
                    if (useCache) {
                        this._cache.set(cacheKey, asset);
                    }
                    
                    resolve(asset);
                    // 移除加载中的Promise
                    this._loadingPromises.delete(cacheKey);
                });
            });
        }
        
        // 缓存加载中的Promise
        this._loadingPromises.set(cacheKey, promise);
        
        return promise;
    }
    
    
    /**
     * 加载本土图片并设置到Sprite组件
     * @param path 图片路径
     * @param useCache 是否使用缓存
     */
    public loadTexture(path: string, useCache: boolean = true) {
        const cacheKey = `texture_${path}`;
        
        if (useCache && this._cache.has(cacheKey)) {
            return Promise.resolve(this._cache.get(cacheKey));
        }
        
        if (this._loadingPromises.has(cacheKey)) {
            return this._loadingPromises.get(cacheKey);
        }
        
        const promise = new Promise<Texture2D>((resolve, reject) => {
            resources.load(path, Texture2D, (err, texture) => {
                if (err) {
                    console.error('Failed to load texture:', path, err);
                    reject(err);
                    this._loadingPromises.delete(cacheKey);
                    return;
                }
                
                if (useCache) {
                    this._cache.set(cacheKey, texture);
                }
                
                resolve(texture);
                this._loadingPromises.delete(cacheKey);
            });
        });
        
        this._loadingPromises.set(cacheKey, promise);
        return promise;
    }
    
    /**
     * 加载图集
     * @param path 图集路径
     * @param useCache 是否使用缓存
     * @returns Promise<SpriteAtlas> 图集对象
     */
    public loadAtlas(path: string, useCache: boolean = true): Promise<SpriteAtlas> {
        const cacheKey = `atlas_${path}`;
        
        if (useCache && this._atlasCache.has(cacheKey)) {
            return Promise.resolve(this._atlasCache.get(cacheKey));
        }
        
        if (this._loadingPromises.has(cacheKey)) {
            return this._loadingPromises.get(cacheKey);
        }
        
        const promise = new Promise<SpriteAtlas>((resolve, reject) => {
            resources.load(path, SpriteAtlas, (err, atlas) => {
                if (err) {
                    console.error('Failed to load atlas:', path, err);
                    reject(err);
                    this._loadingPromises.delete(cacheKey);
                    return;
                }
                
                if (useCache) {
                    this._atlasCache.set(cacheKey, atlas);
                }
                
                resolve(atlas);
                this._loadingPromises.delete(cacheKey);
            });
        });
        
        this._loadingPromises.set(cacheKey, promise);
        return promise;
    }
    
    /**
     * 从图集中获取精灵帧
     * @param atlasPath 图集路径
     * @param spriteName 精灵名称
     * @param useCache 是否使用缓存
     * @returns Promise<SpriteFrame> 精灵帧对象
     */
    public getSpriteFrameFromAtlas(atlasPath: string, spriteName: string, useCache: boolean = true): Promise<SpriteFrame> {
        const cacheKey = `spriteFrame_${atlasPath}_${spriteName}`;
        
        if (useCache && this._spriteFrameCache.has(cacheKey)) {
            return Promise.resolve(this._spriteFrameCache.get(cacheKey));
        }
        
        if (this._loadingPromises.has(cacheKey)) {
            return this._loadingPromises.get(cacheKey);
        }
        
        const promise = this.loadAtlas(atlasPath, useCache).then((atlas) => {
            const spriteFrame = atlas.getSpriteFrame(spriteName);
            if (!spriteFrame) {
                throw new Error(`Sprite frame "${spriteName}" not found in atlas "${atlasPath}"`);
            }
            
            if (useCache) {
                this._spriteFrameCache.set(cacheKey, spriteFrame);
            }
            
            return spriteFrame;
        });
        
        this._loadingPromises.set(cacheKey, promise);
        return promise;
    }
    
    /**
     * 加载本土图片并设置到Sprite组件
     * @param sprite Sprite组件
     * @param path 图片路径
     * @param useCache 是否使用缓存
     */
    public loadSprite(sprite: Sprite, path: string, useCache: boolean = true) {
        return this.loadTexture(path, useCache).then((texture) => {
            if (sprite && !sprite.destroy) {
                sprite.spriteFrame = new SpriteFrame(texture);
            }
        });
    }

    /**
     * 从图集中获取精灵帧并设置到Sprite组件
     * @param sprite Sprite组件
     * @param atlasPath 图集路径
     * @param spriteName 精灵名称
     * @param useCache 是否使用缓存
     * @returns Promise<void>
     */
    public setSpriteFrameFromAtlas(sprite: Sprite, atlasPath: string, spriteName: string, useCache: boolean = true): Promise<void> {
        return this.getSpriteFrameFromAtlas(atlasPath, spriteName, useCache).then((spriteFrame) => {
            if (sprite && !sprite.destroy) {
                sprite.spriteFrame = spriteFrame;
            }
        });
    }
    
    /**
     * 加载预制体
     * @param path 预制体路径
     * @param useCache 是否使用缓存
     * @returns Promise<Prefab> 预制体对象
     */
    public loadPrefab(path: string, useCache: boolean = true): Promise<Prefab> {
        const cacheKey = `prefab_${path}`;
        
        if (useCache && this._cache.has(cacheKey)) {
            return Promise.resolve(this._cache.get(cacheKey));
        }
        
        if (this._loadingPromises.has(cacheKey)) {
            return this._loadingPromises.get(cacheKey);
        }
        
        const promise = new Promise<Prefab>((resolve, reject) => {
            resources.load(path, Prefab, (err, prefab) => {
                if (err) {
                    console.error('Failed to load prefab:', path, err);
                    reject(err);
                    this._loadingPromises.delete(cacheKey);
                    return;
                }
                
                if (useCache) {
                    this._cache.set(cacheKey, prefab);
                }
                
                resolve(prefab);
                this._loadingPromises.delete(cacheKey);
            });
        });
        
        this._loadingPromises.set(cacheKey, promise);
        return promise;
    }
    
    /**
     * 批量加载资源
     * @param resources 需要加载的资源数组，格式：[{type: 'json', path: 'xxx'}, {type: 'texture', path: 'xxx'}]
     * @param progressCallback 进度回调函数
     * @returns Promise<any[]> 加载结果数组
     */
    public loadBatch(resources: Array<{type: string, path: string}>, progressCallback?: (progress: number) => void): Promise<any[]> {
        const promises: Promise<any>[] = [];
        
        resources.forEach((res) => {
            let promise: Promise<any>;
            
            switch (res.type) {
                case 'json':
                    promise = this.loadJSON(res.path);
                    break;
                case 'texture':
                    promise = this.loadTexture(res.path);
                    break;
                case 'atlas':
                    promise = this.loadAtlas(res.path);
                    break;
                case 'prefab':
                    promise = this.loadPrefab(res.path);
                    break;
                default:
                    promise = Promise.reject(new Error(`Unsupported resource type: ${res.type}`));
            }
            
            promises.push(promise);
        });
        
        // 进度跟踪
        let loadedCount = 0;
        const updateProgress = () => {
            loadedCount++;
            if (progressCallback) {
                progressCallback(loadedCount / resources.length);
            }
        };
        
        // 为每个promise添加完成回调以更新进度
        const promisesWithProgress = promises.map(p => p.then(result => {
            updateProgress();
            return result;
        }, error => {
            updateProgress();
            return error;
        }));
        
        return Promise.all(promisesWithProgress);
    }
    
    /**
     * 释放指定资源
     * @param type 资源类型
     * @param path 资源路径
     */
    public release(type: string, path: string): void {
        const cacheKey = `${type}_${path}`;
        
        if (this._cache.has(cacheKey)) {
            this._cache.delete(cacheKey);
        }
        
        if (type === 'atlas' && this._atlasCache.has(cacheKey)) {
            this._atlasCache.delete(cacheKey);
            // 同时删除该图集下的所有精灵帧缓存
            this._spriteFrameCache.forEach((value, key) => {
                if (key.startsWith(`spriteFrame_${path}_`)) {
                    this._spriteFrameCache.delete(key);
                }
            });
        }
        
        if (type === 'spriteFrame') {
            this._spriteFrameCache.delete(cacheKey);
        }
    }
    
    /**
     * 释放所有缓存资源
     */
    public releaseAll(): void {
        this._cache.clear();
        this._atlasCache.clear();
        this._spriteFrameCache.clear();
        this._loadingPromises.clear();
        console.log('All cached resources released');
    }
}

