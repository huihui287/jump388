import { _decorator, Component, Node, ProgressBar } from 'cc';
import CM from '../channel/CM';
import LoaderManeger from '../sysloader/LoaderManeger';
import { App } from '../Controller/app';
import { LevelConfig } from '../Tools/levelConfig';
import GameData from '../Common/GameData';
const { ccclass, property } = _decorator;

@ccclass('Load')
export class Load extends Component {
    
    @property(ProgressBar)
    progressBar: ProgressBar = null;

    start() {

        new CM(CM.CH_ZJ);
       // new CM(CM.CH_WEIXIN);

        new LoaderManeger();
        CM.mainCH.login(() => {
            CM.mainCH.initData(); 
        });
        // // this.net.init();
        // // this.i18n.init();
        // // this.subGame.init();
        // // this.platform.init();
        // // App.user.init();
        // // this.audio.init(canvas);
        // // this.view.init(canvas);
        // // LevelConfig.setCurLevel(1);
        // // App.gameCtr.curLevel = LevelConfig.getCurLevel();
        // //StorageHelper.initData();
         this.loadSubPackages();
    
    }

    /**
     * 加载分包
     * 从渠道角度考虑，使用CM的loadSubPackages方法
     */
    loadSubPackages() {
        // 分包名称列表，根据实际项目需求修改
        const subPackages = ['resources'];
        
        // 依次加载分包
        let loadedCount = 0;
        const totalCount = subPackages.length;
        
        const loadNext = () => {
            if (loadedCount >= totalCount) {
                // 所有分包加载完成
                console.log('All subPackages loaded successfully');
                this.onSubPackagesLoaded();
                return;
            }
            
            const currentPackage = subPackages[loadedCount];
            console.log(`Loading subPackage: ${currentPackage}`);
            
            CM.loadSubPackages(currentPackage, 
                (success, error) => {
                    if (success) {
                        console.log(`SubPackage ${currentPackage} loaded successfully`);
                        loadedCount++;
                        // 更新进度
                        this.updateProgress(loadedCount / totalCount);
                        // 加载下一个分包
                        loadNext();
                    } else {
                        console.error(`Failed to load subPackage ${currentPackage}:`, error);
                        // 即使失败也继续加载下一个分包
                        loadedCount++;
                        this.updateProgress(loadedCount / totalCount);
                        loadNext();
                    }
                },
                (progress, totalBytesWritten, totalBytesExpectedToWrite) => {
                    // 单个分包的加载进度
                    const currentProgress = (loadedCount + progress) / totalCount;
                    this.updateProgress(currentProgress);
                }
            );
        };
        
        // 开始加载第一个分包
        loadNext();
    }

    /**
     * 更新加载进度
     * @param progress 进度值 (0-1)
     */
    updateProgress(progress: number) {
        if (this.progressBar) {
            this.progressBar.progress = progress;
        }
        console.log(`Loading progress: ${Math.round(progress * 100)}%`);
    }

    /**
     * 分包加载完成后的回调
     */
    onSubPackagesLoaded() {
        // 使用App结构跳转到游戏场景
        if (GameData.isNewPlayer()==0) {
            console.log("新玩家");
            GameData.setCurLevel(1);
            App.GoGame();
        } else {
            console.log("旧玩家");
            App.backStart();
        }
    }

}


