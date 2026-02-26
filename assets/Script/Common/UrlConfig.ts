/**
 * 游戏URL配置
 * 根据自己的项目配置正确的地址
 */

const { ccclass, property } = cc._decorator;

@ccclass
export default class UrlConfig {

  static rootUrl = "https://game.fanhuihui.cn/index.php/game20220317/";
  static LOGIN = "Index/userLogin";
  static SAVE_INFO = "user/setUserData";
  static GET_INFO = "user/getUser";
  static GET_WORLD=  "ranking/getWorldList";

}
