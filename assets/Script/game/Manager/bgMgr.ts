import { _decorator, Component, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('bgMgr')
export class bgMgr extends Component {
    @property(Node)
    bg1: Node = null;
    @property(Node)
    bg2: Node = null;
    @property(Node)
    bg3: Node = null;
    @property(Node)
    bg4: Node = null;

    hero: Node = null;

    @property
    recycleDistance = 1700;

    @property
    tileStep = 0;
    bgs: Node[] = [];

    // 背景图片每一关背景图都不一样
    @property({ type: SpriteFrame })
    bgsSprite: SpriteFrame[] = [];

    private _initialPositions: { node: Node; pos: Vec3 }[] = [];
    private _currentBgIndex: number = -1;

    start() {
        this.initBgs();
        this.initTileStep();
        this.cacheInitialPositions();
    }

    public setHero(heroNode: Node) {
        this.hero = heroNode;
    }

    public resetBgs() {
        this.initBgs();
        this.initTileStep();
        this.cacheInitialPositions();

        for (const item of this._initialPositions) {
            if (!item?.node) continue;
            item.node.setPosition(item.pos);
        }

        this.bgs.sort((a, b) => a.worldPosition.y - b.worldPosition.y);
    }

    public applyLevelBackground(level: number, bgIndex?: number) {
        if (!this.bgsSprite || this.bgsSprite.length === 0) return;

        let idx = bgIndex ?? (level - 1);
        if (!Number.isFinite(idx)) idx = 0;
        idx = Math.max(0, Math.floor(idx));

        const resolvedIndex = idx % this.bgsSprite.length;
        if (resolvedIndex === this._currentBgIndex) return;
        this._currentBgIndex = resolvedIndex;

        const spriteFrame = this.bgsSprite[resolvedIndex];
        if (!spriteFrame) return;

        for (const bg of this.bgs) {
            const sprite = bg.getComponent(Sprite);
            if (!sprite) continue;
            sprite.spriteFrame = spriteFrame;
        }
    }

    update(_deltaTime: number) {
        if (this.bgs.length === 0 || this.tileStep <= 0 || !this.hero) return;

        const thresholdY = this.hero.worldPosition.y - this.recycleDistance;

        for (let i = 0; i < this.bgs.length; i++) {
            const bottom = this.getBottomBg();
            if (!bottom) return;
            if (bottom.worldPosition.y > thresholdY) return;

            const top = this.getTopBg();
            if (!top) return;

            const bottomWorldPos = bottom.worldPosition;
            const topWorldPos = top.worldPosition;
            bottom.worldPosition = new Vec3(bottomWorldPos.x, topWorldPos.y + this.tileStep, bottomWorldPos.z);
        }
    }

    private initBgs() {
        const set = new Set<Node>();
        if (this.bg1) set.add(this.bg1);
        if (this.bg2) set.add(this.bg2);
        if (this.bg3) set.add(this.bg3);
        if (this.bg4) set.add(this.bg4);

        for (const child of this.node.children) {
            if (child.getComponent(UITransform)) set.add(child);
        }

        this.bgs = Array.from(set).filter(Boolean);
        this.bgs.sort((a, b) => a.worldPosition.y - b.worldPosition.y);
    }

    private initTileStep() {
        if (this.tileStep > 0) return;
        if (this.bgs.length === 0) return;

        const uiTransform = this.bgs[0].getComponent(UITransform);
        if (uiTransform) {
            this.tileStep = uiTransform.contentSize.height;
            return;
        }

        if (this.bgs.length < 2) return;
        const sorted = [...this.bgs].sort((a, b) => a.worldPosition.y - b.worldPosition.y);
        const step = Math.abs(sorted[1].worldPosition.y - sorted[0].worldPosition.y);
        if (step > 0) this.tileStep = step;
    }

    private getBottomBg() {
        let bottom: Node = null;
        let minY = Number.POSITIVE_INFINITY;
        for (const bg of this.bgs) {
            const y = bg.worldPosition.y;
            if (y < minY) {
                minY = y;
                bottom = bg;
            }
        }
        return bottom;
    }

    private getTopBg() {
        let top: Node = null;
        let maxY = Number.NEGATIVE_INFINITY;
        for (const bg of this.bgs) {
            const y = bg.worldPosition.y;
            if (y > maxY) {
                maxY = y;
                top = bg;
            }
        }
        return top;
    }

    private cacheInitialPositions() {
        if (this._initialPositions.length > 0) return;
        for (const bg of this.bgs) {
            this._initialPositions.push({ node: bg, pos: bg.position.clone() });
        }
    }
}


