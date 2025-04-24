// level_manager.js
import { DataStorage } from './data_storage.js';

export class LevelManager {
    constructor(uiManager) {
        this.uiManager = uiManager;
        
        // 初始化UI资源路径
        this.uiPath = "assets/UI";
        
        // 图片加载状态跟踪
        this.imagesLoaded = {
            returnBtn: false,
            levelBg: false,
            starBlack: false,
            starWhite: false,
            lock: false
        };
        
        // 加载UI资源
        this.returnBtn = new Image();
        this.levelBg = new Image();
        this.starBlack = new Image();
        this.starWhite = new Image();
        this.lock = new Image();
        
        // 确保所有图片加载完成
        const images = [
            { img: this.returnBtn, name: 'returnBtn', src: `${this.uiPath}/return.png` },
            { img: this.levelBg, name: 'levelBg', src: `${this.uiPath}/level.png` },
            { img: this.starBlack, name: 'starBlack', src: `${this.uiPath}/star_black.png` },
            { img: this.starWhite, name: 'starWhite', src: `${this.uiPath}/star_white.png` },
            { img: this.lock, name: 'lock', src: `${this.uiPath}/lock.png` }
        ];
        
        // 加载所有图片
        images.forEach(({img, name, src}) => {
            console.log(`开始加载图片: ${name} (${src})`);
            
            img.onload = () => {
                console.log(`图片加载完成: ${name} (${src})`);
                this.imagesLoaded[name] = true;
                // 触发重绘
                if (this.uiManager && this.uiManager.update) {
                    this.uiManager.update(this.uiManager.gameManager?.gameState);
                }
            };
            
            img.onerror = (error) => {
                console.error(`图片加载失败: ${name} (${src})`, error);
                this.imagesLoaded[name] = false;
            };
            
            if (img.complete) {
                console.log(`图片已在缓存中: ${name} (${src})`);
                this.imagesLoaded[name] = true;
            }
            
            img.src = src;
        });

        // 初始化布局参数
        this.initializeLayout();
        
        // 当前选中的朝代
        this.currentDynasty = null;
        // 关卡数据
        this.levels = [];
        
        // 滑动相关属性
        this.scrollY = 0;          // 当前滚动位置
        this.maxScroll = 0;        // 最大可滚动距离
        this.isDragging = false;   // 是否正在拖动
        this.dragStartY = 0;       // 拖动开始位置
        this.lastScrollY = 0;      // 上一次的滚动位置
        
        // 添加朝代配置
        this.dynasties = [
            { id: "xianqin", name: "先秦" },
            { id: "han", name: "两汉" },
            { id: "sanguo", name: "魏晋" },
            { id: "tang", name: "隋唐" },
            { id: "song", name: "两宋" },
            { id: "mingqing", name: "元明清" },
            { id: "jindai", name: "近当代" },
            { id: "other", name: "其它" }
        ];
        
        this.data_storage = new DataStorage();
        this._ensureSaveFiles();

        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            this.initializeLayout();
            if (this.uiManager && this.uiManager.update) {
                this.uiManager.update(this.uiManager.gameManager?.gameState);
            }
        });
    }

    // 初始化布局参数
    initializeLayout() {
        // 获取画布尺寸
        const canvas = this.uiManager?.canvas;
        const defaultWidth = 420;  // 默认宽度
        const defaultHeight = 600; // 默认高度
        
        // 如果无法获取画布，使用默认值
        const screenWidth = canvas ? canvas.width : defaultWidth;
        const screenHeight = canvas ? canvas.height : defaultHeight;
        
        console.log('初始化布局:', {
            画布宽度: screenWidth,
            画布高度: screenHeight,
            是否使用默认值: !canvas
        });

        // 计算基础参数
        this.maxPerRow = 4;        // 每行显示的关卡数
        
        // 计算按钮大小和间距
        const minMargin = 25;  // 增加最小边距
        const minSpacing = 20; // 最小间距
        
        // 计算可用宽度和按钮大小
        const availableWidth = screenWidth - (minMargin * 2);  // 减去左右边距
        const maxButtonSize = Math.floor((availableWidth - (minSpacing * (this.maxPerRow - 1))) / this.maxPerRow);
        this.buttonSize = Math.min(76, maxButtonSize); // 限制最大按钮尺寸为76px
        
        // 计算实际水平间距
        const totalButtonWidth = this.buttonSize * this.maxPerRow;
        const remainingWidth = screenWidth - totalButtonWidth;
        const horizontalSpacing = Math.floor(remainingWidth / (this.maxPerRow + 1));
        
        // 设置布局参数
        this.spacing = this.buttonSize + horizontalSpacing;  // 按钮之间的间距
        this.startX = horizontalSpacing;  // 第一个按钮的x坐标
        this.startY = Math.floor(screenHeight * 0.19);  // 起始y坐标，约为屏幕高度的19%
        
        // 计算可视区域高度
        this.visibleHeight = screenHeight - this.startY - 20;  // 减去底部边距
        
        // 调整滚动条位置
        this.scrollBarX = screenWidth - minMargin;  // 距离右边缘固定距离
        
        console.log('布局参数:', {
            按钮大小: this.buttonSize,
            水平间距: horizontalSpacing,
            起始X: this.startX,
            起始Y: this.startY,
            可视区域高度: this.visibleHeight,
            滚动条X: this.scrollBarX,
            屏幕宽度: screenWidth,
            最右侧按钮位置: this.startX + (this.maxPerRow - 1) * this.spacing + this.buttonSize
        });
    }

    // 更新最大滚动距离
    updateMaxScroll() {
        if (this.levels.length > 0) {
            const rows = Math.ceil(this.levels.length / this.maxPerRow);
            const totalHeight = rows * (this.buttonSize + 15);  // 15为垂直间距
            this.maxScroll = Math.max(0, totalHeight - this.visibleHeight);
            
            console.log('更新滚动范围:', {
                总行数: rows,
                总高度: totalHeight,
                可视区域高度: this.visibleHeight,
                最大滚动距离: this.maxScroll
            });
        }
    }
    
    async loadLevels(dynastyId) {
        console.log(`加载朝代 ${dynastyId} 的关卡数据`);
        this.currentDynasty = dynastyId;
        this.levels = [];
        
        try {
            // 加载分数数据
            const scoreData = this.data_storage.loadScoreData();
            console.log('加载的分数数据:', scoreData);
            
            // 加载解锁数据
            const unlockData = this.data_storage.loadUnlockData();
            console.log('加载的解锁数据:', unlockData);
            
            // 加载关卡配置
            const configPath = `configs/${dynastyId}.csv`;
            const response = await fetch(configPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            
            // 解析CSV数据
            const lines = csvText.split('\n');
            const headers = lines[0].split(',');
            
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                if (values.length === headers.length) {
                    const levelId = parseInt(values[0]);
                    const levelScore = scoreData[dynastyId]?.[levelId] || { score: 0, stars: 0 };
                    // 修改解锁逻辑：如果关卡有分数记录或在解锁列表中，或是第一关，则解锁
                    const isUnlocked = unlockData[dynastyId]?.includes(levelId) || levelId === 1 || (scoreData[dynastyId]?.[levelId]?.score > 0);
                    
                    this.levels.push({
                        id: levelId,
                        unlocked: isUnlocked,
                        stars: levelScore.stars || 0
                    });
                }
            }
            
            console.log(`成功加载 ${this.levels.length} 个关卡数据`);
            
            // 更新滚动范围
            this.updateMaxScroll();
            
            // 重置滚动位置
            this.scrollY = 0;
            this.lastScrollY = 0;
            
        } catch (error) {
            console.error('加载关卡数据失败:', error);
        }
    }
    
    draw(ctx) {
        // 填充白色背景
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // 绘制返回按钮
        if (this.returnBtn && this.returnBtn.complete) {
            ctx.drawImage(this.returnBtn, 20, 20);
        }
        
        // 绘制朝代标题
        const dynastyName = this._getDynastyName(this.currentDynasty);
        ctx.font = '34px STXINWEI';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.fillText(dynastyName, 210, 55);
        
        // 绘制进度条框
        const numberbox = new Image();
        numberbox.src = `${this.uiPath}/numberbox.png`;
        ctx.drawImage(numberbox, 156, 62);
        
        // 绘制星级累计评价
        const totalStars = this.levels.reduce((sum, level) => sum + (level.stars || 0), 0);
        const maxStars = this.levels.length * 3;
        ctx.font = '20px STXINWEI';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.fillText(`${totalStars}/${maxStars}`, 240, 62);
        
        // 绘制星星图标
        const star = new Image();
        star.src = `${this.uiPath}/star.png`;
        ctx.drawImage(star, 156, 62);
        
        // 设置标题区域的保护高度
        const titleProtectionHeight = 90;  // 标题区域的底部位置
        
        // 绘制所有关卡按钮
        for (let i = 0; i < this.levels.length; i++) {
            const level = this.levels[i];
            const row = Math.floor(i / 4);  // 每行4个
            const col = i % 4;
            const x = 15 + col * 90;  // 调整间距
            let y = 116 + row * 100 - this.scrollY;  // 调整间距
            
            // 如果关卡位置会超出标题区域，跳过绘制
            if (y < titleProtectionHeight) {
                continue;
            }
            
            // 绘制关卡按钮
            this._drawLevelButton(ctx, level, x, y);
        }
        
        // 在标题区域底部绘制一个分隔线
        ctx.strokeStyle = 'rgb(200, 200, 200)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, titleProtectionHeight);
        ctx.lineTo(420, titleProtectionHeight);
        ctx.stroke();
        
        // 绘制滚动条
        if (this.maxScroll > 0) {
            const scrollHeight = 200;  // 滚动条高度
            const scrollWidth = 8;    // 滚动条宽度
            const scrollX = this.scrollBarX;  // 使用计算好的滚动条位置
            
            // 计算滚动条位置
            const scrollRatio = this.scrollY / this.maxScroll;
            const scrollY = 200 + scrollRatio * (400 - scrollHeight);
            
            // 绘制滚动条背景
            ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
            ctx.fillRect(scrollX, 200, scrollWidth, 400);
            
            // 绘制滚动条
            ctx.fillStyle = 'rgba(100, 100, 100, 0.8)';
            ctx.fillRect(scrollX, scrollY, scrollWidth, scrollHeight);
        }
    }
    
    _drawLevelButton(ctx, level, x, y) {
        // 1. 总是先绘制基础背景（不管是否解锁）
        if (this.levelBg && this.imagesLoaded.levelBg) {
            ctx.drawImage(this.levelBg, x, y);
        }

        if (!level.unlocked) {
            // 2. 对于未解锁关卡，绘制半透明灰色遮罩
            ctx.fillStyle = 'rgba(200, 200, 200, 0.9)';
            ctx.fillRect(x, y, this.buttonSize, this.buttonSize);
            
            // 3. 绘制关卡号（灰色）
            ctx.font = '20px STXINWEI';
            ctx.fillStyle = '#666666';
            ctx.textAlign = 'center';
            ctx.fillText(`第${level.id}关`, x + 42, y + 35);
            
            // 4. 绘制锁定图标
            if (this.lock && this.imagesLoaded.lock) {
                const lockSize = 35;
                const lockX = x + (this.buttonSize - lockSize) / 2;
                const lockY = y + 40;
                
                try {
                    ctx.save();
                    ctx.globalAlpha = 1.0;  // 确保锁图标完全不透明
                    ctx.drawImage(this.lock, lockX, lockY, lockSize, lockSize);
                    console.log(`绘制锁图标 - 关卡${level.id}:`, {
                        x: lockX,
                        y: lockY,
                        size: lockSize,
                        imageLoaded: this.imagesLoaded.lock,
                        imageSrc: this.lock.src
                    });
                    ctx.restore();
                } catch (error) {
                    console.error(`绘制锁图标失败 - 关卡${level.id}:`, error);
                }
            }
        } else {
            // 2. 绘制关卡号（黑色）
            ctx.font = '20px STXINWEI';
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.fillText(`第${level.id}关`, x + 42, y + 40);
            
            // 3. 绘制星星
            if (this.starBlack && this.imagesLoaded.starBlack && 
                this.starWhite && this.imagesLoaded.starWhite) {
                const starSize = 20;
                const starSpacing = 25;
                for (let j = 0; j < 3; j++) {
                    const starX = x + 15 + j * starSpacing;
                    const starY = y + 50;
                    const starImg = j < level.stars ? this.starBlack : this.starWhite;
                    ctx.drawImage(starImg, starX, starY, starSize, starSize);
                }
            }
        }

        // 调试信息
        console.log(`绘制关卡 ${level.id}:`, {
            unlocked: level.unlocked,
            position: { x, y },
            images: {
                levelBg: {
                    exists: !!this.levelBg,
                    complete: this.levelBg?.complete,
                    loaded: this.imagesLoaded?.levelBg
                },
                lock: {
                    exists: !!this.lock,
                    complete: this.lock?.complete,
                    loaded: this.imagesLoaded?.lock,
                    src: this.lock?.src
                }
            }
        });
    }
    
    _getDifficultyColor(difficulty) {
        switch (difficulty) {
            case '简单':
                return '#4CAF50';  // 绿色
            case '中等':
                return '#FF9800';  // 橙色
            case '困难':
                return '#F44336';  // 红色
            default:
                return 'black';
        }
    }
    
    handleClick(x, y) {
        console.log('处理关卡列表点击事件:', x, y);
        
        // 检查返回按钮
        const returnBtnRect = {
            x: 20,
            y: 20,
            width: this.returnBtn.width,
            height: this.returnBtn.height
        };
        
        console.log('返回按钮区域:', returnBtnRect);
        
        if (this._isPointInRect(x, y, returnBtnRect)) {
            console.log('点击了返回按钮');
            return "return_to_settings";
        }
        
        // 检查滚动条点击
        if (this.maxScroll > 0) {
            const scrollX = 400;
            if (scrollX <= x && x <= scrollX + 10 && 100 <= y && y <= 500) {
                // 计算点击位置对应的滚动比例
                const scrollRatio = (y - 100) / 400;
                this.scrollY = scrollRatio * this.maxScroll;
                return "scroll_changed";
            }
        }
        
        // 检查关卡按钮
        const titleProtectionHeight = 90;
        
        // 检查所有关卡
        for (let i = 0; i < this.levels.length; i++) {
            const level = this.levels[i];
            const row = Math.floor(i / this.maxPerRow);
            const col = i % this.maxPerRow;
            const buttonX = this.startX + col * this.spacing;
            let buttonY = this.startY + row * this.spacing - this.scrollY;
            
            // 如果按钮在标题保护区域内，跳过检查
            if (buttonY < titleProtectionHeight) {
                continue;
            }
            
            const buttonRect = {
                x: buttonX,
                y: buttonY,
                width: this.buttonSize,
                height: this.buttonSize
            };
            
            if (this._isPointInRect(x, y, buttonRect)) {
                if (level.unlocked) {
                    console.log(`选择关卡 ${level.id}`);
                    return `select_level_${level.id}`;
                }
            }
        }
        
        return null;
    }
    
    handleMouseDown(x, y) {
        this.isDragging = true;
        this.dragStartY = y;
        this.lastScrollY = this.scrollY;
    }
    
    handleMouseUp() {
        this.isDragging = false;
    }
    
    handleMouseMove(x, y) {
        if (this.isDragging) {
            // 计算拖动距离
            const deltaY = this.dragStartY - y;
            
            // 更新滚动位置
            const newScrollY = this.lastScrollY + deltaY;
            // 限制滚动范围
            this.scrollY = Math.max(0, Math.min(newScrollY, this.maxScroll));
            return "scroll_changed";
        }
        return null;
    }
    
    async _isLevelUnlocked(dynastyId, levelId) {
        try {
            // 第一关总是解锁的
            if (levelId === 1) {
                return true;
            }

            // 获取解锁数据
            const unlockData = this.data_storage.loadUnlockData();
            const dynastyData = unlockData[dynastyId] || {};
            const unlockedLevels = dynastyData.unlocked_levels || [];

            // 检查关卡是否已解锁
            return unlockedLevels.includes(levelId);
        } catch (error) {
            console.error(`检查关卡解锁状态时出错：${error}`);
            // 如果出错，只解锁第一关
            return levelId === 1;
        }
    }
    
    _getDynastyName(dynastyId) {
        const dynastyNames = {
            'xianqin': '先秦',
            'han': '两汉',
            'sanguo': '魏晋',
            'tang': '隋唐',
            'song': '两宋',
            'mingqing': '元明清',
            'jindai': '近当代',
            'other': '其它'
        };
        return dynastyNames[dynastyId] || '未知';
    }
    
    async _ensureSaveFiles() {
        try {
            // 确保解锁存档存在
            let unlockData = await this.data_storage.loadUnlockData();
            if (!unlockData) {
                console.log("创建 unlock_save.json 文件");
                // 初始化解锁存档，默认每个朝代的第一关解锁
                unlockData = {};
                for (const dynasty of this.dynasties) {
                    unlockData[dynasty.id] = { unlocked_levels: [1] };
                }
                await this.data_storage.saveUnlockData(unlockData);
                console.log(`初始化解锁数据：${JSON.stringify(unlockData)}`);
            }
            
            // 确保分数存档存在
            let scoreData = await this.data_storage.loadScoreData();
            if (!scoreData) {
                console.log("创建 score_save.json 文件");
                // 初始化分数存档
                scoreData = {};
                for (const dynasty of this.dynasties) {
                    scoreData[dynasty.id] = {};
                }
                await this.data_storage.saveScoreData(scoreData);
                console.log(`初始化分数数据：${JSON.stringify(scoreData)}`);
            }
        } catch (error) {
            console.error(`确保存档文件时出错：${error}`);
        }
    }
    
    _parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',');
        const rows = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length === headers.length) {
                const row = {};
                for (let j = 0; j < headers.length; j++) {
                    row[headers[j].trim()] = values[j].trim();
                }
                rows.push(row);
            }
        }
        
        return rows;
    }
    
    _isPointInRect(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.width &&
               y >= rect.y && y <= rect.y + rect.height;
    }
    
    calculateStars(score) {
        // 根据分数计算星星数量
        if (score >= 100) {
            return 3;  // 100分以上获得3星
        } else if (score >= 60) {
            return 2;  // 60-99分获得2星
        } else if (score > 0) {
            return 1;  // 1-59分获得1星
        }
        return 0;  // 0分没有星星
    }
} 