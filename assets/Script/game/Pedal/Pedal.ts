import { _decorator, Component, Node, UITransform, Vec3 } from 'cc';
import { PedalType } from '../../Tools/enumConst';
const { ccclass, property } = _decorator;

@ccclass('Pedal')
export class Pedal extends Component {
    
    private _type: PedalType = PedalType.WOOD;
    private _uiTransform: UITransform = null!;
    
    onLoad() {
        this._uiTransform = this.getComponent(UITransform);
    }   

    start() {

    }

    update(deltaTime: number) {
        
    }

    setType(type: PedalType) {
        this._type = type;
    }
    
    getType(): PedalType {
        return this._type;
    }

    getPedalWidth(): number {
        if (!this._uiTransform) {
            this._uiTransform = this.getComponent(UITransform)!;
        }
        return this._uiTransform ? this._uiTransform.width : 100;
    }

    init(position: Vec3) {
        this.node.position = position;
        this.node.active = true;
    }
}


