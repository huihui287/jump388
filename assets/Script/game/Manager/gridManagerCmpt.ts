import { _decorator, Component, Node, Prefab, Vec3, v3, instantiate } from 'cc';
import { Constant } from '../../Tools/enumConst';
import { App } from '../../Controller/app';
import LoaderManeger from '../../sysloader/LoaderManeger';
import { blockCmpt } from '../item/blockCmpt';

const { ccclass, property } = _decorator;

@ccclass('gridManagerCmpt')
export class gridManagerCmpt extends Component {
    private blockPre: Prefab = null;
    private obstacleArr = [];
    private blockArr: Node[][] = [];
    private blockPosArr: Vec3[][] = [];
    /** 行列数 */
    private H: number = Constant.layCount;
    private V: number = Constant.layCount;
    private rectWidth: number = Constant.Width;
    private hideList = [];
    /** 对象池相关 */
    private blockPool: Node[] = [];
    private poolCapacity: number = 100;
    public async initGrid() {
        await this.loadLinePre();
        this.initLayout();
    }

    async loadLinePre() {
        // this.blockPre = await ResLoadHelper.loadPieces(ViewName.Pieces.block);
        this.blockPre = await LoaderManeger.instance.loadPrefab('prefab/pieces/block');
    }

    initLayout() {
        this.hideList = App.gameCtr.hideList;
        this.clearData();
        let gap = 0;
        let width = this.rectWidth;
        for (let i = 0; i < this.H; i++) {
            this.blockArr.push([]);
            this.blockPosArr.push([]);
            for (let j = 0; j < this.V; j++) {
                let xx = (width + gap) * (i + 0) - (width + gap) * (this.H - 1) / 2;
                let yy = (width + gap) * (j + 0) - (width + gap) * (this.V - 1) / 2;
                let pos = v3(xx, yy, 1);
                this.blockPosArr[i][j] = pos;
                if (App.gameCtr.checkInHideList(i, j)) {
                    this.blockArr[i][j] = null;
                    continue;
                }
                let block = this.addBlock(i, j, pos);
                
                // 设置底图显示不显示，每一行岔开显示
                let blockCmpt1 = block.getComponent(blockCmpt);
                if (blockCmpt1 && blockCmpt1.setFill) {
                    // 实现9列的循环显示规则：
                    // 第一行【0，1，0，1，0，1，0，1，0】
                    // 第二行【1，0，1，0，1，0，1，0，1】
                    // 然后循环依次类推
                    // 所有行都按照规则显示，包括最后一行
                    blockCmpt1.setFill((i + j) % 2 === 1);
                }
                
                this.blockArr[i][j] = block;
            }
        }

    }
    

    addBlock(i: number, j: number, pos: Vec3 = null): Node {
        let block: Node;
        if (this.blockPool.length > 0) { // 从对象池获取
            block = this.blockPool.pop();
            block.parent = this.node;
            block.active = true;
        } else { // 创建新对象
            block = instantiate(this.blockPre);
            this.node.addChild(block);
        }
        block.getComponent(blockCmpt).initData(i, j);
        if (pos) {
            block.setPosition(pos);
        }
        return block;
        /* 原代码保留
        let block = instantiate(this.blockPre);
        this.node.addChild(block);
        block.getComponent(blockCmpt).initData(i, j);
        if (pos) {
            block.setPosition(pos);
        }
        return block;
        */
    }

    clearData() {
        if (this.blockArr.length < 1) return;
        for (let i = 0; i < this.H; i++) {
            for (let j = 0; j < this.V; j++) {
                let block = this.blockArr[i][j];
                if (block) {
                    if (this.blockPool.length < this.poolCapacity) { // 回收至对象池
                        block.active = false;
                        block.removeFromParent();
                        this.blockPool.push(block);
                    } else { // 池满则销毁
                        block.destroy();
                    }
                }
            }
        }
        this.obstacleArr.forEach(item => item.destroy());
        this.obstacleArr = [];
        this.blockArr = [];
        this.blockPosArr = [];
        /* 原代码保留
        if (this.blockArr.length < 1) return;
        for (let i = 0; i < this.H; i++) {
            for (let j = 0; j < this.V; j++) {
                let block = this.blockArr[i][j];
                if (block) {
                    block.destroy();
                }
            }
        }
        this.obstacleArr.forEach(item => item.destroy());
        this.obstacleArr = [];
        this.blockArr = [];
        this.blockPosArr = [];
        */
    }
}


