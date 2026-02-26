/**
 * 剧场款卡模板 类
 */
export default class ResTemp {

    /**[json读取 rid] 资源ID */
    res_id:number=0;
    /**[json读取 rty] 资源类型 一般为 文件后缀名 */
    res_type:string;
    /**[json读取 res] 资源地址*/
    res:string;
    /**[json读取 way] 默认加载方式（默认为微信） 加载来源 0=本地 1=网络*/
    way:number=0;
    // /**[json读取 mod] 加载方式 ：
    //  * 0=需在加载页预加载；
    //  * 1=无需加载页中预加载，正式页面需后台预加载，加载完毕后备用；
    //  * 2=无需加载页中预加载，需要时实时异步加载；*/
    // mode:number=0;
    /**[json读取 t] 包类别 atlas=1  other=2  home=3  fps=4  box=5 share=6*/
    pack_type:number=0;

    /**[json读取 v]使用的版本号 */
    version:string;

    /**[json读取 q] QQ小游戏 加载来源 0=本地 1=网络*/
    way_qq:number=0;
    /**[json读取 z] 头条小游戏 加载来源 0=本地 1=网络*/
    way_zijie:number=0;
    /**[json读取 b] 百度小游戏 加载来源 0=本地 1=网络*/
    way_baidu:number=0;
    /**[json读取 i] VIVO小游戏 加载来源 0=本地 1=网络*/
    way_vivo:number=0;
    /**[json读取 o] OPPO小游戏 加载来源 0=本地 1=网络*/
    way_oppo:number=0;
    /**[json读取 h] 华为小游戏 加载来源 0=本地 1=网络*/
    way_huawei:number=0;
    /**[json读取 x] 小米小游戏 加载来源 0=本地 1=网络*/
    way_xiaomi:number=0;

    /**[json读取 qv] QQ小游戏 版本号*/
    version_qq:number=0;
    /**[json读取 zv] 头条小游戏 版本号*/
    version_zijie:number=0;
    /**[json读取 bv] 百度小游戏 版本号*/
    version_baidu:number=0;
    /**[json读取 iv] VIVO小游戏 版本号*/
    version_vivo:number=0;
    /**[json读取 ov] OPPO小游戏 版本号*/
    version_oppo:number=0;
    /**[json读取 hv] 华为小游戏 版本号*/
    version_huawei:number=0;
    /**[json读取 xv] 小米小游戏 版本号*/
    version_xiaomi:number=0;

    constructor() {
    }
    
    /**
     * 根据json 创建 资源 模板实例
     * @param json 
     */
    static creatByJson(json:JSON):ResTemp{
        var rt = new ResTemp();
        rt.res_id = json['rid'];
        rt.res_type = json['rty'];
        rt.pack_type = json['t'];

        rt.res = 'res/' + this.getSubPackName(rt.pack_type) + '/' + json['res'];

        rt.way = json['way'];
        // rt.mode = json['mod'];
        rt.version = json['v'];

        rt.way_qq = json['q'];
        rt.way_zijie = json['z'];
        rt.way_baidu = json['b'];
        rt.way_vivo = json['i'];
        rt.way_oppo = json['o'];
        rt.way_huawei = json['h'];
        rt.way_xiaomi = json['x'];

        rt.version_qq = json['qv'];
        rt.version_zijie = json['zv'];
        rt.version_baidu = json['bv'];
        rt.version_vivo = json['iv'];
        rt.version_oppo = json['ov'];
        rt.version_huawei = json['hv'];
        rt.version_xiaomi = json['xv'];

        return rt;
    }

    static getSubPackName(sub_pack_id: number){
        switch (sub_pack_id){
            case 0 : return '';
            case 1 : return 'atlas';
            case 2 : return 'other';
            case 3 : return 'home';
            case 6 : return 'share';
            case 7 : return 'sounds';
            case 11 : return 'map_1';
            case 12 : return 'map_2';
            case 13 : return 'map_3';
        }
    }
}