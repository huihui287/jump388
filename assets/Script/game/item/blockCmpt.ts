import { _decorator, Component, Label, Node, UITransform, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('blockCmpt')
export class blockCmpt extends Component {
    public h: number = 0;
    public v: number = 0;

    grid_fill: Node = null;
    initData(h: number, v: number) {

       this.grid_fill = this.node.getChildByName("grid_fill");
      
        this.h = h;
        this.v = v;
        // this.node.getChildByName("lb").getComponent(Label).string = `(${h},${v})`;
    }
    isInside(pos: Vec3): boolean {
        let width = this.node.getComponent(UITransform).width;
        let curPos = this.node.position;
        if (Math.abs(pos.x - curPos.x) <= width / 2 && Math.abs(pos.y - curPos.y) <= width / 2) return true;
        return false;
    }

    setFill(isshow: boolean) {
        if (this.grid_fill) {

            this.grid_fill.active = isshow;
        } else {
           
        }
    }

}