
/**
 * 场景模板 类
 */
export default class DramaTemp {
    /**对应的json文件名 */
    static JSON_RES_NAME = 'drama_core.json';
    /**对应的json文件中 的key */
    static JSON_KEY = 'drama_temp';

    /**关卡id */
    drid: number;
    /**场景模板ID */
    srid: number;
    /**场景风格ID */
    scid: number;
  
    /**
     * 根据json 场景的敌人出生点 对象
     * @param json 
     */
    static creatByJson(json: JSON): DramaTemp {
        var s = new DramaTemp();
        for (let prop in json) {
            s[prop] = json[prop];
        }
        return s;
    }
}