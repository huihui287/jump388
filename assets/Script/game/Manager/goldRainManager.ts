import { _decorator, Component, instantiate, Node, NodePool, Prefab, UITransform, Vec3 } from 'cc';
import GameData from '../../Common/GameData';
import LoaderManeger from '../../sysloader/LoaderManeger';
import { Constant } from '../../Tools/enumConst';
import { Hero } from '../Hero';
const { ccclass } = _decorator;

@ccclass('goldRainManager')
export class goldRainManager extends Component {
    /**
     * 运行时 Hero 引用（用于碰撞检测与设置金币生成的层级）
     */
    private _hero: Hero | null = null;
    /**
     * 金币预制体（首次触发金币雨时按需加载）
     */
    private _goldPrefab: Prefab | null = null;
    /**
     * 金币节点对象池：金币回收时 put，生成时优先 get；避免频繁 instantiate/destroy。
     */
    private _coinPool = new NodePool();
    /**
     * 本局已触发次数（用于限制每局触发上限）
     */
    private _triggeredCount = 0;
    /**
     * 当前屏幕中“正在下落”的金币列表
     */
    private _coins: Array<{ node: Node; fallSpeed: number }> = [];
    /**
     * 是否处于“本次金币雨正在生成金币”的阶段
     */
    private _isRaining = false;
    /**
     * 本次金币雨已生成的金币数量
     */
    private _spawnedThisRain = 0;
    /**
     * 连续生成金币的计时器（按间隔逐个生成）
     */
    private _spawnTimer = 0;
    /**
     * 连续生成金币的间隔（秒）
     */
    private _spawnInterval = 0.08;
    /**
     * 本次金币雨的水平中心点（通常使用触发踏板的 worldPosition.x）
     */
    private _rainCenterX = 0;

    /**
     * 注入 Hero 引用（Game.ts 在 initHero 后调用）
     */
    setHero(hero: Hero | null) {
        this._hero = hero;
    }

    /**
     * 重置“每局状态”
     * - 触发次数清零（允许下一局重新触发）
     * - 停止当前金币雨生成
     * - 回收当前仍在场景中的金币节点到对象池
     */
    resetSession() {
        this._triggeredCount = 0;
        this._isRaining = false;
        this._spawnedThisRain = 0;
        this._spawnTimer = 0;
        for (const c of this._coins) {
            this.recycleCoin(c.node);
        }
        this._coins.length = 0;
    }

    /**
     * 尝试触发一次金币雨
     * 规则：
     * - 本局触发上限 3 次
     * - 生效后进入“连续生成金币”阶段，直到生成 50 枚为止
     */
    async tryTrigger(pedalNode: Node) {
        if (!this._hero || !pedalNode) return;
        if (this._triggeredCount >= 3) return;

        this._triggeredCount += 1;

        if (!this._goldPrefab) {
            this._goldPrefab = await LoaderManeger.instance.loadPrefab('prefab/item/flyGold');
        }
        this._rainCenterX = pedalNode.worldPosition.x;
        this._isRaining = true;
        this._spawnedThisRain = 0;
        this._spawnTimer = 0;
    }

    /**
     * 每帧：
     * 1) 若金币雨生效中：按间隔从屏幕上方连续生成金币
     * 2) 驱动金币下落
     * 3) 与 Hero 做 AABB 重叠检测，命中则回收金币并加 1 金币
     */
    update(dt: number) {
        if (!this._hero) return;

        const heroNode = this._hero.node;
        const heroUi = heroNode.getComponent(UITransform);
        if (!heroUi) return;

        this.spawnCoins(dt, heroNode);
        if (this._coins.length === 0) return;

        const heroPos = heroNode.worldPosition;
        const heroLeft = heroPos.x - heroUi.width * heroUi.anchorX;
        const heroRight = heroPos.x + heroUi.width * (1 - heroUi.anchorX);
        const heroBottom = heroPos.y - heroUi.height * heroUi.anchorY;
        const heroTop = heroPos.y + heroUi.height * (1 - heroUi.anchorY);

        /**
         * 出界阈值：低于屏幕底部一定距离就回收
         * 这里使用 Hero 的 y 作为参考，避免不同关卡/相机位置导致阈值不一致。
         */
        const despawnY = heroPos.y - Constant.Height / 2 - 200;

        for (let i = this._coins.length - 1; i >= 0; i--) {
            const coinNode = this._coins[i].node;
            if (!coinNode || !coinNode.isValid) {
                this._coins.splice(i, 1);
                continue;
            }

            const speed = this._coins[i].fallSpeed;
            const p = coinNode.worldPosition;
            coinNode.setWorldPosition(p.x, p.y - speed * dt, p.z);

            const coinPos = coinNode.worldPosition;
            if (coinPos.y < despawnY) {
                this.recycleCoin(coinNode);
                this._coins.splice(i, 1);
                continue;
            }

            const coinUi = coinNode.getComponent(UITransform);
            if (!coinUi) continue;

            const coinLeft = coinPos.x - coinUi.width * coinUi.anchorX * coinNode.scale.x;
            const coinRight = coinPos.x + coinUi.width * (1 - coinUi.anchorX) * coinNode.scale.x;
            const coinBottom = coinPos.y - coinUi.height * coinUi.anchorY * coinNode.scale.y;
            const coinTop = coinPos.y + coinUi.height * (1 - coinUi.anchorY) * coinNode.scale.y;

            const overlapX = Math.max(heroLeft, coinLeft) < Math.min(heroRight, coinRight);
            const overlapY = Math.max(heroBottom, coinBottom) < Math.min(heroTop, coinTop);
            if (overlapX && overlapY) {
                GameData.addGold(1);
                this.recycleCoin(coinNode);
                this._coins.splice(i, 1);
            }
        }
    }

    /**
     * 连续生成金币（从屏幕上方往下落）
     * - 每次金币雨生成总数固定为 50
     * - x 落点固定为触发踏板的 x（形成竖直一条线下落）
     */
    private spawnCoins(dt: number, heroNode: Node) {
        if (!this._isRaining) return;
        if (!this._goldPrefab) return;

        const coinCount = 50;
        if (this._spawnedThisRain >= coinCount) {
            this._isRaining = false;
            return;
        }

        this._spawnTimer += dt;
        while (this._spawnTimer >= this._spawnInterval && this._spawnedThisRain < coinCount) {
            this._spawnTimer -= this._spawnInterval;

            const parentNode = heroNode.parent ?? this.node;

            const heroY = heroNode.worldPosition.y;
            const startY = heroY + Constant.Height / 2 + 300;

            const x = this._rainCenterX;

            const coin = this.acquireCoin(parentNode, heroNode.layer);
            if (!coin) {
                this._isRaining = false;
                return;
            }
           // coin.setScale(scaled, scaled, 1);
            coin.setWorldPosition(new Vec3(x, startY, 0));

            this._coins.push({ node: coin, fallSpeed: 900 });
            this._spawnedThisRain += 1;
        }
    }

    /**
     * 从对象池获取一个金币节点（池空则 instantiate）
     * 约定：
     * - 取出后必须挂到 parentNode 上
     * - 必须激活节点并设置 layer（确保与 Hero 同层可见）
     */
    private acquireCoin(parentNode: Node, layer: number): Node | null {
        if (!this._goldPrefab) return null;

        let coinNode: Node | null = null;
        while (this._coinPool.size() > 0) {
            const n = this._coinPool.get() as Node;
            if (n && n.isValid) {
                coinNode = n;
                break;
            }
        }

        if (!coinNode) {
            coinNode = instantiate(this._goldPrefab);
        }

        coinNode.active = true;
        parentNode.addChild(coinNode);
        coinNode.layer = layer;
        return coinNode;
    }

    /**
     * 回收金币节点到对象池
     * - 先从父节点移除，避免仍参与渲染/布局
     * - 置为 inactive，减少不必要的更新
     * - put 回池以复用
     */
    private recycleCoin(coinNode: Node) {
        if (!coinNode || !coinNode.isValid) return;
        coinNode.active = false;
        coinNode.removeFromParent();
        this._coinPool.put(coinNode);
    }

    /**
     * 组件销毁时清理对象池（释放缓存节点）
     */
    protected onDestroy(): void {
        this.resetSession();
        this._coinPool.clear();
    }
}
