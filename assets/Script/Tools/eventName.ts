
/**
 * 游戏事件ID定义
 */
export namespace EventName {
    /** game */
    export enum Game {
        /** 移动 */
        Move = "Move",
        /** 停止移动 */
        EndMove = "EndMove",
        /** 点击到的方块 */
        TouchTile = "TouchTile",
        /** 刷新层数 */
        RefreshCurLevel = "RefreshCurLevel",
        /** 加载地图 */
        LoadMap = "LoadMap",
        /** 返回主页 */
        BackHome = "BackHome",
        /** 添加星星分数 */
        AddStarScore = "AddStarScore",
        /** 刷新金币 */
        UpdataGold = "UpdataGold",
    
        /** 提示道具 */
        RefreshTools = "RefreshTools",
        /** 跳过道具 */
        ToolReturn = "ToolReturn",
        /** 刷新道具数量数据 */
        ToolCountRefresh = "ToolCountRefresh",
        /** 分享 */
        Share = "Share",
        /** 布阵结束 */
        LayoutFinish = "LayoutFinish",
        /** 点击到方块做出回应 */
        ClickedTile = "ClickedTile",
        /** 链接服务器成功 */
        Connected = "Connected",

        /** 触摸事件 */
        TouchStart = "TouchStart",
        TouchMove = "TouchMove",
        TouchEnd = "TouchEnd",
        /** 拖动方块的过程中检测，拖动的位置，水平/垂直 */
        TouchMovingAndCheckPos = "TouchMovingAndCheckPos",
        /** 已经放到合适的位置上 */
        IsSuitable = "IsSuitable",
        CheckRusult = "CheckRusult",
        FlyFlower = "FlyFlower",
        GuildEvent = "GuildEvent",
        Scrolling = "Scrollinggg",
       // GotoShop = "GotoShopgg",
        /** 全局倒计时 */
        TIMER_DOWN = "TIMER_DOWN",

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        /** 下一关 */
        NextLevel = "NextLevel",
        /** 游戏失败 */
        GameOver = "GameOver",
        /** 继续游戏 */
        ContinueGame = "ContinueGame",
        /** 暂停游戏 */
        Pause = "Pause",
        /** 恢复游戏 */
        Resume = "Resume",
        /** 重新开始 */
        RestartGame = "RestartGame",
        /** 扣血 */
        Damage = "Damage",

        /** 侧边栏启动/恢复 */
        LaunchFromSidebar = "LaunchFromSidebar",

        /** 桌面快捷方式添加成功 */
        ShortcutAdded = "ShortcutAdded",

        /** 回收火箭到对象池 */
        RecycleRocket = "RecycleRocket",
    }

    export enum UI {
        /** 旋转 */
        RotateTile = "RotateTile",
        /** 移动摄像机 */
        MoveCarmera = "MoveCarmera",
    }
    
}
