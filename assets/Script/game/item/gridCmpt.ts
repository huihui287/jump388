import { _decorator, Component, Node, Vec3, UITransform, Label } from 'cc';
import { App } from '../../Controller/app';
import { ToolsHelper } from '../../Tools/toolsHelper';
import GameData from '../../Common/GameData';
import { GridType } from '../../Tools/enumConst';

const { ccclass, property } = _decorator;

@ccclass('gridCmpt')
export class gridCmpt extends Component {
    /** 横纵轴编号 */
    public h: number = 0;
    public v: number = 0;
    public type: number = -1;//水果类型
    public obstacleValue: number = 0;
    public attack: number = 1; // 攻击
    public data: { h: number, v: number }

    public initData(h: number, v: number, type: number = -1) {
        this.h = h;
        this.v = v;
        this.data = { h: h, v: v }
        if (type > -1) {
            this.type = type;
        }
        if (this.type == -1) {
            this.type = Math.floor(Math.random() * App.gameCtr.blockCount);
            // this.type = Math.floor(Math.random() * 6);
        }
        this.node.getChildByName('icon').children.forEach(item => {
            item.active = false;
            if (item.name == `Match${this.type}`) {
                item.active = true;
            }
            if (item.name == this.type + "") {
                item.active = true;
            }
        });
        this.showPos(h, v);
    }   


    setAttack(attack: number) {
        this.attack = attack;
        GameData.saveData('LVAttack' + this.type, attack);

    }

    getAttack() {
        this.attack = GameData.loadData('LVAttack' + this.type, 1);
    //    console.log('this.attack', this.attack);
        return this.attack;
    }
    
    onDisable() {
        this.type = -1;
    }

    showPos(h: number = this.h, v: number = this.v) {
        let lb = this.node.getChildByName('lb');
        // lb.getComponent(Label).string = `(${h},${v})`;
        lb.active = false;
    }

    isInside(pos: Vec3): boolean {
        let width = this.node.getComponent(UITransform).width;
        let curPos = this.node.position;
        if (Math.abs(pos.x - curPos.x) <= width / 2 && Math.abs(pos.y - curPos.y) <= width / 2) 
            return true;
        return false;
    }

    /** 选中状态 */
    setSelected(bool: boolean) {
        if (!this.isValid) return;
        this.node.getChildByName('icon').children.forEach(item => {
            if (item.active && item.getChildByName('s')) {
                let numnode = item.getChildByName('s');
                numnode.active = bool;
                if (bool) {
                    numnode.scale = new Vec3(1.08, 1.08, 1);
                } else {
                    numnode.scale = new Vec3(1.0, 1.0, 1);
                }
            }
        })
    }

    getMoveState() {
        return false;
    }

    setType(type: number) {
        if (!this.isValid) return;
        this.type = type;
        this.node.getChildByName('icon').children.forEach(item => {
            item.active = false;
            if (item.name == `Match${this.type}`) {
                item.active = true;
            }
            if (item.name == this.type + "") {
                item.active = true;
            }
        });
    }

    setCount(count: number | string | number[]) {
        let displayCount: string = "";
        
        // 处理不同类型的参数
        if (typeof count === 'number') {
            // 直接使用数字参数
            displayCount = count.toString();
        } else if (typeof count === 'string') {
            // 尝试将字符串转换为数字
            displayCount = count;
        } else if (Array.isArray(count)) {
            // 处理数组参数，这里假设使用数组的长度作为计数
            // 你可以根据实际需求修改数组处理逻辑
            
        }
        
        let lb = this.node.getChildByName('lb');
        lb.getComponent(Label).string = displayCount;

        if (parseInt(displayCount) == 0) {
            this.node.getChildByName('ok').active = true;
        }
        else {
            lb.active = true;
            this.node.getChildByName('ok').active = false;
        }
    }

    showGou(bool: boolean) {
        this.node.getChildByName('gou').active = bool;
    }

    /** 显示提示 */
    async showTips() {
        this.node.getChildByName("selected").active = true;
        await ToolsHelper.delayTime(2);
        if (this.isValid) {
            this.node.getChildByName("selected").active = false;
        }
    }

    /** 显示提示教学 */
    async showTipsGuide(isshow: boolean) {
        let node = this.node.getChildByName("selected");
        if (node) {
            node.active = isshow;
        }
    }
    
    /** 重置grid状态 */
    public reset() {
        this.type = -1;
        this.h = 0;
        this.v = 0;
        this.obstacleValue = 0;

        // 隐藏所有图标
        this.node.getChildByName('icon').children.forEach(item => {
            item.active = false;
        });
        
        // 隐藏标签和勾
        this.node.getChildByName('lb').active = false;
        this.node.getChildByName('ok').active = false;
        this.node.getChildByName('gou').active = false;
        this.node.getChildByName('selected').active = false;
        
        // 重置选中状态
        this.setSelected(false);
    }
}
