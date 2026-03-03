export interface BaseINT {

    createVideoAd();
    showVideoAd();

    createBannerAd();
    destroyBannerAd();
    showBannerAd();
    hideBannerAd();

    /**
     * 分包加载
     * @param name 分包名称
     * @param callback 加载完成回调
     */
    loadSubPackages(name: string, callback: Function);

    /**
     * 启动陀螺仪
     */
    startGyroscope();

    /**
     * 监听陀螺仪数据变化
     */
    onGyroscopeChange(callback?: (params: { x: number, y: number, z: number }) => void);
}