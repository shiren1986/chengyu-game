// game_manager.js
import { DYNASTY_ORDER, GAME_CONFIG, GAME_STATES } from './constants.js';
import { AudioManager } from './audio_manager.js';
import { UIManager } from './ui_manager.js';
import { DataStorage } from './data_storage.js';
import { ConfigLoader } from './config_loader.js';
import { SettingsManager } from './settings_manager.js';
import { LevelManager } from './level_manager.js';

export class GameManager {
    constructor() {
        console.log("----- GameManager 初始化开始 -----");
        
        // 初始化各个管理器
        try {
            this.config_loader = new ConfigLoader();
            console.log("配置加载器已创建");
            
            this.data_storage = new DataStorage();
            console.log("数据存储已创建");
            
            this.audioManager = new AudioManager();
            console.log("音频管理器已创建");
            
            this.uiManager = new UIManager();
            console.log("UI管理器已创建");
            
            this.settingsManager = new SettingsManager(this);
            console.log("设置管理器已创建");
            
            this.levelManager = new LevelManager(this.uiManager);
            console.log("关卡管理器已创建");
            
            // 初始化游戏状态
            this.state = GAME_STATES.MAIN_MENU;
            this.gameState = {
                state: GAME_STATES.MAIN_MENU,
                score: 0,
                level: 1,
                attempts_left: GAME_CONFIG.MAX_ATTEMPTS,
                all_text: [],
                display_texts: [],
                wrong_indices: [],
                correct_indices: [],
                current_dynasty: 'xianqin',
                current_level_data: null
            };
            
            // 初始化其他游戏数据
            this.current_level_data = null;
            this.score = 0;
            this.attempts_left = GAME_CONFIG.MAX_ATTEMPTS;
            this.selected_texts = [];
            this.selected_indices = [];
            this.stars_earned = 0;
            
            this.all_text = [];  // 存储当前关卡的所有文字选项
            this.correct_indices = [];  // 存储正确选择的索引
            this.wrong_indices = [];  // 存储错误选择的索引
            this.display_positions = {};  // 存储正确字符的显示位置
            this.display_texts = [];  // 存储显示区域的文本
            this.correct_texts = [];  // 存储当前关卡的正确文字
            this.show_settlement_delay = 0;
            this.is_showing_settlement = false;
            
            // 设置默认朝代和关卡
            this.current_dynasty = 'xianqin';  // 默认从先秦开始
            this.level_id = 1;
            
            this.tips_click_count = 0;  // 添加提示点击计数器
            
            // 设置UI管理器的回调
            this.uiManager.setCallbacks({
                onStartGame: () => this.startNewGame(),
                onSettings: () => this.showSettings(),
                onReturnToMainMenu: () => this.returnToMainMenu(),
                onLevelSelect: (dynastyId) => this.loadLevels(dynastyId)
            });
            
            console.log("----- GameManager 初始化完成 -----");
        } catch (error) {
            console.error("初始化失败:", error);
        }
    }

    async initialize() {
        console.log("----- GameManager.initialize() 开始 -----");
        try {
            // 初始化各个管理器
            await this.data_storage.initialize();
            await this.config_loader.initialize();
            await this.audioManager.initialize();
            
            // 初始化UI管理器
            await this.uiManager.initialize(this);
            
            // 设置UI回调函数
            this.uiManager.setCallbacks({
                onStartGame: () => this.startNewGame(),
                onShowSettings: () => this.showSettings(),
                onUndo: () => this.undoLastSelection(),
                onTextClick: (index) => this.handleTextSelection(index),
                onContinue: () => this.continueGame(),
                onRestart: () => this.handleSettlementAction("restart"),
                onNextLevel: () => this.handleSettlementAction("next")
            });

            // 从 localStorage 加载游戏状态
            const gameState = localStorage.getItem(this.data_storage.STORAGE_KEYS.GAME_STATE);
            const unlockedLevels = localStorage.getItem(this.data_storage.STORAGE_KEYS.UNLOCKED_LEVELS);
            const levelScores = localStorage.getItem(this.data_storage.STORAGE_KEYS.LEVEL_SCORES);
            
            console.log('从 localStorage 读取的数据:', {
                gameState: gameState ? JSON.parse(gameState) : null,
                unlockedLevels: unlockedLevels ? JSON.parse(unlockedLevels) : null,
                levelScores: levelScores ? JSON.parse(levelScores) : null
            });

            if (unlockedLevels || levelScores) {
                // 如果有任何存档数据，使用它们
                const parsedUnlockedLevels = unlockedLevels ? JSON.parse(unlockedLevels) : {'xianqin': [1]};
                const parsedLevelScores = levelScores ? JSON.parse(levelScores) : {};
                
                // 找到玩家最后玩到的关卡
                const lastDynasty = 'xianqin';  // 目前只支持先秦
                const unlockedLevelsList = parsedUnlockedLevels[lastDynasty] || [1];
                const lastLevelId = Math.max(...unlockedLevelsList);
                
                // 设置游戏状态
                this.current_dynasty = lastDynasty;
                this.level_id = lastLevelId;
                
                // 获取最后一关的分数
                const lastLevelScore = parsedLevelScores[lastDynasty]?.[lastLevelId] || { score: 0 };
                this.score = lastLevelScore.score;
                
                console.log('恢复的游戏状态:', {
                    dynasty: this.current_dynasty,
                    level: this.level_id,
                    score: this.score,
                    unlockedLevels: unlockedLevelsList
                });
                
                // 加载当前关卡配置
                await this.config_loader.setCurrentDynasty(this.current_dynasty);
                await this.loadCurrentLevel();
            } else {
                console.log("未找到存档数据，使用默认值");
                this.resetGameState();
            }

            // 设置初始状态为主菜单
            this.state = GAME_STATES.MAIN_MENU;
            this.gameState.state = GAME_STATES.MAIN_MENU;
            
            // 更新UI
            this.updateUI();
            console.log("----- GameManager.initialize() 完成 -----");
            return true;
        } catch (error) {
            console.error("游戏管理器初始化失败:", error);
            throw error;
        }
    }

    async find_first_unlocked_level() {
        // 实现查找第一个未解锁关卡的逻辑
        try {
            for (const [dynasty, _] of DYNASTY_ORDER) {
                const unlocked_levels = this.data_storage.getUnlockedLevelsForDynasty(dynasty);
                if (!unlocked_levels || unlocked_levels.length === 0) {
                    return [dynasty, 1];
                }
                const max_level = Math.max(...unlocked_levels);
                const next_level = max_level + 1;
                const level_data = await this.config_loader.getLevelData(next_level);
                if (level_data) {
                    return [dynasty, next_level];
                }
            }
            return null;
        } catch (error) {
            console.error('查找第一个未解锁关卡时出错:', error);
            return null;
        }
    }

    updateUI() {
        if (!this.uiManager) {
            console.warn('UI管理器未初始化');
            return;
        }

        // 确保 gameState 的状态与当前状态同步
        this.gameState = {
            ...this.gameState,
            state: this.state,  // 使用当前的状态
            score: this.score,
            attempts_left: this.attempts_left,
            level: this.level_id,
            current_level_data: this.current_level_data,
            all_text: this.all_text || [],
            selected_texts: this.selected_texts || [],
            selected_indices: this.selected_indices || [],
            display_texts: this.display_texts || [],
            wrong_indices: this.wrong_indices || [],
            correct_indices: this.correct_indices || [],
            correct_texts: this.correct_texts || [],
            current_dynasty: this.current_dynasty,
            stars_earned: this.stars_earned,
            is_showing_settlement: this.is_showing_settlement
        };

        console.log('更新UI时的游戏状态:', this.gameState);

        // 更新UI
        this.uiManager.update(this.gameState);
    }

    async loadCurrentLevel() {
        console.log("----- GameManager.loadCurrentLevel() 开始 -----");
        try {
            // 确保配置加载器已设置正确的朝代
            await this.config_loader.setCurrentDynasty(this.current_dynasty);
            console.log(`当前朝代: ${this.current_dynasty}, 关卡ID: ${this.level_id}`);
            
            // 加载当前关卡数据
            this.current_level_data = await this.config_loader.getLevelData(this.level_id);
            if (!this.current_level_data) {
                console.error(`无法加载关卡数据: 朝代=${this.current_dynasty}, 关卡=${this.level_id}`);
                return false;
            }
            console.log('加载的关卡数据:', this.current_level_data);
            
            // 重置当前关卡分数
            this.score = 0;
            console.log('新关卡开始，分数重置为:', this.score);
            
            // 生成文字列表
            const allText = await this.config_loader.generateAllText(this.level_id);
            if (!allText || allText.length === 0) {
                console.error("无法生成文字列表");
                return false;
            }
            this.all_text = allText;
            console.log('生成的文字列表:', this.all_text);
            
            // 初始化显示文本
            this.correct_texts = Array.from(this.current_level_data.wenzitext).filter(char => 
                char.trim() && !char.match(/\s/) && char !== '\u200b'
            );
            this.display_texts = new Array(this.correct_texts.length).fill('');
            
            // 重置选择状态
            this.selected_texts = [];
            this.selected_indices = [];
            this.correct_indices = [];
            this.wrong_indices = [];
            
            // 重置提示状态
            this.tips_click_count = 0;
            if (this.uiManager) {
                this.uiManager.clearTips();
            }
            
            // 确保游戏状态正确
            this.state = GAME_STATES.GAME;
            
            // 更新游戏状态
            this.gameState = {
                ...this.gameState,
                state: this.state,
                all_text: this.all_text,
                display_texts: this.display_texts,
                correct_texts: this.correct_texts,
                wrong_indices: this.wrong_indices,
                correct_indices: this.correct_indices,
                current_level_data: this.current_level_data,
                level: this.level_id,
                current_dynasty: this.current_dynasty
            };
            
            console.log('初始化状态:', {
                correct_texts: this.correct_texts,
                display_texts: this.display_texts,
                all_text: this.all_text,
                gameState: this.gameState
            });
            
            // 更新UI
            this.updateUI();
            
            console.log("----- GameManager.loadCurrentLevel() 完成 -----");
            return true;
        } catch (error) {
            console.error("加载当前关卡失败:", error);
            return false;
        }
    }

    async startNewGame() {
        console.log("----- GameManager.startNewGame() 开始 -----");
        try {
            // 设置游戏状态为游戏中
            this.state = GAME_STATES.GAME;
            this.gameState.state = GAME_STATES.GAME;
            
            // 重置分数
            this.score = 0;
            console.log('新游戏开始，分数重置为:', this.score);
            
            // 如果是第一次开始游戏（没有存档数据），才重置状态
            const unlockedLevels = localStorage.getItem(this.data_storage.STORAGE_KEYS.UNLOCKED_LEVELS);
            if (!unlockedLevels) {
                console.log("首次游戏，初始化状态");
                this.resetGameState();
            } else {
                console.log("继续游戏，当前状态:", {
                    朝代: this.current_dynasty,
                    关卡: this.level_id,
                    分数: this.score
                });
            }
            
            // 加载当前关卡数据
            const success = await this.loadCurrentLevel();
            if (!success) {
                throw new Error("加载关卡数据失败");
            }
            
            // 打印当前状态
            console.log('游戏开始时的状态:', {
                state: this.state,
                current_dynasty: this.current_dynasty,
                level_id: this.level_id,
                all_text: this.all_text,
                correct_texts: this.correct_texts,
                display_texts: this.display_texts,
                gameState: this.gameState
            });
            
            // 更新UI
            this.updateUI();
            
            console.log("----- GameManager.startNewGame() 完成 -----");
        } catch (error) {
            console.error("开始新游戏时出错:", error);
            throw error;
        }
    }

    async findFirstUnlockedLevel() {
        try {
            let currentIndex = -1;
            
            // 找到当前朝代在朝代列表中的位置
            for (let i = 0; i < DYNASTY_ORDER.length; i++) {
                if (DYNASTY_ORDER[i][0] === this.current_dynasty) {
                    currentIndex = i;
                    break;
                }
            }
            
            if (currentIndex === -1) {
                console.log(`找不到当前朝代: ${this.current_dynasty}`);
                return null;
            }
            
            // 从当前朝代开始，遍历所有朝代
            for (let i = currentIndex; i < DYNASTY_ORDER.length; i++) {
                const [dynasty] = DYNASTY_ORDER[i];
                console.log(`检查朝代: ${dynasty}`);
                
                // 设置当前朝代
                await this.config_loader.setCurrentDynasty(dynasty);
                const levelsData = await this.config_loader.getLevelsData(dynasty);
                
                if (!levelsData) {
                    console.log(`朝代 ${dynasty} 没有关卡数据`);
                    continue;
                }
                
                // 遍历该朝代的所有关卡
                const levelIds = Object.keys(levelsData).sort((a, b) => Number(a) - Number(b));
                for (const levelId of levelIds) {
                    const level = [dynasty, Number(levelId)];
                    const unlockedLevels = this.data_storage.unlocked_levels[dynasty] || [];
                    if (!unlockedLevels.includes(Number(levelId))) {
                        console.log(`找到未解锁的关卡：${level}`);
                        return level;
                    }
                }
            }
            
            console.log("所有关卡都已解锁");
            return null;
            
        } catch (error) {
            console.error("查找未解锁关卡时出错:", error);
            return null;
        }
    }

    async loadLevel(levelIndex) {
        console.log(`加载关卡 ${levelIndex}`);
        try {
            // 设置当前关卡
            this.currentLevel = levelIndex;
            this.level_id = levelIndex;
            
            // 确保 config_loader 使用正确的朝代
            await this.config_loader.setCurrentDynasty(this.current_dynasty);
            
            // 加载关卡数据
            this.current_level_data = await this.config_loader.getLevelData(levelIndex);
            if (!this.current_level_data) {
                console.error(`无法加载关卡 ${levelIndex} 的数据`);
                return;
            }
            
            // 重置游戏状态
            this.attemptsLeft = this.current_level_data.clicktimes || GAME_CONFIG.MAX_ATTEMPTS;
            this.score = 0;
            this.selected_texts = [];
            this.selected_indices = [];
            this.correct_indices = [];
            this.wrong_indices = [];
            
            // 生成所有文字
            this.all_text = await this.config_loader.generateAllText(levelIndex);
            if (!this.all_text) {
                console.error("无法生成文字列表");
                return;
            }
            
            // 初始化正确答案和显示文本
            this.correct_texts = Array.from(this.current_level_data.wenzitext).filter(char => 
                char.trim() && !char.match(/\s/) && char !== '\u200b'
            );
            this.display_texts = new Array(this.correct_texts.length).fill('');
            
            // 重置提示状态
            this.tips_click_count = 0;
            if (this.uiManager) {
                this.uiManager.clearTips();
            }
            
            // 设置完整的游戏状态
            this.state = GAME_STATES.GAME;
            this.gameState = {
                ...this.gameState,
                state: GAME_STATES.GAME,
                score: this.score,
                level: levelIndex,
                attempts_left: this.attemptsLeft,
                all_text: this.all_text,
                correct_texts: this.correct_texts,
                display_texts: this.display_texts,
                correct_indices: this.correct_indices,
                wrong_indices: this.wrong_indices,
                current_level_data: this.current_level_data,
                selected_texts: this.selected_texts,
                selected_indices: this.selected_indices,
                is_showing_settlement: false,
                current_dynasty: this.current_dynasty  // 确保游戏状态包含当前朝代
            };
            
            // 更新UI
            this.updateUI();
            
            console.log('关卡加载完成，状态:', {
                dynasty: this.current_dynasty,
                level: levelIndex,
                attempts: this.attemptsLeft,
                allText: this.all_text,
                correctTexts: this.correct_texts,
                displayTexts: this.display_texts
            });
        } catch (error) {
            console.error(`加载关卡时出错: ${error}`);
        }
    }

    checkAnswer(answer) {
        if (this.current_level_data.correctAnswer === answer) {
            this.score += GAME_CONFIG.POINTS_PER_CORRECT;
            return true;
        } else {
            this.score += GAME_CONFIG.POINTS_PER_WRONG;
            this.attemptsLeft--;
            return false;
        }
    }

    isGameOver() {
        return this.attemptsLeft <= 0;
    }

    getCurrentScore() {
        return this.score;
    }

    getCurrentLevel() {
        return this.currentLevel;
    }

    getCurrentLevelData() {
        return this.current_level_data;
    }

    getAttemptsLeft() {
        return this.attemptsLeft;
    }

    getCurrentState() {
        return this.state;
    }

    setCurrentState(state) {
        this.state = state;
        this.gameState.state = state;
        this.uiManager.current_state = state;
    }

    async loadGameState(savedState) {
        console.log('----- 开始加载游戏状态 -----');
        try {
            if (savedState) {
                const parsedState = typeof savedState === 'string' ? JSON.parse(savedState) : savedState;
                console.log('正在加载存档数据:', parsedState);
                
                // 设置朝代和关卡ID
                if (parsedState.current_dynasty && DYNASTY_ORDER.some(([dynasty]) => dynasty === parsedState.current_dynasty)) {
                    this.current_dynasty = parsedState.current_dynasty;
                    this.level_id = parsedState.level_id || 1;
                    this.score = parsedState.score || 0;
                    this.attempts_left = parsedState.attempts_left || GAME_CONFIG.MAX_ATTEMPTS;
                    
                    // 更新游戏状态
                    this.gameState = {
                        ...this.gameState,
                        state: GAME_STATES.MAIN_MENU,
                        current_dynasty: this.current_dynasty,
                        level: this.level_id,
                        score: this.score,
                        attempts_left: this.attempts_left
                    };
                    
                    // 如果有已解锁的关卡信息，也加载它
                    if (parsedState.unlocked_levels) {
                        this.data_storage.unlocked_levels = parsedState.unlocked_levels;
                    }
                    
                    console.log('游戏状态已更新:', {
                        current_dynasty: this.current_dynasty,
                        level_id: this.level_id,
                        score: this.score,
                        attemptsLeft: this.attempts_left,
                        gameState: this.gameState
                    });
                    
                    return true;
                } else {
                    console.log('无效的朝代:', parsedState.current_dynasty);
                }
            } else {
                console.log('没有找到存档数据，使用默认值');
                this.resetGameState();
            }
            return false;
        } catch (error) {
            console.error("加载游戏状态时出错:", error);
            this.resetGameState();
            return false;
        } finally {
            console.log('----- 游戏状态加载完成 -----');
        }
    }

    saveGameState() {
        console.log('----- 开始保存游戏状态 -----');
        const state = {
            current_dynasty: this.current_dynasty,
            level_id: this.level_id,
            score: this.score,
            attempts_left: this.attemptsLeft,
            unlocked_levels: this.data_storage.unlocked_levels
        };
        
        // 保存到 localStorage
        localStorage.setItem(this.data_storage.STORAGE_KEYS.GAME_STATE, JSON.stringify(state));
        
        console.log('保存的游戏状态:', state);
        console.log('----- 游戏状态保存完成 -----');
        return state;
    }

    showSettlementScreen() {
        console.log("\n===== 显示结算界面 =====");
        console.log(`当前朝代: ${this.current_dynasty}`);
        console.log(`当前关卡: ${this.level_id}`);
        console.log(`当前得分: ${this.score}`);

        // 设置游戏状态为结算状态
        this.state = GAME_STATES.SETTLEMENT;

        // 检查 data_storage 是否已初始化
        if (!this.data_storage) {
            console.error("数据存储未初始化");
            return;
        }

        try {
            // 1. 保存关卡分数
            this.data_storage.saveLevelScore(this.current_dynasty, this.level_id, this.score);

            // 2. 如果得分达到60分，解锁下一关
            if (this.score >= 60) {
                console.log("得分达到60分，准备解锁下一关");
                const nextLevel = this.level_id + 1;
                this.data_storage.unlockLevel(this.current_dynasty, nextLevel);
            }

            // 设置结算界面显示状态
            this.is_showing_settlement = true;
            this.show_settlement_delay = Date.now();

            // 更新UI
            this.updateUI();
        } catch (error) {
            console.error("显示结算界面时出错:", error);
        }
    }

    handleSettlementAction(action) {
        console.log("\n===== 处理结算界面动作 =====");
        console.log(`动作类型: ${action}`);

        if (action === "restart") {
            // 重新开始当前关卡
            console.log("重新开始当前关卡");
            this.resetCurrentLevel();
            this.is_showing_settlement = false;
            this.state = GAME_STATES.GAME;  // 设置状态为游戏中
            this.updateUI();
        } else if (action === "next") {
            // 进入下一关
            console.log("准备进入下一关");
            if (this.score >= 60) {
                this.level_id++;
                // 重置分数
                this.score = 0;
                console.log('进入下一关，分数重置为:', this.score);
                this.loadCurrentLevel();
                this.is_showing_settlement = false;
                this.state = GAME_STATES.GAME;  // 设置状态为游戏中
                this.updateUI();
            }
        }
    }

    resetCurrentLevel() {
        console.log("\n===== 重置当前关卡 =====");
        
        // 重置选择状态
        this.selected_texts = [];
        this.selected_indices = [];
        this.correct_indices = [];
        this.wrong_indices = [];
        this.display_texts = new Array(this.correct_texts.length).fill('');
        
        // 重置分数和尝试次数
        this.score = 0;  // 每关独立计算分数
        this.attempts_left = this.current_level_data?.clicktimes || GAME_CONFIG.MAX_ATTEMPTS;
        
        // 重置提示状态
        this.tips_click_count = 0;
        if (this.uiManager) {
            this.uiManager.clearTips();
        }
        
        // 重置结算界面状态
        this.is_showing_settlement = false;
        this.show_settlement_delay = 0;
        
        // 设置游戏状态为游戏中
        this.state = GAME_STATES.GAME;
        
        // 更新游戏状态
        this.gameState = {
            ...this.gameState,
            state: this.state,
            score: this.score,
            attempts_left: this.attempts_left,
            selected_texts: this.selected_texts,
            selected_indices: this.selected_indices,
            correct_indices: this.correct_indices,
            wrong_indices: this.wrong_indices,
            display_texts: this.display_texts,
            is_showing_settlement: this.is_showing_settlement
        };
        
        // 更新UI
        this.updateUI();
        
        console.log("当前关卡已重置，状态:", this.gameState);
    }

    calculateStars() {
        if (!this.isLevelComplete()) {
            return 0;
        }
        
        // 根据剩余尝试次数计算星级
        if (this.attemptsLeft === GAME_CONFIG.MAX_ATTEMPTS) {
            return 3;
        } else if (this.attemptsLeft === GAME_CONFIG.MAX_ATTEMPTS - 1) {
            return 2;
        } else {
            return 1;
        }
    }

    updateDisplay() {
        // TODO: 更新UI显示
        // 这个方法需要在实现UI管理器后完成
    }

    canUndo() {
        // 如果有错误选择，则可以撤销
        return this.gameState.wrong_indices && this.gameState.wrong_indices.length > 0;
    }

    undoLastMove() {
        if (!this.canUndo()) {
            return;
        }

        // 获取最后一个错误选择的索引
        const lastWrongIndex = this.gameState.wrong_indices[this.gameState.wrong_indices.length - 1];

        // 从错误选择列表中移除
        this.gameState.wrong_indices.pop();

        // 从已选择的文字列表中也移除
        const selectedIndex = this.selected_texts.lastIndexOf(this.all_text[lastWrongIndex]);
        if (selectedIndex !== -1) {
            this.selected_texts.splice(selectedIndex, 1);
            this.selected_indices.splice(selectedIndex, 1);
        }

        // 恢复一次尝试机会
        this.attempts_left++;

        // 更新分数（如果之前扣分了的话）
        if (this.score < this.initial_score) {
            this.score += 10; // 恢复扣除的分数
        }

        console.log('撤销操作完成:', {
            removedIndex: lastWrongIndex,
            remainingAttempts: this.attempts_left,
            currentScore: this.score,
            wrongIndices: this.wrong_indices,
            selectedTexts: this.selected_texts
        });

        // 更新UI
        this.updateUI();
    }

    isLevelComplete() {
        return this.selected_texts.length === this.correct_texts.length &&
               this.selected_texts.every((text, index) => text === this.correct_texts[index]);
    }

    handleTextSelection(index) {
        console.log("\n===== 处理文字选择 =====");
        console.log("选择的文字索引:", index);
        
        // 检查游戏状态
        if (this.state !== GAME_STATES.GAME || this.is_showing_settlement) {
            console.log("游戏未在进行中或正在显示结算界面");
            return;
        }

        // 检查是否还有剩余尝试次数
        if (this.attempts_left <= 0) {
            console.log("没有剩余尝试次数");
            return;
        }

        // 检查文字是否已被选择
        if (this.correct_indices.includes(index) || this.wrong_indices.includes(index)) {
            console.log("该文字已被选择过");
            return;
        }

        const selectedText = this.all_text[index];
        console.log("选择的文字:", selectedText);

        // 检查是否是正确的文字
        if (this.correct_texts.includes(selectedText)) {
            // 找到这个文字在正确答案中的下一个可用位置
            let foundPosition = false;
            let originalIndex = -1;
            
            for (let i = 0; i < this.correct_texts.length; i++) {
                if (this.correct_texts[i] === selectedText && !this.display_texts[i]) {
                    originalIndex = i;
                    foundPosition = true;
                    break;
                }
            }
            
            if (foundPosition) {
                // 选择正确
                console.log("选择正确，位置:", originalIndex);
                this.correct_indices.push(index);
                this.display_texts[originalIndex] = selectedText;
                this.selected_texts.push(selectedText);
                this.selected_indices.push(index);
                
                // 计算得分 - 根据Python版本的计分规则
                const textLength = this.correct_texts.length;
                
                // 计算每个位置的基础分值
                const baseScore = Math.floor(100 / textLength);  // 基础分
                const remainder = 100 % textLength;  // 余数
                
                // 如果当前位置在前remainder个位置，得分加1
                let positionScore = baseScore;
                if (originalIndex < remainder) {
                    positionScore += 1;
                }
                
                // 更新分数，但限制最高分为100
                this.score = Math.min(100, Math.max(0, this.score + positionScore));
                console.log(`正确选择得分：基础分 ${positionScore}分，当前总分: ${this.score}（最高100分）`);
                
                // 检查是否完成关卡
                if (this.display_texts.every(text => text !== '')) {
                    console.log("关卡完成");
                    this.showSettlementScreen();
                }
            } else {
                console.log("该文字已被全部使用");
                this.wrong_indices.push(index);
                this.attempts_left--;
                
                // 根据字数确定扣分值
                let penalty;
                if (this.correct_texts.length <= 2) {
                    penalty = 15;  // 1-2字
                } else if (this.correct_texts.length <= 4) {
                    penalty = 20;  // 3-4字
                } else if (this.correct_texts.length <= 6) {
                    penalty = 25;  // 5-6字
                } else {
                    penalty = 30;  // 7字以上
                }
                
                this.score = Math.max(0, this.score - penalty);
                console.log(`错误使用正确字，扣${penalty}分，当前总分: ${this.score}`);
            }
        } else {
            // 选择错误
            console.log("选择错误");
            this.wrong_indices.push(index);
            this.attempts_left--;
            
            // 根据字数确定扣分值
            let penalty;
            if (this.correct_texts.length <= 2) {
                penalty = 15;  // 1-2字
            } else if (this.correct_texts.length <= 4) {
                penalty = 20;  // 3-4字
            } else if (this.correct_texts.length <= 6) {
                penalty = 25;  // 5-6字
            } else {
                penalty = 30;  // 7字以上
            }
            
            this.score = Math.max(0, this.score - penalty);
            console.log(`选择错误字，扣${penalty}分，当前总分: ${this.score}`);
            
            // 检查是否还有剩余尝试次数
            if (this.attempts_left <= 0) {
                console.log("尝试次数用完");
                this.showSettlementScreen();
            }
        }

        // 更新游戏状态
        this.updateUI();
        console.log("===== 文字选择处理完成 =====\n");
    }

    continueGame() {
        if (this.isLevelComplete()) {
            // 进入下一关
            this.level_id++;
            this.loadCurrentLevel();
        } else {
            // 重试当前关卡
            this.resetCurrentLevel();
        }
        this.state = GAME_STATES.GAME;
        this.updateUI();
    }

    showSettings() {
        this.state = GAME_STATES.SETTINGS;
        this.updateUI();
    }

    // 重置游戏状态
    resetGameState() {
        console.log("----- GameManager.resetGameState() 开始 -----");
        try {
            // 重置游戏状态
            this.current_level_data = null;
            this.score = 0;
            this.attempts_left = GAME_CONFIG.MAX_ATTEMPTS;
            this.selected_texts = [];
            this.selected_indices = [];
            this.stars_earned = 0;
            
            // 重置游戏数据
            this.all_text = [];  // 存储当前关卡的所有文字选项
            this.correct_indices = [];  // 存储正确选择的索引
            this.wrong_indices = [];  // 存储错误选择的索引
            this.display_positions = {};  // 存储正确字符的显示位置
            this.display_texts = [];  // 存储显示区域的文本
            this.correct_texts = [];  // 存储当前关卡的正确文字
            this.show_settlement_delay = 0;  // 添加延迟显示结算界面的时间戳
            this.is_showing_settlement = false;  // 添加是否正在显示结算界面的标志
            
            // 重置朝代和关卡
            this.current_dynasty = 'xianqin';  // 默认从先秦开始
            this.level_id = 1;
            
            // 设置当前朝代
            this.config_loader.setCurrentDynasty(this.current_dynasty);
            
            console.log("----- GameManager.resetGameState() 完成 -----");
            return true;
        } catch (error) {
            console.error("重置游戏状态时出错:", error);
            throw error;
        }
    }

    getGameState() {
        // 确保返回最新的游戏状态
        this.gameState = {
            ...this.gameState,
            state: this.state,
            score: this.score,
            attempts_left: this.attempts_left,
            level: this.level_id,
            current_level_data: this.current_level_data,
            all_text: this.all_text || [],
            selected_texts: this.selected_texts || [],
            selected_indices: this.selected_indices || [],
            display_texts: this.display_texts || [],
            wrong_indices: this.wrong_indices || [],
            correct_indices: this.correct_indices || [],
            correct_texts: this.correct_texts || [],
            current_dynasty: this.current_dynasty,
            stars_earned: this.stars_earned,
            is_showing_settlement: this.is_showing_settlement
        };

        console.log('获取游戏状态:', this.gameState);
        return this.gameState;
    }

    refreshGame() {
        console.log('刷新游戏');
        
        // 重置游戏状态
        this.gameState = {
            state: GAME_STATES.GAME,
            score: 0,
            level: this.gameState.level,
            attempts_left: this.current_level_data.clicktimes || GAME_CONFIG.MAX_ATTEMPTS,
            all_text: [],
            display_texts: [],
            wrong_indices: [],
            correct_indices: [],
            current_level_data: this.current_level_data
        };

        // 重置提示状态
        this.tips_click_count = 0;
        if (this.uiManager) {
            this.uiManager.clearTips();
        }

        // 重新加载当前关卡
        this.reload_current_level();
    }

    async reload_current_level() {
        console.log('重新加载当前关卡');
        try {
            // 获取当前关卡ID
            const current_level_id = this.current_level_data.id;
            
            // 重置得分和错误操作次数
            this.score = 0;
            this.attempts_left = this.current_level_data.clicktimes || GAME_CONFIG.MAX_ATTEMPTS;
            
            // 重新加载当前关卡配置
            this.current_level_data = await this.config_loader.getLevelData(current_level_id);
            
            // 重新生成文字列表
            this.all_text = await this.config_loader.generateAllText(current_level_id);
            if (!this.all_text) {
                console.error("无法生成文字列表");
                return;
            }
            
            // 重置所有选择状态
            this.selected_texts = [];
            this.selected_indices = [];
            this.correct_indices = [];
            this.wrong_indices = [];
            this.display_positions = {};
            
            // 重置display_texts
            const correct_texts = Array.from(this.current_level_data.wenzitext);
            this.display_texts = new Array(correct_texts.length).fill('');
            
            // 确保提示状态被重置
            this.tips_click_count = 0;
            if (this.uiManager) {
                this.uiManager.clearTips();
            }
            
            // 更新游戏状态
            this.gameState = {
                ...this.gameState,
                score: this.score,
                attempts_left: this.attempts_left,
                all_text: this.all_text,
                display_texts: this.display_texts,
                correct_texts: correct_texts,
                wrong_indices: this.wrong_indices,
                correct_indices: this.correct_indices,
                current_level_data: this.current_level_data,
                level: this.level_id,
                current_dynasty: this.current_dynasty
            };
            
            // 更新UI
            this.updateUI();
        } catch (error) {
            console.error("重新加载当前关卡失败:", error);
        }
    }

    showHint() {
        console.log('显示提示');
        
        // 获取当前关卡的提示信息
        const tips1 = this.current_level_data.tips1 || '';
        const tips2 = this.current_level_data.tips2 || '';
        
        // 增加点击计数
        this.tips_click_count++;
        
        // 根据点击次数切换提示显示状态
        if (this.tips_click_count === 1) {
            // 第一次点击，只显示提示1
            this.uiManager.show_tips1 = true;
            this.uiManager.show_tips2 = false;
            console.log('显示提示1:', tips1);
        } else if (this.tips_click_count === 2) {
            // 第二次点击，同时显示提示1和提示2
            this.uiManager.show_tips1 = true;
            this.uiManager.show_tips2 = true;
            console.log('显示提示1和提示2:', tips1, tips2);
        } else {
            // 第三次点击，隐藏所有提示
            this.uiManager.show_tips1 = false;
            this.uiManager.show_tips2 = false;
            this.tips_click_count = 0;  // 重置计数器
            console.log('隐藏所有提示');
        }
        
        // 播放音效
        this.uiManager.audio_manager.playRight();
        
        // 保持当前游戏状态
        this.gameState.state = GAME_STATES.GAME;
        
        // 更新UI
        this.updateUI();
    }

    async setCurrentDynasty(dynastyId) {
        console.log('切换朝代到:', dynastyId);
        
        // 转换朝代ID
        const convertedDynastyId = dynastyId === 'weijin' ? 'sanguo' : dynastyId;
        
        try {
            // 保存进度
            await this.data_storage.saveProgress({
                dynasty: convertedDynastyId
            });
            console.log('朝代切换进度已保存');
            
            // 加载关卡数据
            console.log('尝试加载关卡数据: configs/' + convertedDynastyId + '.csv');
            await this.levelManager.loadLevels(convertedDynastyId);
            console.log('成功加载关卡数据，共', this.levelManager.levels.length, '个关卡');
            
            // 更新游戏状态
            this.current_dynasty = convertedDynastyId;
            this.gameState = {
                ...this.gameState,
                state: GAME_STATES.LEVEL_SELECT,
                current_dynasty: convertedDynastyId,
                score: 0,
                level: 1,
                attempts_left: 3,
                all_text: [],
                display_texts: [],
                wrong_indices: [],
                correct_indices: []
            };
            this.state = GAME_STATES.LEVEL_SELECT;
            
            // 更新UI
            this.updateUI();
        } catch (error) {
            console.error('切换朝代时出错:', error);
        }
    }

    async loadLevelData() {
        console.log(`尝试加载关卡数据: configs/${this.current_dynasty}.csv`);
        try {
            const response = await fetch(`configs/${this.current_dynasty}.csv`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            
            // 解析CSV数据
            const lines = csvText.split('\n');
            const headers = lines[0].split(',');
            const levelData = {};
            
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                if (values.length === headers.length) {
                    const row = {};
                    for (let j = 0; j < headers.length; j++) {
                        row[headers[j].trim()] = values[j].trim();
                    }
                    levelData[row.id] = row;
                }
            }
            
            this.levelData = levelData;
            console.log(`成功加载关卡数据，共 ${Object.keys(levelData).length} 个关卡`);
            return true;
        } catch (error) {
                console.error('加载关卡数据失败:', error);
            // 使用默认关卡数据
            this.levelData = {
                '1': {
                    id: '1',
                    wenzitext: '默认关卡',
                    clicktimes: '3'
                }
            };
            console.log('使用默认关卡数据');
            return false;
        }
    }

    async loadLevels(dynastyId) {
        console.log(`加载朝代 ${dynastyId} 的关卡数据`);
        await this.levelManager.loadLevels(dynastyId);
        this.setCurrentState(GAME_STATES.LEVEL_SELECT);
    }

    returnToMainMenu() {
        this.setCurrentState(GAME_STATES.MAIN_MENU);
    }
} 