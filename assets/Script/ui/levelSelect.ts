import { _decorator, Component, Node, ScrollView, instantiate, Prefab, Label, Layout, UITransform, Color, Sprite, tween, v3 } from 'cc';
import { BaseNodeCom } from '../game/BaseNodeCom';
import BaseDialog from '../Common/view/BaseDialog';
import LoaderManeger from '../sysloader/LoaderManeger';
import { LevelConfig } from '../Tools/levelConfig';
import { App } from '../Controller/app';
import GameData from '../Common/GameData';
import AudioManager from '../Common/AudioManager';
import ViewManager from '../Common/view/ViewManager';
const { ccclass, property } = _decorator;

@ccclass('levelSelect')
export class levelSelect extends BaseDialog {
    
    /** 滚动视图节点，用于显示关卡列表 */
    @property(Node)
    ScrollViewNd: Node = null;

    /** 关卡项预制体 */
    private levelItemPrefab: Prefab = null;
    /** 当前已加载的关卡数量 */
    private loadedLevelCount: number = 0;
    /** 每页加载的数量，分批加载以优化性能 */
    private pageSize: number = 24; // 增加每页数量，通常是 3 或 4 的倍数
    /** 是否正在加载中，防止重复触发 */
    private isLoading: boolean = false;
    /** 滚动视图的内容节点 */
    private contentNd: Node = null;
    /** 滚动视图组件 */
    private scrollView: ScrollView = null;
    /** 内容节点的布局组件 */
    private contentLayout: Layout = null;
    /** 关卡总上限 */
    private readonly MAX_LEVEL: number = 1700; // 关卡上限
    /** 玩家当前已解锁的最大关卡 */
    private maxUnlockedLevel: number = 1;
    
    /**
     * 生命周期：加载时调用
     * 初始化UI引用、布局模式及事件监听
     */
    onLoad(): void {
        super.onLoad();
        this.maxUnlockedLevel = GameData.getMaxLevel();
        this.ScrollViewNd = this.viewList.get("ScrollView");
        if (this.ScrollViewNd) {
            this.scrollView = this.ScrollViewNd.getComponent(ScrollView);
            this.contentNd = this.scrollView.content;
            this.contentLayout = this.contentNd.getComponent(Layout);
            
            // 确保 Layout 自动调整容器高度
            if (this.contentLayout) {
                this.contentLayout.resizeMode = Layout.ResizeMode.CONTAINER;
            }

            // 监听滚动事件，用于预加载
            this.ScrollViewNd.on(ScrollView.EventType.SCROLLING, this.onScrolling, this);
        }
    }

    /**
     * 生命周期：开始时调用
     * 加载预制体并初始化第一批关卡数据
     */
    async start() {
        // 加载预制体
        this.levelItemPrefab = await LoaderManeger.instance.loadPrefab('prefab/ui/levelttem');
        
        // 清空占位内容
        if (this.contentNd) {
            this.contentNd.removeAllChildren();
            // 初始高度设为 0，等待 Layout 重新计算
            this.contentNd.getComponent(UITransform).height = 0;
        }

        // 初始加载第一批
        await this.loadMoreLevels();
    }

    /**
     * 滚动监听回调
     * 检测是否滚动到底部，触发加载下一页逻辑
     */
    private onScrolling() {
        if (this.isLoading || this.loadedLevelCount >= this.MAX_LEVEL) return;

        // 计算当前滚动进度
        // content 总高度 - view 视口高度 = 最大可滚动距离
        const scrollOffset = this.scrollView.getScrollOffset();
        const maxScrollOffset = this.scrollView.getMaxScrollOffset();
        
        // 当滑动到距离底部 300 像素以内时，提前开始加载下一页
        if (maxScrollOffset.y - scrollOffset.y < 300) {
            this.loadMoreLevels();
        }
    }

    /**
     * 异步分帧加载更多关卡
     * 使用分帧策略避免一次性创建大量节点导致的主线程阻塞
     */
    private async loadMoreLevels() {
        if (this.isLoading || this.loadedLevelCount >= this.MAX_LEVEL) return;
        
        this.isLoading = true;
        console.log(`Starting to load levels from ${this.loadedLevelCount + 1}...`);

        const startIdx = this.loadedLevelCount;
        const endIdx = Math.min(startIdx + this.pageSize, this.MAX_LEVEL);
        
        // 分帧创建节点，避免主线程阻塞
        for (let i = startIdx + 1; i <= endIdx; i++) {
            this.createLevelItem(i);
            this.loadedLevelCount = i;
            
            // 每创建 4 个节点暂停一帧
            if (i % 4 === 0) {
                // 强制刷新一次 Layout，更新 content 高度
                if (this.contentLayout) {
                    this.contentLayout.updateLayout();
                }
                await this.waitNextFrame();
            }
        }
        
        // 全部加载完后再刷新一次
        if (this.contentLayout) {
            this.contentLayout.updateLayout();
        }
        
        this.isLoading = false;
        console.log(`Finished loading levels. Total loaded: ${this.loadedLevelCount}`);
    }

    /**
     * 等待下一帧
     * 辅助方法，用于分帧加载时的异步等待
     * @returns Promise<void>
     */
    private waitNextFrame(): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, 0));
    }

    /**
     * 创建单个关卡项
     * @param levelIndex 关卡索引（关卡号）
     * 实例化预制体，设置关卡数字、解锁状态和点击事件
     */
    private createLevelItem(levelIndex: number) {
        if (!this.levelItemPrefab || !this.contentNd) return;
        
        let node = instantiate(this.levelItemPrefab);
        node.name = levelIndex.toString();
        this.contentNd.addChild(node);

        const isUnlocked = levelIndex <= this.maxUnlockedLevel;

        // 处理锁的状态
        const lockNode = node.getChildByName('lock');
        if (lockNode) {
            lockNode.active = !isUnlocked;
        }

        // 如果未解锁，变灰或降低亮度
        if (!isUnlocked) {
            const sprite = node.getComponent(Sprite);
            if (sprite) {
                sprite.color = new Color(150, 150, 150, 255);
            }
        }

        // 为关卡项注册点击事件，与 onClick_levelBtn 配合
        node.on(Node.EventType.TOUCH_END, () => {
            // 只有当没有在滑动时才触发点击（简单防误触）
            if (this.scrollView && this.scrollView.isScrolling()) return;
            this.onClick_levelBtn(node);
        }, this);
        
        // 设置关卡文字
        let label = node.getComponentInChildren(Label);
        if (label) {
            label.string = levelIndex.toString();
            // 未解锁时文字也变灰
            if (!isUnlocked) {
                label.node.getComponent(UITransform).node.getComponent(Label).color = new Color(200, 200, 200, 255);
            }
        }

        // 处理"选择"子节点的显示/隐藏
        const selectNode = node.getChildByName('选择');
        if (selectNode) {
            // 只有最新的那一关（maxUnlockedLevel）才显示"选择"子节点
            selectNode.active = (levelIndex === this.maxUnlockedLevel);
        }
    }

    update(deltaTime: number) {
        
    }

    /**
     * 关闭按钮点击事件
     * 清理资源并关闭弹窗
     * @param node 按钮节点
     */
    onClick_closeBtn(node: Node) {
        this.ScrollViewNd.removeAllChildren();
        this.ScrollViewNd.destroyAllChildren();
       this.dismiss();
    }

    /**
     * 关卡项点击事件
     * 检查关卡是否解锁，若解锁则开始游戏
     * @param node 被点击的关卡节点，name属性存储关卡号
     */
    onClick_levelBtn(node: Node) {
        let level = parseInt(node.name);
        if (isNaN(level)) return;

        if (level > this.maxUnlockedLevel) {
            console.log("Level locked:", level);
            ViewManager.toast("关卡未解锁");
            return;
        }

        console.log("Selecting level:", level);
        GameData.setCurLevel(level);
        App.GoGame();
        this.dismiss();
    }

    /**
     * 开始游戏按钮点击事件
     * 直接开始当前关卡（通常是最高解锁关卡或上次游玩的关卡）
     */
    onClick_playBtn() {
        GameData.setCurLevel(GameData.getMaxLevel());
        App.GoGame();
        this.dismiss();
    }

}


