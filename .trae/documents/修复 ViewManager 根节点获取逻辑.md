## 任务目标

解决使用道具后滑动方块导致的 TypeError: Cannot read properties of null (reading 'h') 报错，消除异步操作冲突。

## 技术方案

### 1. 棋盘状态锁定 (Game.ts)

* 在 evtTouchStart 中增加对 this.isChecking 的检查，如果为 true 则拒绝新的触摸操作。

* 在 evtTouchMove 中同步增加 isChecking 检查，防止在处理爆炸或下落时触发滑动交换。

### 2. 增强 changeData 健壮性 (Game.ts)

* 在交换 item1.data 和 item2.data 前，增加 if (!item1 || !item2 || !item1.data || !item2.data) 保护。

* 在调用 initData 刷新网格前，检查 blockArr\[x]\[y] 是否依然有效（isValid）。

### 3. 异步流程保护 (Game.ts)

* 在 startChangeCurTwoPos 的 tween 动画等待结束后，增加对交换双方节点的 isValid 检查。

* 如果节点在动画期间被炸弹逻辑销毁，则通过 catch 块安全捕获错误并重置 touch 状态。

## 验证计划

* 使用炸弹道具后，在爆炸动画期间尝试滑动方块，确认不会触发新的交换且不会报错。

* 确认正常的消除和下落逻辑依然流畅。

