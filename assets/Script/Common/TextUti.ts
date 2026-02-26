import { Vec2 } from "cc";



export default class TextUtil {

    //裁剪字符串，超出指定长度之后显示...(每个中文字符长度为2）
    public static cutstr(str, len) {
        let str_length = 0;
        let str_len = 0;
        let str_cut = new String();
        str_len = str.length;
        for (var i = 0; i < str_len; i++) {
            let a = str.charAt(i);
            str_length++;
            if (escape(a).length > 4) {
                //中文字符的长度经编码之后大于4 
                str_length++;
            }
            str_cut = str_cut.concat(a);
            if (str_length > len) {
                str_cut = str_cut.concat("...");
                return str_cut;
            }
        }
        return str;
    }

    /**
     * 格式"%02d"字符串
     * 
     * @param path 拼接资源路径
     * @param num 整数
     */
    static utilFormatStr(path, num) {
        if (path.indexOf("%02d") == -1)
            return;
        let strs = path.split("%02d");
        let forepart = strs[0];
        let backStr = null;
        if (Math.floor(num / 10)) {
            backStr = num;
        }
        else {
            backStr = "0" + num;
        }
        return forepart + backStr;
    }


    static formatNum(value) {
        value = value;
        if (value >= 10000 && value < 100000000) {
            value = value / 10000;
            value = TextUtil.getString(value) + "万";
        }
        else if (value >= 100000000 && value < 1000000000000) {
            value = value / 100000000;
            value = TextUtil.getString(value) + "亿";
        }
        else if (value >= 1000000000000) {
            value = value / 1000000000000;
            value = TextUtil.getString(value) + "兆";
        } else {
            value = Math.floor(value)
        }
        return value;
    }

    static getString(num) {

        var num = (num || 0).toString(), result = '';
        let intStr = num;

        let xiaoshuweizi = intStr.indexOf(".");
        if (xiaoshuweizi == -1) {
            return num;
        }
        let xiaoshu = intStr.slice(0, xiaoshuweizi + 3);
        let ttt = xiaoshu.slice(-3);
        let intshu = xiaoshu.slice(0, xiaoshuweizi);
        while (intshu.length > 3) {
            result = ',' + intshu.slice(-3) + result;
            intshu = intshu.slice(0, intshu.length - 3);
        }
        if (intshu) {
            result = intshu + result + ttt;
        }
        return result;
    }

    static RenSum(m, n) {
        let num = Math.floor(Math.random() * (m - n) + n);
        return num;
    }

    // 角度转向量   
    public static angle_to_vector(angle: number) {
        // tan = sin / cos
        // 将传入的角度转为弧度
        let radian = TextUtil.angle_to_radian(angle);
        // 算出cos,sin和tan
        let cos = Math.cos(radian);// 邻边 / 斜边
        let sin = Math.sin(radian);// 对边 / 斜边
        let tan = sin / cos;// 对边 / 邻边
        // 结合在一起并归一化
        let vec = new Vec2(cos, sin).normalize();
        // 返回向量
        return (vec);
    }

    // 角度转弧度
    public static angle_to_radian(angle: number): number {
        // 角度转弧度公式
        // π / 180 * 角度

        // 计算出弧度
        let radian = Math.PI / 180 * angle;
        // 返回弧度
        return (radian);
    }

    // 向量转角度
    public static vector_to_angle(vector: Vec2): number {
        // 将传入的向量归一化
        let dir = vector.normalize();
        // 计算出目标角度的弧度
        let radian = dir.signAngle(new Vec2(1, 0));
        // 把弧度计算成角度
        let angle = -TextUtil.radian_to_angle(radian);
        // 返回角度
        return (angle);
    }

    // 弧度转角度
    public static radian_to_angle(radian: number): number {
        // 弧度转角度公式
        // 180 / π * 弧度

        // 计算出角度
        let angle = 180 / Math.PI * radian;
        // 返回弧度
        return (angle);
    }

}
