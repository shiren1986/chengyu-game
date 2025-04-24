// ui_manager.js
import { UI_CONFIG, GAME_STATES } from './constants.js';
import { AudioManager } from './audio_manager.js';
import { SettingsManager } from './settings_manager.js';

export class UIManager {
    constructor() {
        console.log("----- UIManager 构造函数开始 -----");
        
        // 加载自定义字体
        const fontFace = new FontFace('STXINWEI', 'url(assets/fonts/STXINWEI.TTF)');
        fontFace.load().then((font) => {
            document.fonts.add(font);
            console.log('STXINWEI字体加载成功');
            // 字体加载后重新绘制界面
            if (this.gameManager) {
                this.gameManager.updateUI();
            }
        }).catch((error) => {
            console.warn('STXINWEI字体加载失败:', error);
        });
        
        // 初始化音频管理器
        this.audio_manager = new AudioManager();
        
        // 设置当前游戏状态
        this.current_state = GAME_STATES.LOADING;
        
        // 初始化文字选择框的点击区域
        this.text_rects = {};
        
        // 初始化设置按钮
        this.settingsButton = {
            x: UI_CONFIG.CANVAS_WIDTH - 50 - 15,  // 画布宽度减去按钮宽度(50)再减去边距(15)
            y: 10,
            width: 50,
            height: 50
        };
        
        // 初始化提示状态
        this.show_tips1 = false;
        this.show_tips2 = false;
        
        // 初始化底部按钮点击区域
        this.bottomButtons = {
            refresh: {
                x: 15,
                y: 680,  // 调整Y坐标
                width: 0,
                height: 0
            },
            hint: {
                x: 170,
                y: 680,  // 调整Y坐标
                width: 0,
                height: 0
            },
            undo: {
                x: 325,
                y: 680,  // 调整Y坐标
                width: 0,
                height: 0
            }
        };
        
        // 初始化滚动相关属性
        this.scroll_y = 0;       // 当前滚动位置
        this.max_scroll = 0;     // 最大可滚动距离
        this.is_dragging = false;// 是否正在拖动
        this.drag_start_y = 0;   // 拖动开始位置
        this.last_scroll_y = 0;  // 上一次的滚动位置
        
        // 预加载UI资源
        this.ui_images = {
            title: new Image(),
            touchbox: new Image(),
            rightbox: new Image(),
            wrong: new Image(),
            correct: new Image(),
            score_bg: new Image(),
            setting_btn: new Image(),
            refresh_btn: new Image(),
            hint_btn: new Image(),
            undo_btn_disabled: new Image(),  // 添加禁用状态的撤销按钮
            undo_btn: new Image(),
            line: new Image(),
            settlement_bg: new Image(),  // 添加结算界面背景
            star_white: new Image(),     // 添加白色星星
            star_black: new Image(),     // 添加黑色星星
            restart_btn: new Image(),     // 添加重新开始按钮
            next_btn: new Image(),         // 添加下一关按钮
            return_btn: new Image()        // 添加返回按钮
        };

        // 设置图片路径
        this.ui_images.title.src = 'assets/UI/biaoti.png';
        this.ui_images.touchbox.src = 'assets/UI/touchbox.png';
        this.ui_images.rightbox.src = 'assets/UI/rightbox.png';
        this.ui_images.wrong.src = 'assets/UI/cuo.png';
        this.ui_images.correct.src = 'assets/UI/dui.png';
        this.ui_images.score_bg.src = 'assets/UI/defenkuang.png';
        this.ui_images.setting_btn.src = 'assets/UI/shezhi.png';
        this.ui_images.refresh_btn.src = 'assets/UI/shuaxin.png';
        this.ui_images.hint_btn.src = 'assets/UI/hint.png';
        this.ui_images.undo_btn_disabled.src = 'assets/UI/cexiao_1.png';  // 禁用状态
        this.ui_images.undo_btn.src = 'assets/UI/cexiao_0.png';  // 启用状态
        this.ui_images.line.src = 'assets/UI/xian.png';
        this.ui_images.settlement_bg.src = 'assets/UI/settlement.png';
        this.ui_images.star_white.src = 'assets/UI/star_white.png';
        this.ui_images.star_black.src = 'assets/UI/star_black.png';
        this.ui_images.restart_btn.src = 'assets/UI/restart.png';
        this.ui_images.next_btn.src = 'assets/UI/nextleved.png';
        this.ui_images.return_btn.src = 'assets/UI/return.png';  // 设置返回按钮图片路径

        // 监听图片加载
        let loadedImages = 0;
        const totalImages = Object.keys(this.ui_images).length;

        const onImageLoad = () => {
            loadedImages++;
            if (loadedImages === totalImages) {
                console.log('所有UI图片资源加载完成');
                if (this.canvas) {
                    this.setupCanvas();
                }
            }
        };

        // 为每个图片添加加载事件监听
        Object.values(this.ui_images).forEach(img => {
            img.onload = onImageLoad;
            img.onerror = (e) => {
                console.error('图片加载失败:', e);
                loadedImages++; // 即使加载失败也继续计数
            };
        });
        
        // 当设置按钮图片加载完成时，更新按钮尺寸
        this.ui_images.setting_btn.onload = () => {
            this.settingsButton.width = this.ui_images.setting_btn.width;
            this.settingsButton.height = this.ui_images.setting_btn.height;
            console.log('设置按钮尺寸已更新:', this.settingsButton);
        };
        
        // 监听底部按钮图片加载完成
        this.ui_images.refresh_btn.onload = () => {
            this.bottomButtons.refresh.width = this.ui_images.refresh_btn.width;
            this.bottomButtons.refresh.height = this.ui_images.refresh_btn.height;
            this.updateButtonPositions();
            console.log('刷新按钮尺寸已更新:', this.bottomButtons.refresh);
        };

        this.ui_images.hint_btn.onload = () => {
            this.bottomButtons.hint.width = this.ui_images.hint_btn.width;
            this.bottomButtons.hint.height = this.ui_images.hint_btn.height;
            this.updateButtonPositions();
            console.log('提示按钮尺寸已更新:', this.bottomButtons.hint);
        };

        this.ui_images.undo_btn.onload = () => {
            this.bottomButtons.undo.width = this.ui_images.undo_btn.width;
            this.bottomButtons.undo.height = this.ui_images.undo_btn.height;
            this.updateButtonPositions();
            console.log('撤销按钮尺寸已更新:', this.bottomButtons.undo);
        };
        
        // 设置回调函数
        this.callbacks = {
            onStartGame: null,
            onShowSettings: null,
            onUndo: null,
            onTextClick: null,
            onContinue: null,
            onRestart: null,
            onNextLevel: null
        };

        this.settings_manager = new SettingsManager();

        console.log("----- UIManager 构造函数完成 -----");
    }

    async initialize(gameManager) {
        console.log('----- UIManager.initialize() 开始 -----');
        
        if (!gameManager) {
            console.error('游戏管理器未提供');
            return;
        }
        
        // 获取canvas元素
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            console.error('Canvas元素未找到');
            return;
        }
        
        // 获取绘图上下文
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('无法获取Canvas上下文');
            return;
        }
        
        // 设置画布大小
        this.setupCanvas();
        
        // 绑定游戏管理器
        this.gameManager = gameManager;
        
        // 验证游戏管理器是否正确初始化
        if (!this.gameManager.gameState) {
            console.error('游戏状态未初始化');
            this.gameManager.gameState = {
                score: 0,
                level: 1,
                attempts_left: 3,
                all_text: [],
                display_texts: [],
                wrong_indices: [],
                correct_indices: []
            };
        }
        
        console.log('游戏管理器已绑定:', this.gameManager);
        console.log('游戏状态:', this.gameManager.gameState);
        
        // 设置点击事件处理
        this.setupClickHandler();
        
        // 初始化音频管理器
        await this.audio_manager.initialize();
        
        console.log('----- UIManager.initialize() 完成 -----');
    }

    setCallbacks(callbacks) {
        this.callbacks = {
            ...this.callbacks,
            ...callbacks
        };
    }

    setupCanvas() {
        if (!this.canvas) {
            console.error('Canvas元素未找到');
            return;
        }
        
        // 获取设备屏幕尺寸
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // 设置画布实际大小（内部分辨率）
        this.canvas.width = UI_CONFIG.CANVAS_WIDTH;
        this.canvas.height = UI_CONFIG.CANVAS_HEIGHT;
        
        // 计算目标尺寸（保持宽高比）
        const targetHeight = screenHeight * 0.95; // 使用95%的屏幕高度
        const targetWidth = (targetHeight * UI_CONFIG.CANVAS_WIDTH) / UI_CONFIG.CANVAS_HEIGHT;
        
        // 如果宽度超出屏幕，则以宽度为基准重新计算
        let displayWidth, displayHeight;
        if (targetWidth > screenWidth * 0.95) {
            displayWidth = screenWidth * 0.95;
            displayHeight = (displayWidth * UI_CONFIG.CANVAS_HEIGHT) / UI_CONFIG.CANVAS_WIDTH;
        } else {
            displayWidth = targetWidth;
            displayHeight = targetHeight;
        }
        
        // 计算缩放比例
        this.scaleRatio = displayWidth / UI_CONFIG.CANVAS_WIDTH;
        
        // 设置画布样式
        this.canvas.style.position = 'fixed';
        this.canvas.style.width = `${displayWidth}px`;
        this.canvas.style.height = `${displayHeight}px`;
        this.canvas.style.left = `${(screenWidth - displayWidth) / 2}px`;
        this.canvas.style.top = `${(screenHeight - displayHeight) / 2}px`;
        
        // 确保画布渲染清晰
        this.canvas.style.imageRendering = '-moz-crisp-edges';
        this.canvas.style.imageRendering = '-webkit-crisp-edges';
        this.canvas.style.imageRendering = 'pixelated';
        this.canvas.style.imageRendering = 'crisp-edges';
        
        // 移除transform，直接使用left/top定位
        this.canvas.style.transform = 'none';
        
        // 设置背景色
        this.canvas.style.backgroundColor = UI_CONFIG.BACKGROUND_COLOR;
        
        console.log('画布设置:', {
            设备尺寸: { width: screenWidth, height: screenHeight },
            画布实际尺寸: { width: UI_CONFIG.CANVAS_WIDTH, height: UI_CONFIG.CANVAS_HEIGHT },
            显示尺寸: { width: displayWidth, height: displayHeight },
            缩放比例: this.scaleRatio,
            位置: { 
                left: (screenWidth - displayWidth) / 2,
                top: (screenHeight - displayHeight) / 2
            }
        });
    }

    // 修改更新按钮位置的方法
    updateButtonPositions() {
        // 计算底部按钮的位置
        const bottomY = UI_CONFIG.CANVAS_HEIGHT - 75;  // 距离底部75px
        
        // 获取按钮图片的实际尺寸
        const refreshBtn = this.ui_images.refresh_btn;
        const hintBtn = this.ui_images.hint_btn;
        const undoBtn = this.ui_images.undo_btn;
        
        // 计算按钮之间的间距，使其均匀分布
        const totalWidth = (refreshBtn?.width || 0) + (hintBtn?.width || 0) + (undoBtn?.width || 0);
        const spacing = (UI_CONFIG.CANVAS_WIDTH - totalWidth) / 4; // 4等分空间
        
        let currentX = spacing;
        
        // 更新刷新按钮位置
        if (refreshBtn && refreshBtn.complete) {
            this.bottomButtons.refresh = {
                x: currentX,
                y: bottomY,
                width: refreshBtn.width,
                height: refreshBtn.height
            };
            currentX += refreshBtn.width + spacing;
        }
        
        // 更新提示按钮位置
        if (hintBtn && hintBtn.complete) {
            this.bottomButtons.hint = {
                x: currentX,
                y: bottomY,
                width: hintBtn.width,
                height: hintBtn.height
            };
            currentX += hintBtn.width + spacing;
        }
        
        // 更新撤销按钮位置
        if (undoBtn && undoBtn.complete) {
            this.bottomButtons.undo = {
                x: currentX,
                y: bottomY,
                width: undoBtn.width,
                height: undoBtn.height
            };
        }
        
        console.log('按钮位置已更新:', {
            刷新按钮: this.bottomButtons.refresh,
            提示按钮: this.bottomButtons.hint,
            撤销按钮: this.bottomButtons.undo
        });
    }

    setupClickHandler() {
        this.canvas.addEventListener('click', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            // 计算点击位置相对于画布的实际坐标
            const x = (event.clientX - rect.left) * (UI_CONFIG.CANVAS_WIDTH / rect.width);
            const y = (event.clientY - rect.top) * (UI_CONFIG.CANVAS_HEIGHT / rect.height);
            
            console.log('点击事件:', {
                原始坐标: { x: event.clientX, y: event.clientY },
                画布位置: rect,
                转换坐标: { x, y }
            });
            
            this.handleClick(x, y);
        });

        // 修改其他事件处理器使用相同的坐标转换方式
        this.canvas.addEventListener('mousedown', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (event.clientX - rect.left) * (UI_CONFIG.CANVAS_WIDTH / rect.width);
            const y = (event.clientY - rect.top) * (UI_CONFIG.CANVAS_HEIGHT / rect.height);
            
            if (this.current_state === GAME_STATES.LEVEL_SELECT) {
                this.is_dragging = true;
                this.drag_start_y = y;
                this.last_scroll_y = this.scroll_y;
            }
        });

        this.canvas.addEventListener('mousemove', (event) => {
            if (this.is_dragging && this.current_state === GAME_STATES.LEVEL_SELECT) {
                const rect = this.canvas.getBoundingClientRect();
                const y = (event.clientY - rect.top) * (UI_CONFIG.CANVAS_HEIGHT / rect.height);
                
                const delta = this.drag_start_y - y;
                let new_scroll = this.last_scroll_y + delta;
                
                // 限制滚动范围
                new_scroll = Math.max(0, Math.min(new_scroll, this.max_scroll));
                
                if (this.scroll_y !== new_scroll) {
                    this.scroll_y = new_scroll;
                    this.drawLevelSelectScreen(this.gameManager.gameState);
                }
            }
        });

        // 添加鼠标松开和离开事件
        this.canvas.addEventListener('mouseup', () => {
            this.is_dragging = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.is_dragging = false;
        });

        // 添加滚轮事件
        this.canvas.addEventListener('wheel', (event) => {
            if (this.current_state === GAME_STATES.LEVEL_SELECT) {
                event.preventDefault();
                
                const delta = event.deltaY;
                let new_scroll = this.scroll_y + delta * 0.5;
                
                // 限制滚动范围
                new_scroll = Math.max(0, Math.min(new_scroll, this.max_scroll));
                
                if (this.scroll_y !== new_scroll) {
                    this.scroll_y = new_scroll;
                    this.drawLevelSelectScreen(this.gameManager.gameState);
                }
            }
        });
    }

    clear() {
        this.ctx.fillStyle = UI_CONFIG.BACKGROUND_COLOR;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawText(text, x, y, color = UI_CONFIG.TEXT_COLOR, size = UI_CONFIG.TEXT_SIZE) {
        this.ctx.font = `${size}px "STXINWEI", SimHei`;  // 使用STXINWEI字体，回退到SimHei
        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, x, y);
    }

    drawButton(text, x, y, width, height, color = UI_CONFIG.BUTTON_COLOR) {
        // 绘制按钮背景
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);
        
        // 绘制按钮文字
        this.ctx.fillStyle = 'white';
        this.ctx.font = `${UI_CONFIG.TEXT_SIZE}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x + width/2, y + height/2);
    }

    drawMainMenu() {
        console.log('绘制主菜单');
        this.clear();
        
        // 绘制标题图片
        if (this.ui_images.title && this.ui_images.title.complete) {
            const x = (this.canvas.width - this.ui_images.title.width) / 2;
            const y = 100;
            this.ctx.drawImage(this.ui_images.title, x, y);
        }
        
        // 定义开始游戏按钮
        const buttonWidth = 180;  // 按钮宽度
        const buttonHeight = 50;  // 按钮高度
        const buttonX = (this.canvas.width - buttonWidth) / 2;
        const buttonY = Math.floor(UI_CONFIG.CANVAS_HEIGHT * (2/3));
        
        this.startButton = {
            x: buttonX,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        };
        
        // 绘制开始游戏按钮
        this.ctx.fillStyle = '#4CAF50';
        this.roundRect(
            buttonX,
            buttonY,
            buttonWidth,
            buttonHeight,
            10,
            true,
            false
        );
        
        // 绘制开始游戏按钮文字
        this.ctx.font = '24px "STXINWEI", SimHei';  // 使用STXINWEI字体，回退到SimHei
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            '开始游戏',
            buttonX + buttonWidth/2,
            buttonY + buttonHeight/2
        );

        console.log('主菜单绘制完成，开始游戏按钮区域:', this.startButton);
    }

    drawGameScreen() {
        if (!this.gameManager) {
            console.error('游戏管理器未初始化');
            return;
        }

        const gameState = this.gameManager.gameState;
        if (!gameState) {
            console.error('游戏状态未初始化');
            return;
        }

        // 更新当前游戏状态
        this.currentGameState = gameState;

        console.log('绘制游戏界面，当前状态:', gameState);

        // 清空画布
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制得分框
        const scoreBoxImg = this.ui_images.score_bg;
        if (scoreBoxImg && scoreBoxImg.complete) {
            this.ctx.drawImage(scoreBoxImg, 10, 5);
        }

        // 绘制"得分："文字和分数
        this.ctx.textAlign = 'left';
        
        // 绘制"得分："文字
        this.ctx.font = 'bold 36px "STXINWEI", SimHei';
        this.ctx.fillStyle = '#000000';
        this.ctx.fillText('得分：', 30, 45);

        // 显示分数（固定位置）
        this.ctx.font = '36px "STXINWEI", SimHei';
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillText(gameState.score.toString(), 130, 45);

        // 绘制设置按钮
        const settingBtn = this.ui_images.setting_btn;
        if (settingBtn && settingBtn.complete) {
            // 使用settingsButton中保存的位置信息
            const btnX = UI_CONFIG.CANVAS_WIDTH - settingBtn.width - 15;  // 距离右侧15像素
            this.settingsButton.x = btnX;  // 更新按钮位置
            this.ctx.drawImage(settingBtn, btnX, this.settingsButton.y);
            
            // 如果需要调试，可以显示点击区域
            if (false) {  // 设置为true可以显示点击区域
                this.ctx.strokeStyle = 'red';
                this.ctx.strokeRect(
                    this.settingsButton.x,
                    this.settingsButton.y,
                    this.settingsButton.width,
                    this.settingsButton.height
                );
            }
        }

        // 绘制选择机会文本
        this.ctx.font = '24px "STXINWEI", SimHei';  // 移除bold
        this.ctx.fillStyle = '#000000';
        this.ctx.textAlign = 'center';  // 改为居中对齐
        
        // 计算文本总宽度
        const text1 = '你有';
        const text2 = gameState.attempts_left.toString();
        const text3 = '次错误选择机会';
        
        // 测量每段文本的宽度
        const width1 = this.ctx.measureText(text1).width;
        const width2 = this.ctx.measureText(text2).width;
        const width3 = this.ctx.measureText(text3).width;
        
        // 计算总宽度和中心位置
        const totalWidth = width1 + width2 + width3;
        const centerX = this.canvas.width / 2;
        const startX = centerX - totalWidth / 2;
        
        // 绘制"你有"
        this.ctx.fillStyle = '#000000';
        this.ctx.fillText(text1, startX + width1/2, 100);
        
        // 绘制剩余次数（红色）
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillText(text2, startX + width1 + width2/2, 100);
        
        // 绘制"次错误选择机会"（黑色）
        this.ctx.fillStyle = '#000000';
        this.ctx.fillText(text3, startX + width1 + width2 + width3/2, 100);

        // 绘制分割线
        const lineImg = this.ui_images.line;
        if (lineImg && lineImg.complete) {
            this.ctx.drawImage(lineImg, 5, 500);
        }

        // 绘制朝代和关卡信息
        this.ctx.font = 'bold 24px "STXINWEI", SimHei';
        this.ctx.fillStyle = '#000000';
        const dynastyName = this.gameManager.config_loader.getCurrentDynastyName();
        this.ctx.fillText(dynastyName, 120, 530);
        this.ctx.fillText(`第${gameState.level}关`, 250, 530);

        // 先绘制答案区域（在下方）
        this.drawAnswerArea();

        // 再绘制文字选择区域（在上方）
        this.drawTextOptions();

        // 绘制提示信息（在底部按钮上方）
        if (this.show_tips1 || this.show_tips2) {
            const buttonY = UI_CONFIG.CANVAS_HEIGHT - 30 - 50;
            
            this.ctx.font = '20px "STXINWEI", SimHei';  // 使用STXINWEI字体，回退到SimHei
            this.ctx.fillStyle = '#000000';
            this.ctx.textAlign = 'left';
            
            const tips2Y = buttonY - 15;
            const tips1Y = tips2Y - 30;
            
            if (this.show_tips1 && gameState.current_level_data.tips1) {
                this.ctx.fillText(gameState.current_level_data.tips1, 20, tips1Y);
            }
            if (this.show_tips2 && gameState.current_level_data.tips2) {
                this.ctx.fillText(gameState.current_level_data.tips2, 20, tips2Y);
            }
        }

        // 绘制底部按钮
        this.drawBottomButtons();
        
        console.log('游戏界面绘制完成');
    }

    drawAnswerArea() {
        const gameState = this.currentGameState;
        if (!gameState) {
            console.error('游戏状态未初始化');
            return;
        }

        console.log('绘制答案区域，游戏状态:', gameState);

        // 获取正确答案文本数组和当前显示的文本数组
        const correctTexts = gameState.correct_texts || [];
        const displayTexts = gameState.display_texts || new Array(correctTexts.length).fill('');
        
        console.log('答案区域数据:', {
            correctTexts,
            displayTexts
        });
        
        // 设置答案区域的参数
        const maxSlotsPerRow = 8;  // 每行最多显示8个字
        const sideMargin = 20;     // 两侧边距
        const screenWidth = this.canvas.width;
        const maxWidth = screenWidth - (sideMargin * 2);  // 可用宽度

        // 根据文字数量确定框的大小和间距
        let blockSize, margin;
        if (correctTexts.length <= 4) {
            blockSize = 45;  // 4个字及以下时框大小45像素
            margin = 5;      // 间距5像素
        } else {
            blockSize = 40;  // 超过4个字时框大小40像素
            margin = 4;      // 间距4像素
        }

        // 计算每行的文字数量
        const numRows = Math.ceil(correctTexts.length / maxSlotsPerRow);
        const lastRowCount = correctTexts.length % maxSlotsPerRow || maxSlotsPerRow;

        // 计算整个区域的宽度并居中
        const totalWidth = Math.min(correctTexts.length, maxSlotsPerRow) * blockSize + 
                         (Math.min(correctTexts.length, maxSlotsPerRow) - 1) * margin;
        const startX = Math.max(sideMargin, (screenWidth - totalWidth) / 2);
        const startY = 560;

        // 绘制每个答案位置
        correctTexts.forEach((_, index) => {
            const row = Math.floor(index / maxSlotsPerRow);
            const col = index % maxSlotsPerRow;
            const x = startX + (col * (blockSize + margin));
            const y = startY + (row * (blockSize + margin));
            
            // 绘制答案框背景
            const rightBoxImg = this.ui_images.rightbox;
            if (rightBoxImg) {
                this.ctx.drawImage(rightBoxImg, x, y, blockSize, blockSize);
            }

            // 如果有已选择的文字，则绘制文字
            if (displayTexts[index]) {
                // 根据框的大小选择字体大小
                this.ctx.font = blockSize < 38 ? '24px "STXINWEI", SimHei' : '28px "STXINWEI", SimHei';
                this.ctx.fillStyle = '#000000';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                const text = displayTexts[index];
                const centerX = x + blockSize / 2;
                const centerY = y + blockSize / 2;
                this.ctx.fillText(text, centerX, centerY);
            }
        });
    }

    drawTextOptions() {
        const gameState = this.currentGameState;
        if (!gameState) {
            console.error('游戏状态未初始化');
            return;
        }

        console.log('绘制文字选择区域，游戏状态:', gameState);

        const allTexts = gameState.all_text || [];
        const correctIndices = gameState.correct_indices || [];
        const wrongIndices = gameState.wrong_indices || [];
        
        if (allTexts.length === 0) {
            console.log('没有可选择的文字');
            return;
        }

        console.log('文字选择区域数据:', {
            allTexts,
            correctIndices,
            wrongIndices
        });
        
        // 根据文字数量动态设置布局参数
        let blockSize, xSpacing, ySpacing, cols, startX, startY;
        
        if (allTexts.length <= 16) {
            // 4x4布局（16个或更少文字）
            blockSize = 76;     // touchbox大小为76x76像素
            xSpacing = 109;     // X轴间隔109像素
            ySpacing = 90;      // Y轴间隔90像素
            cols = 4;           // 4列
            startX = 15;        // 起始X坐标
            startY = 130;       // 起始Y坐标
        } else {
            // 5x5布局（超过16个文字）
            const availableWidth = 420;   // 可用宽度
            const availableHeight = 370;  // 可用高度（从130到500的空间）
            cols = 5;                     // 5列
            
            // 计算每个格子的最大可用空间
            const maxBoxWidth = (availableWidth - (cols - 1) * 10) / cols;   // 留出10像素的间距
            const maxBoxHeight = availableHeight / 5;  // 5行
            
            // 取较小的值作为touchbox的大小，确保是正方形
            blockSize = Math.min(maxBoxWidth, maxBoxHeight, 76);  // 不超过原始大小
            xSpacing = blockSize + 10;    // 10像素的固定间距
            ySpacing = blockSize + 10;    // 10像素的固定间距
            
            // 计算起始位置，使布局居中
            const totalWidth = (cols * blockSize) + ((cols - 1) * 10);
            startX = (420 - totalWidth) / 2;
            startY = 130;
        }

        // 清空并重新初始化点击区域信息
        this.text_rects = {};

        // 绘制每个文字选择框
        allTexts.forEach((text, index) => {
            if (!text) return; // 跳过空文字

            const row = Math.floor(index / cols);
            const col = index % cols;
            const x = startX + col * xSpacing;
            const y = startY + row * ySpacing;

            // 绘制touchbox背景
            const touchBoxImg = this.ui_images.touchbox;
            if (touchBoxImg) {
                this.ctx.drawImage(touchBoxImg, x, y, blockSize, blockSize);
            }

            // 保存点击区域
            this.text_rects[index] = {
                x: x,
                y: y,
                width: blockSize,
                height: blockSize
            };

            console.log(`设置文字框 ${index} 的点击区域:`, this.text_rects[index]);

            // 绘制文字
            const fontSize = blockSize < 60 ? 42 : 48;
            this.ctx.font = `${fontSize}px "STXINWEI", SimHei`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // 设置文字颜色
            if (wrongIndices.includes(index)) {
                this.ctx.fillStyle = '#FF0000';  // 错误选择显示红色
            } else if (correctIndices.includes(index)) {
                this.ctx.fillStyle = '#CCCCCC';  // 正确选择显示灰色
            } else {
                this.ctx.fillStyle = '#000000';  // 未选择的显示黑色
            }

            // 计算文字位置（框的中心点）
            const centerX = x + blockSize / 2;
            const centerY = y + blockSize / 2;
            
            // 直接在中心点绘制文字
            this.ctx.fillText(text, centerX, centerY);

            // 绘制错误/正确标记（在文字上方居中）
            if (wrongIndices.includes(index)) {
                const wrongImg = this.ui_images.wrong;
                if (wrongImg) {
                    this.ctx.drawImage(wrongImg, x, y, blockSize, blockSize);
                }
            } else if (gameState.correct_indices && gameState.correct_indices.includes(index)) {
                const correctImg = this.ui_images.correct;
                if (correctImg) {
                    this.ctx.drawImage(correctImg, x, y, blockSize, blockSize);
                }
            }
        });

        console.log('文字选择区域绘制完成，点击区域:', this.text_rects);
    }

    drawBottomButtons() {
        // 计算Y坐标（距离底部30像素）
        const buttonY = UI_CONFIG.CANVAS_HEIGHT - 30 - 50;  // 50是按钮的高度

        // 绘制刷新按钮
        const refreshBtn = this.ui_images.refresh_btn;
        if (refreshBtn && refreshBtn.complete) {
            // 使用画布坐标系统
            const x = 15;
            const y = buttonY;
            this.ctx.drawImage(refreshBtn, x, y);
            // 保存点击区域时使用相同的坐标
            this.bottomButtons.refresh = {
                x: x,
                y: y,
                width: refreshBtn.width,
                height: refreshBtn.height
            };
        }

        // 绘制提示按钮
        const hintBtn = this.ui_images.hint_btn;
        if (hintBtn && hintBtn.complete) {
            const x = 170;
            const y = buttonY;
            this.ctx.drawImage(hintBtn, x, y);
            this.bottomButtons.hint = {
                x: x,
                y: y,
                width: hintBtn.width,
                height: hintBtn.height
            };
        }

        // 绘制撤销按钮
        const canUndo = this.gameManager && this.gameManager.canUndo();
        const undoBtn = canUndo ? this.ui_images.undo_btn : this.ui_images.undo_btn_disabled;
        if (undoBtn && undoBtn.complete) {
            const x = UI_CONFIG.CANVAS_WIDTH - undoBtn.width - 15;  // 距离右侧15像素
            const y = buttonY;
            this.ctx.drawImage(undoBtn, x, y);
            this.bottomButtons.undo = {
                x: x,
                y: y,
                width: undoBtn.width,
                height: undoBtn.height
            };
        }

        console.log('底部按钮位置:', {
            刷新按钮: this.bottomButtons.refresh,
            提示按钮: this.bottomButtons.hint,
            撤销按钮: this.bottomButtons.undo,
            底部间距: 30,
            按钮Y坐标: buttonY
        });
    }

    drawSettlementScreen(gameState) {
        // 1. 创建半透明遮罩
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 2. 绘制结算界面底框
        const settlementBg = this.ui_images.settlement_bg;
        if (settlementBg) {
            this.ctx.drawImage(settlementBg, 28, 123);
        }
        
        // 3. 绘制"成绩"标题
        this.ctx.font = 'bold 36px "STXINWEI", SimHei';
        this.ctx.fillStyle = '#000000';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('成绩', 213, 155);
        
        // 4. 绘制分数
        this.ctx.font = '48px "STXINWEI", SimHei';
        this.ctx.fillStyle = '#D90000';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(gameState.score.toString(), 213, 300);
        
        // 5. 绘制分数下划线
        this.ctx.beginPath();
        const scoreWidth = this.ctx.measureText(gameState.score.toString()).width;
        this.ctx.moveTo(213 - scoreWidth/2, 310);
        this.ctx.lineTo(213 + scoreWidth/2, 310);
        this.ctx.strokeStyle = '#D90000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 6. 绘制星星
        const starPositions = [
            {x: 105, y: 385},
            {x: 183, y: 385},
            {x: 260, y: 385}
        ];
        const starThresholds = [60, 80, 100];
        
        starPositions.forEach((pos, index) => {
            const starImg = gameState.score >= starThresholds[index] ? 
                this.ui_images.star_black : this.ui_images.star_white;
            if (starImg) {
                this.ctx.drawImage(starImg, pos.x, pos.y);
            }
        });
        
        // 7. 绘制按钮
        // 如果分数小于100，显示重新开始按钮
        if (gameState.score < 100) {
            const restartBtn = this.ui_images.restart_btn;
            if (restartBtn) {
                this.ctx.drawImage(restartBtn, 122, 522);
                this.restart_btn_rect = {
                    x: 122,
                    y: 522,
                    width: restartBtn.width,
                    height: restartBtn.height
                };
            }
        } else {
            this.restart_btn_rect = null;
        }
        
        // 如果分数大于等于60，显示下一关按钮
        if (gameState.score >= 60) {
            const nextBtn = this.ui_images.next_btn;
            if (nextBtn) {
                this.ctx.drawImage(nextBtn, 122, 594);
                this.next_btn_rect = {
                    x: 122,
                    y: 594,
                    width: nextBtn.width,
                    height: nextBtn.height
                };
            }
        } else {
            this.next_btn_rect = null;
        }
    }

    drawLoadingScreen() {
        console.log('绘制加载界面');
        this.clear();
        
        // 绘制标题图片
        if (this.ui_images.title && this.ui_images.title.complete) {
            const x = (this.canvas.width - this.ui_images.title.width) / 2;
            const y = 100;
            this.ctx.drawImage(this.ui_images.title, x, y);
        }
        
        // 绘制加载文本
        this.ctx.font = `${UI_CONFIG.TEXT_SIZE}px "STXINWEI", SimHei`;
        this.ctx.fillStyle = UI_CONFIG.TEXT_COLOR;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏加载中...', this.canvas.width / 2, this.canvas.height / 2 + 100);
    }

    handleClick(x, y) {
        // 不再需要额外的坐标转换，因为在setupClickHandler中已经转换过了
        console.log('处理点击事件:', {
            点击坐标: {x, y},
            画布尺寸: {
                width: this.canvas.width,
                height: this.canvas.height
            }
        });
        
        switch (this.current_state) {
            case GAME_STATES.MAIN_MENU:
                return this.handleMainMenuClick(x, y);
            case GAME_STATES.GAME:
                return this.handleGameClick(x, y);
            case GAME_STATES.SETTLEMENT:
                return this.handleSettlementClick(x, y);
            case GAME_STATES.SETTINGS:
                return this.handleSettingsClick(x, y);
            case GAME_STATES.LEVEL_SELECT:
                return this.handleLevelSelectClick(x, y);
            case GAME_STATES.LOADING:
                console.log('加载状态下不处理点击事件');
                break;
            default:
                console.warn('未知的游戏状态:', this.current_state);
        }
    }

    handleMainMenuClick(x, y) {
        console.log('处理主菜单点击，检查按钮:', this.startButton);
        
        // 检查开始游戏按钮
        if (this.isPointInButton(x, y, this.startButton)) {
            console.log('点击了开始游戏按钮');
            if (this.callbacks.onStartGame) {
                this.audio_manager.playRight();
                this.current_state = GAME_STATES.GAME;  // 更新状态
                this.callbacks.onStartGame();
            }
        }
    }

    handleGameClick(x, y) {
        if (!this.gameManager || !this.gameManager.gameState) {
            console.error('游戏管理器或游戏状态未初始化');
            return;
        }

        // 将坐标转换为整数
        const intX = Math.floor(x);
        const intY = Math.floor(y);

        // 检查设置按钮点击
        if (this.isPointInButton(intX, intY, this.settingsButton)) {
            console.log('点击了设置按钮');
            if (this.callbacks.onShowSettings) {
                this.audio_manager.playRight();
                this.current_state = GAME_STATES.SETTINGS;  // 更新状态为设置界面
                this.callbacks.onShowSettings();
                return;
            }
        }

        // 检查底部按钮点击
        if (this.bottomButtons) {
            // 检查刷新按钮
            if (this.isPointInButton(intX, intY, this.bottomButtons.refresh)) {
                console.log('点击了刷新按钮');
                this.audio_manager.playRight();
                this.gameManager.refreshGame();
                return -1;
            }
            
            // 检查提示按钮
            if (this.isPointInButton(intX, intY, this.bottomButtons.hint)) {
                console.log('点击了提示按钮');
                this.audio_manager.playRight();
                this.gameManager.showHint();
                return -2;
            }
            
            // 检查撤销按钮
            if (this.isPointInButton(intX, intY, this.bottomButtons.undo)) {
                console.log('点击了撤销按钮');
                if (this.gameManager.canUndo()) {
                    this.audio_manager.playRight();
                    this.gameManager.undoLastMove();
                }
                return -3;
            }
        }

        // 验证游戏状态的完整性
        if (!this.gameManager.gameState.all_text || !Array.isArray(this.gameManager.gameState.all_text)) {
            console.error('游戏文本数组未正确初始化');
            console.log('当前游戏状态:', this.gameManager.gameState);
            return null;
        }

        // 确保其他必要的状态数组已初始化
        if (!this.gameManager.gameState.correct_indices) {
            this.gameManager.gameState.correct_indices = [];
        }
        if (!this.gameManager.gameState.wrong_indices) {
            this.gameManager.gameState.wrong_indices = [];
        }
        if (!this.gameManager.gameState.display_texts) {
            this.gameManager.gameState.display_texts = [];
        }

        console.log('处理游戏点击，原始坐标:', x, y);
        console.log('处理游戏点击，转换后坐标:', intX, intY);
        console.log('当前游戏状态:', {
            allTextLength: this.gameManager.gameState.all_text.length,
            allText: this.gameManager.gameState.all_text,
            correctIndices: this.gameManager.gameState.correct_indices,
            wrongIndices: this.gameManager.gameState.wrong_indices,
            displayTexts: this.gameManager.gameState.display_texts
        });

        // 检查文字选择区域点击
        if (!this.text_rects) {
            console.error('文字选择区域未初始化');
            return null;
        }

        console.log('检查文字选择区域点击');
        console.log('text_rects:', this.text_rects);

        // 遍历所有文字选择框检查点击
        for (let index in this.text_rects) {
            const rect = this.text_rects[index];
            console.log(`检查文字框 ${index}:`, rect);
            
            // 确保rect的所有属性都存在
            if (!rect || typeof rect.x === 'undefined' || 
                typeof rect.y === 'undefined' || 
                typeof rect.width === 'undefined' || 
                typeof rect.height === 'undefined') {
                console.error(`文字框 ${index} 的属性不完整:`, rect);
                continue;
            }

            // 计算文字框的边界
            const rectLeft = Math.floor(rect.x);
            const rectRight = Math.floor(rect.x + rect.width);
            const rectTop = Math.floor(rect.y);
            const rectBottom = Math.floor(rect.y + rect.height);
            
            // 使用整数坐标和一个小的容差值进行点击检测
            const tolerance = 1; // 1像素的容差
            
            // 检查点击是否在文字框范围内
            const isInside = intX >= (rectLeft - tolerance) && 
                           intX <= (rectRight + tolerance) &&
                           intY >= (rectTop - tolerance) && 
                           intY <= (rectBottom + tolerance);

            console.log('点击检测:', {
                rect: `${index}`,
                bounds: {
                    left: rectLeft - tolerance,
                    right: rectRight + tolerance,
                    top: rectTop - tolerance,
                    bottom: rectBottom + tolerance
                },
                click: { x: intX, y: intY },
                isInside: isInside
            });

            if (isInside) {
                console.log('点击在文字框内，索引:', index);
                
                const clickedIndex = parseInt(index);
                
                // 再次验证点击索引的有效性
                if (clickedIndex >= this.gameManager.gameState.all_text.length) {
                    console.error('点击索引超出文本数组范围:', {
                        clickedIndex,
                        allTextLength: this.gameManager.gameState.all_text.length
                    });
                    return null;
                }

                // 检查文字是否已被选择
                if (this.gameManager.gameState.correct_indices.includes(clickedIndex) ||
                    this.gameManager.gameState.wrong_indices.includes(clickedIndex)) {
                    console.log('该文字已被选择过');
                    return null;
                }
                
                // 处理文字选择
                console.log('处理文字选择:', {
                    index: clickedIndex,
                    text: this.gameManager.gameState.all_text[clickedIndex]
                });
                
                this.gameManager.handleTextSelection(clickedIndex);
                
                // 播放音效
                if (this.gameManager.gameState.correct_indices.includes(clickedIndex)) {
                    this.audio_manager.playRight();
                } else {
                    this.audio_manager.playError();
                }
                
                return clickedIndex;
            }
        }
        
        console.log('点击未命中任何文字框');
        return null;
    }

    handleSettlementClick(x, y) {
        console.log("\n----- 结算界面点击检测开始 -----");
        console.log("点击位置：", x, y);
        
        // 检查重新开始按钮
        if (this.restart_btn_rect) {
            console.log("重新开始按钮区域：", this.restart_btn_rect);
            if (this.isPointInButton(x, y, this.restart_btn_rect)) {
                console.log("点击了重新开始按钮");
                if (this.callbacks.onRestart) {
                    this.callbacks.onRestart();
                }
                return "restart";
            }
        }
        
        // 检查下一关按钮
        if (this.next_btn_rect) {
            console.log("下一关按钮区域：", this.next_btn_rect);
            if (this.isPointInButton(x, y, this.next_btn_rect)) {
                console.log("点击了下一关按钮");
                if (this.callbacks.onNextLevel) {
                    this.callbacks.onNextLevel();
                }
                return "next";
            }
        } else {
            console.log("下一关按钮区域未设置或未激活");
        }
        
        console.log("点击位置不在任何按钮区域内");
        return null;
    }

    handleSettingsClick(x, y) {
        const result = this.settings_manager.handleClick(x, y);
        if (result === 'back') {
            // 返回游戏界面
            this.current_state = GAME_STATES.GAME;
            // 同时更新游戏管理器的状态
            if (this.gameManager) {
                this.gameManager.state = GAME_STATES.GAME;
                this.gameManager.gameState.state = GAME_STATES.GAME;
            }
            if (this.audio_manager) {
                this.audio_manager.playRight();
            }
            // 重新绘制游戏界面
            this.drawGameScreen();
            return true;  // 表示点击已处理
        } else if (result === 'toggle_music') {
            if (this.audio_manager) {
                this.audio_manager.setMusicEnabled(this.settings_manager.music_enabled);
            }
            // 重绘设置界面
            this.drawSettingsScreen();
            return true;  // 表示点击已处理
        } else if (result === 'toggle_sound') {
            if (this.audio_manager) {
                this.audio_manager.setSoundEnabled(this.settings_manager.sound_enabled);
            }
            // 重绘设置界面
            this.drawSettingsScreen();
            return true;  // 表示点击已处理
        } else if (result && result.startsWith('select_dynasty_')) {
            const dynasty = result.replace('select_dynasty_', '');
            if (this.gameManager) {
                this.gameManager.setCurrentDynasty(dynasty);
            }
            // 重绘设置界面
            this.drawSettingsScreen();
            return true;  // 表示点击已处理
        }
        return false;  // 表示点击未处理
    }

    handleLevelSelectClick(x, y) {
        console.log('处理关卡选择界面点击，坐标:', x, y);
        
        // 检查返回按钮
        if (this.isPointInButton(x, y, {x: 20, y: 20, width: 80, height: 40})) {
            console.log('点击了返回按钮');
            this.current_state = GAME_STATES.SETTINGS;
            if (this.gameManager) {
                this.gameManager.state = GAME_STATES.SETTINGS;
                this.gameManager.gameState.state = GAME_STATES.SETTINGS;
                this.gameManager.updateUI();
            }
            return;
        }
        
        // 检查关卡按钮
        if (this.levelButtons) {
            for (const [levelId, button] of Object.entries(this.levelButtons)) {
                if (this.isPointInButton(x, y, button)) {
                    console.log('点击了关卡:', levelId);
                    const level = this.gameManager.levelManager.levels.find(l => l.id === parseInt(levelId));
                    if (level && level.unlocked) {
                        this.gameManager.loadLevel(parseInt(levelId));
                    }
                    return;
                }
            }
        }
    }

    isPointInButton(x, y, button) {
        if (!button) {
            console.warn('按钮对象未定义');
            return false;
        }
        
        // 直接使用画布坐标系统进行检测
        const result = x >= button.x && 
                      x <= button.x + button.width && 
                      y >= button.y && 
                      y <= button.y + button.height;
        
        console.log('点击检测:', {
            点击坐标: {x, y},
            按钮区域: button,
            是否命中: result
        });
        
        return result;
    }

    // 辅助方法：文本换行
    wrapText(text, maxWidth) {
        const words = text.split('');
        const lines = [];
        let currentLine = '';
        
        this.ctx.font = `${UI_CONFIG.TEXT_SIZE}px ${UI_CONFIG.FONT_FAMILY}`;
        
        for (const word of words) {
            const width = this.ctx.measureText(currentLine + word).width;
            if (width < maxWidth) {
                currentLine += word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines;
    }

    // 辅助方法：绘制圆角矩形
    roundRect(x, y, width, height, radius, fill, stroke) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        if (fill) {
            this.ctx.fill();
        }
        if (stroke) {
            this.ctx.stroke();
        }
    }

    // 更新显示
    update(gameState) {
        if (!gameState) {
            console.error('游戏状态为空');
            return;
        }
        console.log('更新UI，当前状态:', gameState.state);

        // 保存当前游戏状态
        this.currentGameState = gameState;
                this.current_state = gameState.state;

        // 清除画布
        this.clear();

        // 根据当前UI状态绘制相应界面
        switch (this.current_state) {
            case GAME_STATES.LOADING:
                this.drawLoadingScreen();
                break;
            case GAME_STATES.MAIN_MENU:
                this.drawMainMenu();
                break;
            case GAME_STATES.GAME:
                this.drawGameScreen();
                break;
            case GAME_STATES.SETTLEMENT:
                this.drawSettlementScreen(gameState);
                break;
            case GAME_STATES.SETTINGS:
                this.drawSettingsScreen();
                break;
            case GAME_STATES.LEVEL_SELECT:
                this.drawLevelSelectScreen(gameState);
                break;
            default:
                console.warn('未知的游戏状态:', this.current_state);
                this.drawMainMenu(); // 默认显示主菜单
        }
    }

    drawSettingsScreen() {
        this.settings_manager.draw(this.ctx);
    }

    // 修改clearTips方法
    clearTips() {
        console.log('清空提示状态');
        this.show_tips1 = false;
        this.show_tips2 = false;
        // 确保在游戏管理器中也重置提示状态
        if (this.gameManager) {
            this.gameManager.tips_click_count = 0;
            this.gameManager.updateUI();
        }
    }

    updateMainScreen(score, attempts_left, level_id, tips1, tips2, all_text, selected_texts, display_texts, wrong_indices, correct_indices, current_dynasty) {
        // ... existing code ...
        
        // 绘制设置按钮
        if (this.ui_images.settings && this.ui_images.settings.complete) {
            ctx.drawImage(this.ui_images.settings, 330, 22);
        }
        
        // 保存设置按钮的点击区域
        this.settingsButton = {
            x: 330,
            y: 22,
            width: 40,
            height: 40
        };
        
        // ... existing code ...
    }

    drawLevelSelectScreen(gameState) {
        console.log('绘制关卡选择界面');
        // 清空画布
        this.clear();
        
        // 绘制背景
        this.ctx.fillStyle = UI_CONFIG.BACKGROUND_COLOR;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制返回按钮
        const returnBtn = this.ui_images.return_btn;
        if (returnBtn && returnBtn.complete) {
            this.ctx.drawImage(returnBtn, 20, 20);
        }
        
        // 设置标题区域的保护高度
        const titleProtectionHeight = 90;
        
        // 绘制朝代标题
        const dynastyName = this.gameManager.levelManager._getDynastyName(gameState.current_dynasty);
        this.ctx.font = 'bold 34px "STXINWEI", SimHei';
        this.ctx.fillStyle = '#000000';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(dynastyName, this.canvas.width / 2, 55);
        
        // 在标题区域底部绘制分隔线
        this.ctx.beginPath();
        this.ctx.moveTo(0, titleProtectionHeight);
        this.ctx.lineTo(420, titleProtectionHeight);
        this.ctx.strokeStyle = '#C8C8C8';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 绘制关卡网格
        const buttonSize = 85;  // 与Python相同的按钮大小
        const maxPerRow = 4;    // 每行4个
        const screenWidth = 420;
        
        // 计算间距（与Python相同的计算方式）
        const totalWidth = buttonSize * maxPerRow;
        const remainingWidth = screenWidth - totalWidth;
        const spacing = remainingWidth / (maxPerRow + 1);
        const startX = spacing;
        const startY = 116;  // 与Python相同的起始Y坐标
        
        // 滚动相关
        if (!this.scroll_y) this.scroll_y = 0;
        
        if (this.gameManager.levelManager && this.gameManager.levelManager.levels) {
            const levels = this.gameManager.levelManager.levels;
            console.log('绘制关卡列表，共', levels.length, '个关卡');
            
            // 计算最大可滚动距离
            const totalRows = Math.ceil(levels.length / maxPerRow);
            const totalHeight = totalRows * (buttonSize + spacing);
            const screenHeight = 500;
            this.max_scroll = Math.max(0, totalHeight - screenHeight + 100);
            
            // 绘制关卡按钮
            for (let i = 0; i < levels.length; i++) {
                const level = levels[i];
                const row = Math.floor(i / maxPerRow);
                const col = i % maxPerRow;
                const x = startX + col * (buttonSize + spacing);
                const y = startY + row * (buttonSize + spacing) - this.scroll_y;
                
                // 如果按钮位置会超出标题区域，跳过绘制
                if (y < titleProtectionHeight) continue;
                
                // 绘制按钮背景
                if (level.unlocked) {
                    // 绘制关卡背景
                    this.ctx.fillStyle = UI_CONFIG.BUTTON_COLOR;
                    this.roundRect(x, y, buttonSize, buttonSize, 10, true, false);
                    
                    // 绘制关卡编号
                    this.ctx.font = '24px "STXINWEI", SimHei';
                    this.ctx.fillStyle = '#000000';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(`第${level.id}关`, x + buttonSize/2, y + 25);
                    
                    // 绘制星星
                    const starSize = 20;
                    const starSpacing = 25;
                    const starY = y + 50;
                    
                    for (let j = 0; j < 3; j++) {
                        const starX = x + 7 + j * starSpacing;
                        const starImage = j < level.stars ? this.ui_images.star_black : this.ui_images.star_white;
                        if (starImage && starImage.complete) {
                            this.ctx.drawImage(starImage, starX, starY, starSize, starSize);
                        }
                    }
                } else {
                    // 绘制锁定状态
                    this.ctx.fillStyle = '#CCCCCC';
                    this.roundRect(x, y, buttonSize, buttonSize, 10, true, false);
                    
                    // 绘制锁图标
                    const lockImg = this.ui_images.lock;
                    if (lockImg && lockImg.complete) {
                        const lockX = x + (buttonSize - lockImg.width) / 2;
                        const lockY = y + (buttonSize - lockImg.height) / 2;
                        this.ctx.drawImage(lockImg, lockX, lockY);
                    }
                }
                
                // 保存关卡按钮的点击区域
                this.levelButtons = this.levelButtons || {};
                this.levelButtons[level.id] = {
                    x: x,
                    y: y,
                    width: buttonSize,
                    height: buttonSize
                };
            }
            
            // 绘制滚动条
            if (this.max_scroll > 0) {
                const scrollHeight = 200;  // 滚动条高度
                const scrollWidth = 10;    // 滚动条宽度
                const scrollX = 400;       // 滚动条x坐标
                
                // 计算滚动条位置
                const scrollRatio = this.scroll_y / this.max_scroll;
                const scrollY = 200 + scrollRatio * (400 - scrollHeight);
                
                // 绘制滚动条背景
                this.ctx.fillStyle = '#C8C8C8';
                this.ctx.fillRect(scrollX, 200, scrollWidth, 400);
                
                // 绘制滚动条
                this.ctx.fillStyle = '#646464';
                this.ctx.fillRect(scrollX, scrollY, scrollWidth, scrollHeight);
            }
        } else {
            console.warn('没有找到关卡数据');
        }
    }
}