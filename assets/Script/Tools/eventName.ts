
/**
 * 游戏事件ID定义
 */
export namespace EventName {
    /** game */
    export enum Game {
    

        /** 触摸事件 */
        TouchStart = "TouchStart",
        TouchMove = "TouchMove",
        TouchEnd = "TouchEnd",
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


        /** 侧边栏启动/恢复 */
        LaunchFromSidebar = "LaunchFromSidebar",

        /** 桌面快捷方式添加成功 */
        ShortcutAdded = "ShortcutAdded",

    }

}
