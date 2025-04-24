// data_storage.js
import { ConfigLoader } from './config_loader.js';
import { DYNASTY_ORDER } from './constants.js';

export class DataStorage {
    constructor() {
        console.log("----- DataStorage 构造函数开始 -----");
        
        // 初始化配置加载器
        this.config_loader = new ConfigLoader();
        
        // localStorage 键名
        this.STORAGE_KEYS = {
            GAME_STATE: 'game_state',
            UNLOCKED_LEVELS: 'unlocked_levels',
            LEVEL_SCORES: 'level_scores',
            CURRENT_DYNASTY: 'current_dynasty'
        };
        
        // 初始化数据结构
        this.unlocked_levels = {'xianqin': [1]};  // 默认解锁先秦第一关
        this.level_scores = {
            "xianqin": {},
            "han": {},
            "sanguo": {},
            "tang": {},
            "song": {},
            "yuan": {},
            "ming": {},
            "qing": {}
        };
        this.current_dynasty = 'xianqin';
        
        // 绑定方法到实例
        this.saveProgress = this.saveProgress.bind(this);
        
        console.log("----- DataStorage 构造函数完成 -----");
    }

    async initialize() {
        console.log('----- 初始化数据存储开始 -----');
        try {
            // 从 localStorage 加载数据
            this._loadFromLocalStorage();
            
            // 确保 unlocked_levels 不为 null
            if (!this.unlocked_levels) {
                this.unlocked_levels = {'xianqin': [1]};
            }
            
            // 确保每个朝代都有初始化的数组
            const dynasties = ['xianqin', 'han', 'sanguo', 'tang', 'song', 'yuan', 'ming', 'qing'];
            for (const dynasty of dynasties) {
                if (!this.unlocked_levels[dynasty]) {
                    this.unlocked_levels[dynasty] = [];
                }
            }
            
            console.log('----- 数据存储初始化完成 -----');
            return true;
        } catch (error) {
            console.error('初始化数据存储时出错:', error);
            return false;
        }
    }

    _loadFromLocalStorage() {
        // 加载游戏状态
        const gameState = localStorage.getItem(this.STORAGE_KEYS.GAME_STATE);
        const parsedGameState = gameState ? JSON.parse(gameState) : null;
        console.log('从 localStorage 加载的游戏状态:', parsedGameState);

        // 加载解锁关卡数据
        const unlockedLevels = localStorage.getItem(this.STORAGE_KEYS.UNLOCKED_LEVELS);
        let parsedUnlockedLevels = unlockedLevels ? JSON.parse(unlockedLevels) : {'xianqin': [1]};
        
        // 将 weijin 转换为 sanguo
        if (parsedUnlockedLevels['weijin']) {
            parsedUnlockedLevels['sanguo'] = parsedUnlockedLevels['weijin'];
            delete parsedUnlockedLevels['weijin'];
        }
        this.unlocked_levels = parsedUnlockedLevels;

            // 加载分数数据
        const levelScores = localStorage.getItem(this.STORAGE_KEYS.LEVEL_SCORES);
        let parsedLevelScores = levelScores ? JSON.parse(levelScores) : {
                    "xianqin": {},
                    "han": {},
            "sanguo": {},
                    "tang": {},
                    "song": {},
            "yuan": {},
            "ming": {},
            "qing": {}
        };
        
        // 将 weijin 转换为 sanguo
        if (parsedLevelScores['weijin']) {
            parsedLevelScores['sanguo'] = parsedLevelScores['weijin'];
            delete parsedLevelScores['weijin'];
        }
        this.level_scores = parsedLevelScores;

        // 加载当前朝代
        let currentDynasty = localStorage.getItem(this.STORAGE_KEYS.CURRENT_DYNASTY) || 'xianqin';
        // 将 weijin 转换为 sanguo
        if (currentDynasty === 'weijin') {
            currentDynasty = 'sanguo';
        }
        this.current_dynasty = currentDynasty;

        console.log('从 localStorage 加载的完整数据:', {
            gameState: parsedGameState,
                unlocked_levels: this.unlocked_levels,
                level_scores: this.level_scores,
            current_dynasty: this.current_dynasty
        });
    }

    // 保存关卡分数
    saveLevelScore(dynasty, levelId, score) {
        console.log(`保存关卡分数 - 朝代: ${dynasty}, 关卡: ${levelId}, 分数: ${score}`);
        
        try {
            // 获取当前分数数据
            let scores = this.level_scores;
            
            // 初始化朝代记录
            if (!scores[dynasty]) {
                scores[dynasty] = {};
            }

            // 计算星级
            let stars = 0;
            if (score >= 100) stars = 3;
            else if (score >= 80) stars = 2;
            else if (score >= 60) stars = 1;

            // 只有当新分数更高时才更新
            const levelKey = String(levelId);
            const currentScore = scores[dynasty][levelKey]?.score || 0;
            if (!scores[dynasty][levelKey] || score > currentScore) {
                scores[dynasty][levelKey] = {
                    score: score,
                    stars: stars,
                    timestamp: Date.now()
                };
                
                // 保存到 localStorage
                localStorage.setItem(this.STORAGE_KEYS.LEVEL_SCORES, JSON.stringify(scores));
                this.level_scores = scores;
                
                console.log(`成功保存分数 - ${dynasty}_${levelId}: ${score}, 星级: ${stars}`);
                return true;
            }
            
            console.log(`当前分数未超过历史最高分 - ${dynasty}_${levelId}: ${currentScore}`);
            return false;
        } catch (error) {
            console.error('保存关卡分数时出错:', error);
            return false;
        }
    }

    // 解锁关卡
    unlockLevel(dynasty, levelId) {
        console.log(`解锁关卡 - 朝代: ${dynasty}, 关卡: ${levelId}`);
        
        try {
            // 确保 unlocked_levels 是一个对象
            if (!this.unlocked_levels) {
                this.unlocked_levels = {'xianqin': [1]};
            }
            
            // 确保朝代存在
            if (!this.unlocked_levels[dynasty]) {
                this.unlocked_levels[dynasty] = [];
            }
            
            // 添加新解锁的关卡
            if (!this.unlocked_levels[dynasty].includes(levelId)) {
                this.unlocked_levels[dynasty].push(levelId);
                this.unlocked_levels[dynasty].sort((a, b) => a - b);  // 保持有序
                
                // 保存到 localStorage
                localStorage.setItem(this.STORAGE_KEYS.UNLOCKED_LEVELS, JSON.stringify(this.unlocked_levels));
                
                console.log(`成功解锁关卡 - ${dynasty} ${levelId}`);
            } else {
                console.log(`关卡已经解锁 - ${dynasty} ${levelId}`);
            }
        } catch (error) {
            console.error('解锁关卡时出错:', error);
        }
    }

    // 获取特定关卡的分数
    getLevelScore(dynasty, levelId) {
        try {
            return this.level_scores[dynasty]?.[levelId] || { score: 0, stars: 0 };
        } catch (error) {
            console.error('获取关卡分数时出错:', error);
            return { score: 0, stars: 0 };
        }
    }

    // 检查关卡是否已解锁
    isLevelUnlocked(dynasty, levelId) {
        try {
            return this.unlocked_levels[dynasty]?.includes(levelId) || false;
        } catch (error) {
            console.error('检查关卡解锁状态时出错:', error);
            return levelId === 1 && dynasty === 'xianqin';
        }
    }

    // 获取朝代已解锁的关卡
    getUnlockedLevelsForDynasty(dynasty) {
        return this.unlocked_levels[dynasty] || [];
    }

    // 保存当前朝代
    setCurrentDynasty(dynasty) {
        this.current_dynasty = dynasty;
        localStorage.setItem(this.STORAGE_KEYS.CURRENT_DYNASTY, dynasty);
    }

    // 清除所有数据
    clearAllData() {
        console.log('----- 清除所有数据开始 -----');
        try {
            // 清除 localStorage 中的所有游戏数据
            localStorage.removeItem(this.STORAGE_KEYS.UNLOCKED_LEVELS);
            localStorage.removeItem(this.STORAGE_KEYS.LEVEL_SCORES);
            localStorage.removeItem(this.STORAGE_KEYS.GAME_STATE);
            localStorage.removeItem(this.STORAGE_KEYS.CURRENT_DYNASTY);
            
            // 重置内存中的数据
            this.unlocked_levels = {'xianqin': [1]};
            this.level_scores = {};
            this.current_dynasty = 'xianqin';
            
            console.log('所有数据已清除');
        } catch (e) {
            console.error('清除数据时出错:', e);
            throw e;
        }
        console.log('----- 清除所有数据完成 -----');
    }

    saveProgress(progress) {
        console.log('保存游戏进度:', progress);
        try {
            // 如果传入了朝代信息，保存它
            if (progress.dynasty) {
                localStorage.setItem('current_dynasty', progress.dynasty);
            }
            
            // 如果传入了关卡信息，保存它
            if (progress.level) {
                localStorage.setItem('current_level', progress.level);
            }
            
            // 如果传入了分数信息，保存它
            if (progress.score !== undefined) {
                localStorage.setItem('current_score', progress.score);
            }
            
            return true;
        } catch (error) {
            console.error('保存游戏进度失败:', error);
            return false;
        }
    }

    loadScoreData() {
        console.log('----- 加载分数数据开始 -----');
        try {
            const scoreData = localStorage.getItem(this.STORAGE_KEYS.LEVEL_SCORES);
            if (!scoreData) {
                console.log('未找到分数数据，返回空对象');
                return {};
            }
            const parsedData = JSON.parse(scoreData);
            console.log('成功加载分数数据:', parsedData);
            return parsedData;
        } catch (error) {
            console.error('加载分数数据时出错:', error);
            return {};
        }
    }

    loadUnlockData() {
        console.log('----- 加载解锁数据开始 -----');
        try {
            const unlockData = localStorage.getItem(this.STORAGE_KEYS.UNLOCKED_LEVELS);
            if (!unlockData) {
                console.log('未找到解锁数据，返回空对象');
                return {};
            }
            const parsedData = JSON.parse(unlockData);
            console.log('成功加载解锁数据:', parsedData);
            return parsedData;
        } catch (error) {
            console.error('加载解锁数据时出错:', error);
            return {};
        }
    }

    async getLevelData(levelId) {
        console.log(`获取关卡 ${levelId} 的数据`);
        try {
            // 从配置加载器获取关卡数据
            const levelData = await this.config_loader.getLevelData(this.current_dynasty, levelId);
            if (!levelData) {
                console.error(`未找到关卡 ${levelId} 的数据`);
                return null;
            }
            return levelData;
        } catch (error) {
            console.error(`获取关卡数据时出错: ${error}`);
            return null;
        }
    }
} 