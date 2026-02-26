根据您的提示（`getAttack` 返回 0，默认值应为 1），推测问题出在 `loadData` 对**空字符串**的处理上。

**问题分析：**

1. 在某些环境或特定情况下，`sys.localStorage.getItem(key)` 对于不存在的键可能返回空字符串 `""` 而不是 `null`。
2. 当前代码逻辑：
   * `dataStr` 为 `""`（不等于 `null`），进入解析流程。
   * `JSON.parse("")` 抛出异常（SyntaxError）。
   * 进入 `catch` 块：`Number("")` 的结果是 `0`。
   * 最终返回 `0`。
3. 这导致 `getAttack` 传入默认值 `1`，却返回了 `0`，符合您描述的“在新用户时值被改变”的情况。

**解决方案：**

* 修改 `loadData` 方法，显式检查空字符串。
* 当 `dataStr` 为 `null` **或者** `""` 时，都直接返回 `defaultValue`。

**计划修改代码 (GameData.ts)：**

```typescript
    static loadData(key: string, defaultValue: any): any {
        try {
            const dataStr = sys.localStorage.getItem(key);
            // 新增 || dataStr === "" 判断
            if (dataStr === null || dataStr === "") {
                return defaultValue;
            }
            // ... 后续逻辑不变
```

请确认是否执行此修复。

