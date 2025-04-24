// config_loader.js
import { DYNASTY_ORDER } from './constants.js';

export class ConfigLoader {
    constructor(configDir = 'configs') {
        this.configDir = configDir;
        this.currentDynasty = 'xianqin'; // 默认设置为先秦
        this.currentLevelId = 1;
        this.levelsData = {};
        this.words = [];
        this._initialized = false;
    }

    async initialize() {
        try {
            console.log('开始初始化ConfigLoader...');
            await Promise.all([
                this.loadCommonWords(),
                this.loadLevelsData()
            ]);
            this._initialized = true;
            console.log('ConfigLoader初始化完成');
        } catch (error) {
            console.error('ConfigLoader初始化失败:', error);
            throw error;
        }
    }

    async loadCommonWords() {
        try {
            const response = await fetch('3500word.txt');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const content = await response.text();
            this.words = Array.from(content).filter(char => char.trim() && !char.match(/\s/));
            console.log('成功加载常用字库，共', this.words.length, '个字');
        } catch (error) {
            console.error('加载常用字库出错:', error);
            this.words = [];
            throw error;
        }
    }

    async loadLevelsData(dynasty = null) {
        try {
            const targetDynasty = dynasty || this.currentDynasty;
            const response = await fetch(`${this.configDir}/${targetDynasty}.csv`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            const levelsData = this.parseCsv(csvText);
            
            if (dynasty) {
                return levelsData;
            } else {
                this.levelsData = levelsData;
                console.log(`成功加载朝代 ${targetDynasty} 的关卡数据，共${Object.keys(levelsData).length}关`);
            }
        } catch (error) {
            console.error(`加载朝代 ${dynasty || this.currentDynasty} 的关卡数据失败:`, error);
            if (dynasty) {
                return {};
            } else {
                this.levelsData = {};
            }
            throw error;
        }
    }

    // 获取指定朝代的所有关卡数据
    async getLevelsData(dynasty = null) {
        if (!this._initialized && !dynasty) {
            await this.initialize();
        }
        if (dynasty) {
            return await this.loadLevelsData(dynasty);
        }
        return this.levelsData;
    }

    parseCsv(csvText) {
        try {
            console.log("开始解析CSV数据...");
            const lines = csvText.split('\n');
            if (lines.length < 2) {
                throw new Error('CSV文件格式错误：至少需要标题行和一行数据');
            }

            // 解析标题行
            const headers = lines[0].trim().split(',').map(h => h.trim());
            console.log("CSV标题:", headers);

            // 初始化结果对象
            const levelsData = {};

            // 处理每一行数据
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;  // 跳过空行

                const values = line.split(',').map(v => v.trim());
                if (values.length !== headers.length) {
                    console.warn(`第${i + 1}行的列数与标题不匹配，跳过此行`);
                    continue;
                }

                try {
                    // 创建关卡数据对象
                    const levelData = {};
                    headers.forEach((header, index) => {
                        let value = values[index];
                        
                        // 特殊字段处理
                        if (header === 'id' || header === 'clicktimes' || header === 'errortext') {
                            value = parseInt(value, 10);
                            if (isNaN(value)) {
                                throw new Error(`${header}字段必须是数字`);
                            }
                        } else if (header === 'wenzitext') {
                            // 过滤掉零宽字符和空白字符
                            value = value.split('').filter(char => 
                                char.trim() && 
                                char !== '\u200b' && 
                                !char.match(/\s/)
                            ).join('');
                        }
                        
                        levelData[header] = value;
                    });

                    // 确保必要的字段存在
                    levelData.tips1 = levelData.tips1 || '';
                    levelData.tips2 = levelData.tips2 || '';
                    levelData.dynasty = this.currentDynasty;

                    // 存储关卡数据
                    levelsData[levelData.id] = levelData;
                    console.log(`成功解析第${i}行数据，关卡ID: ${levelData.id}`);

                } catch (error) {
                    console.error(`解析第${i + 1}行时出错:`, error);
                    continue;
                }
            }

            console.log(`CSV解析完成，共解析${Object.keys(levelsData).length}个关卡`);
            return levelsData;

        } catch (error) {
            console.error("CSV解析失败:", error);
            return {};
        }
    }

    async setCurrentDynasty(dynasty) {
        if (!DYNASTY_ORDER.some(([d]) => d === dynasty)) {
            throw new Error(`无效的朝代: ${dynasty}`);
        }
        console.log(`设置当前朝代: ${dynasty}`);
        this.currentDynasty = dynasty;
        await this.loadLevelsData();
    }

    async generateAllText(levelId) {
        console.log("----- ConfigLoader.generateAllText() 开始 -----");
        
        // 确保已初始化
        if (!this._initialized) {
            console.log("ConfigLoader尚未初始化，正在初始化...");
            await this.initialize();
        }

        // 确保关卡数据存在
        const levelData = this.levelsData[levelId];
        if (!levelData) {
            console.error(`找不到关卡 ${levelId} 的数据`);
            return [];
        }
        console.log("关卡数据:", levelData);

        // 确保常用字库已加载
        if (!this.words || this.words.length === 0) {
            console.error("常用字库未加载");
            await this.loadCommonWords();
        }
        console.log("常用字库大小:", this.words.length);

        // 获取正确文字列表
        const wenzitext = levelData.wenzitext;
        if (!wenzitext) {
            console.error("关卡文字数据为空");
            return [];
        }

        const correctTexts = Array.from(wenzitext).filter(char => 
            char.trim() && !char.match(/\s/) && char !== '\u200b'
        );
        console.log("正确文字:", correctTexts);

        // 获取干扰文字数量
        const errorCount = parseInt(levelData.errortext);
        if (isNaN(errorCount)) {
            console.error("干扰文字数量无效");
            return correctTexts;
        }
        console.log("需要的干扰文字数量:", errorCount);

        // 从常用字库中抽取干扰文字
        const availableWords = this.words.filter(w => !correctTexts.includes(w));
        const actualErrorCount = Math.min(errorCount, availableWords.length);
        const errorTexts = this.getRandomElements(availableWords, actualErrorCount);
        console.log("选择的干扰文字:", errorTexts);

        // 合并并打乱所有文字
        const allText = [...correctTexts, ...errorTexts];
        this.shuffleArray(allText);

        console.log("最终文字列表:", {
            total: allText.length,
            correctCount: correctTexts.length,
            errorCount: errorTexts.length,
            texts: allText
        });

        console.log("----- ConfigLoader.generateAllText() 完成 -----");
        return allText;
    }

    getRandomElements(array, count) {
        if (!array || array.length === 0) {
            console.error("源数组为空");
            return [];
        }
        if (count <= 0) {
            console.warn("请求的元素数量小于等于0");
            return [];
        }
        const shuffled = [...array];
        this.shuffleArray(shuffled);
        return shuffled.slice(0, count);
    }

    shuffleArray(array) {
        if (!array || array.length <= 1) return;
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    getLevelData(levelId) {
        // 确保 levelId 是字符串格式
        const levelIdStr = levelId.toString();
        return this.levelsData[levelIdStr];
    }

    getHint(levelId, hintKey) {
        const levelData = this.levelsData[levelId];
        if (levelData && hintKey in levelData) {
            return levelData[hintKey];
        }
        return null;
    }

    // 获取当前朝代的中文名称
    getCurrentDynastyName() {
        const dynastyInfo = DYNASTY_ORDER.find(([d]) => d === this.currentDynasty);
        return dynastyInfo ? dynastyInfo[1] : '未知';
    }

    // 获取下一个朝代
    async getNextDynasty() {
        const currentIndex = DYNASTY_ORDER.findIndex(([d]) => d === this.currentDynasty);
        if (currentIndex === -1 || currentIndex === DYNASTY_ORDER.length - 1) {
            return null;
        }
        return DYNASTY_ORDER[currentIndex + 1][0];
    }

    async getNextLevel() {
        const levelsData = await this.getLevelsData();
        if (!levelsData || Object.keys(levelsData).length === 0) {
            console.error('没有关卡数据');
            return null;
        }
        
        const levelIds = Object.keys(levelsData).map(Number).sort((a, b) => a - b);
        const currentIndex = levelIds.indexOf(this.currentLevelId);
        
        if (currentIndex === -1 || currentIndex === levelIds.length - 1) {
            console.log('已经是最后一关');
            return null;
        }
        
        return levelIds[currentIndex + 1];
    }

    // 检查初始化状态
    isInitialized() {
        return this._initialized;
    }

    // 获取当前关卡总数
    getLevelCount() {
        return Object.keys(this.levelsData).length;
    }

    // 获取当前关卡ID
    getCurrentLevelId() {
        return this.currentLevelId;
    }

    // 设置当前关卡ID
    setCurrentLevelId(levelId) {
        if (!this.levelsData[levelId]) {
            throw new Error(`无效的关卡ID: ${levelId}`);
        }
        this.currentLevelId = levelId;
    }

    getScoreRule(textLength) {
        // 根据文本长度返回得分规则
        const baseScore = {
            correct: [10, 10, 10, 10],  // 默认每个正确选择得10分
            wrong: -5  // 默认每个错误选择扣5分
        };

        // 如果文本长度大于默认规则长度，扩展得分数组
        if (textLength > baseScore.correct.length) {
            const extraScores = new Array(textLength - baseScore.correct.length).fill(10);
            baseScore.correct = baseScore.correct.concat(extraScores);
        }

        return baseScore;
    }
} 