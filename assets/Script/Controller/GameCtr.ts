import { Node, } from "cc";
import { SingletonClass } from "./singletonClass";
import { LevelConfig } from "../Tools/levelConfig";
import { Bomb, Constant } from "../Tools/enumConst";

export class GameCtr extends SingletonClass<GameCtr> {
    public rewardGold: number = 100;
    public curLevel: number = 1;

    /** 是否暂停 */
    public isPause: boolean = false;

    protected async onInit(...args: any[]) {
    }
       
    setPause(pause: boolean) {
        this.isPause = pause;
    }

}

