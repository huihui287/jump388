import { _decorator, Component, Node, Vec3, UITransform, Label } from 'cc';
import { App } from '../../Controller/app';
import { ToolsHelper } from '../../Tools/toolsHelper';
import { GridType } from '../../Tools/enumConst';
import EventManager from '../../Common/view/EventManager';
import { EventName } from '../../Tools/eventName';
import { LevelConfig } from '../../Tools/levelConfig';
import GameData from '../../Common/GameData';

const { ccclass, property } = _decorator;

@ccclass('gridDownCmpt')
export class gridDownCmpt extends Component {

    /** 水果方块类型：用于标识不同种类的水果方块 */
    public type: GridType = GridType.KIWIFRUIT;
    /** 血量：用于标识水果方块的生命值 */
    public health: number = 1;
    /** 最大血量：水果方块的初始最大血量 */
    public maxHealth: number = 1;
    /** 虚拟血量：用于被选中时扣除 */
    public virtualHealth: number = 5;

    private healthBl: Label = null;

    private ArmorPlating: Node = null;
    /**
     * 增加血量
     * @param amount 增加的血量值
     */
    public addHealth(amount: number): void {
        this.health += amount;
        this.updateHealthDisplay();
        this.upArmorPlating();
    }

    showDamageAm() {

    }
    /**
     * 受到伤害
     * @param damage 受到的伤害值
     * @returns 是否可以被回收（血量小于等于0）
     */
    public takeDamage(damage: number,callback:()=>void) {
        this.health -= damage;
        this.updateHealthDisplay();
        this.upArmorPlating();
        if (this.health <= 0) {
            callback();
        }
   
    }
    
    /**
     * 组件加载时调用
     */
    onLoad(): void {
        // 初始化healthBl引用
        this.healthBl = this.node.getChildByName('healthBl')?.getComponent(Label);
        this.ArmorPlating = this.node.getChildByName('ArmorPlating');
        this.ArmorPlating.active = true;
    }

    /**
     * 根据当前等级设置血量
     * @param level 等级
     * @param baseHealth 基础血量
     * @param levelCoefficient 等级系数
     * @returns 计算后的血量（整数）
     */
    public setHealthByLevel(level: number = GameData.getCurLevel(), baseHealth: number = 1, levelCoefficient: number = 0.5): void {
        // 计算血量：基础血量 + (等级-1) * 系数，结果取整
        const calculatedHealth = Math.round(baseHealth + ((level-1) * levelCoefficient));
        // 确保血量至少为基础血量
        const maxHealth = Math.max(baseHealth, calculatedHealth);
        // 在 baseHealth 和 maxHealth 之间取随机整数
        const finalHealth = Math.floor(Math.random() * (maxHealth - baseHealth + 1)) + baseHealth;
        
        this.setHealth(finalHealth);
        this.virtualHealth = finalHealth;

      //    this.setHealth(1);
    }

    /**
     * 初始化水果方块数据
     * @param type 水果方块类型
     */
    public initData(type: GridType = GridType.KIWIFRUIT): void {
        this.type = type;
        // 根据当前等级设置血量
        this.setHealthByLevel();
        this.virtualHealth = this.health;
        
        this._showIconByType(this.type);
        // 初始化血量显示
        this.updateHealthDisplay();
        this.upArmorPlating();
    }
    
    /**
     * 组件禁用时调用
     */
    onDisable(): void {
        this.type = GridType.KIWIFRUIT;

        // 清除所有定时器，避免内存泄漏
        this.unscheduleAllCallbacks();
    }
    
    setHealth(health: number) {
        this.health = health;
        // 确保 maxHealth 至少为当前血量（用于初始化时设置最大血量）
        if (health > this.maxHealth) {
            this.maxHealth = health;
        }
        this.updateHealthDisplay();
        this.upArmorPlating();
    }
    /**
     * 显示位置信息（预留方法）
     */
    showPos(): void {
        // 预留方法，用于调试或显示位置信息
    }

    /**
     * 判断位置是否在水果方块内
     * @param pos 位置坐标
     * @returns 是否在水果方块内
     */
    isInside(pos: Vec3): boolean {
        const transform = this.node.getComponent(UITransform);
        if (!transform) return false;
        
        const width = transform.width;
        const curPos = this.node.position;
        
        return Math.abs(pos.x - curPos.x) <= width / 2 && Math.abs(pos.y - curPos.y) <= width / 2;
    }

    /**
     * 获取移动状态
     * @returns 移动状态，当前始终返回false
     */
    getMoveState(): boolean {
        return false;
    }

    /**
     * 设置水果方块类型
     * @param type 水果方块类型
     */
    setType(type: GridType): void {
        if (!this.isValid) return;
        
        this.type = type;
        this._showIconByType(type);
    }

    /**
     * 显示提示
     */
    async showTips(): Promise<void> {
        const selectedNode = this.node.getChildByName("selected");
        if (selectedNode) {
            selectedNode.active = true;
            await ToolsHelper.delayTime(2);
            if (this.isValid) {
                selectedNode.active = false;
            }
        }
    }

    protected upArmorPlating(): void {
        if (this.ArmorPlating) {
            let children = this.ArmorPlating.children;
            if (children.length < 2) return; // 确保至少有两个子节点

            // 获取当前血量
            let currentHealth = this.health;
            
            // 获取该水果同类型grid的一次攻击伤害
            let attackDamage = 1; // 默认攻击伤害
            // 从GameData中获取对应类型的攻击等级，计算实际攻击伤害
            const gridTypeTemp = 'LVAttack' + this.type;
            const attackLevel = GameData.loadData(gridTypeTemp, 1);
            attackDamage = attackLevel; // 假设攻击等级直接对应攻击伤害

            // 核心逻辑：当血量小于等于攻击等级时，隐藏所有甲片
            if (currentHealth <= attackDamage) {
                // 血量小于等于攻击等级：隐藏所有甲片
                children[0].active = false;
                children[1].active = false;
            } else {
                // 血量大于攻击等级：根据血量比例显示对应甲片
                // 直接使用当前血量和最大血量计算比例
                let maxHealth = this.maxHealth;
                
                // 计算当前血量比例
                let ratio = maxHealth > 0 ? currentHealth / maxHealth : 0;

                if (ratio > 0.5) {
                    // 大于50%：显示第二个子节点，隐藏第一个
                    children[0].active = false;
                    children[1].active = true;
                } else {
                    // 小于等于50%：显示第一个子节点，隐藏第二个
                    children[0].active = true;
                    children[1].active = false;
                }
            }
        }
    }
    /**
     * 更新血量显示
     */
    private updateHealthDisplay(): void {
        if (this.healthBl) {
            // 2026-01-22: 用户需求，同时显示血量数值
        //    this.healthBl.node.active = true;
        //     this.healthBl.string = this.health.toString();
        }
    }

    /**
     * 重置水果方块状态
     */
    public reset(): void {
        this.type = GridType.KIWIFRUIT;
        this.setHealth(1);
        this.maxHealth = 1; // 重置最大血量
        this.virtualHealth = this.health;

        // 清除所有定时器，避免内存泄漏
        this.unscheduleAllCallbacks();
        // 隐藏所有图标
        const iconNode = this.node.getChildByName('icon');
        if (iconNode) {
            iconNode.children.forEach(item => {
                item.active = false;
            });
        }
        
        // 隐藏标签和勾
        const uiElements = ['lb', 'ok', 'gou', 'selected'];
        uiElements.forEach(name => {
            const node = this.node.getChildByName(name);
            if (node) {
                node.active = false;
            }
        });

    }

    /**
     * 根据类型显示对应的图标
     * @param type 水果方块类型
     */
    private _showIconByType(type: GridType): void {
        const iconNode = this.node.getChildByName('icon');
        if (!iconNode) return;
        
        iconNode.children.forEach(item => {
            item.active = false;
            if (item.name === `Match${type}` || item.name === `${type}`) {
                item.active = true;
            }
        });
    }

    
}
