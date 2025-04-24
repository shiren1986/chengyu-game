import { UI_CONFIG, DYNASTY_ORDER } from './constants.js';
import { AudioManager } from './audio_manager.js';

export class SettingsManager {
    constructor(game_manager) {
        console.log("----- SettingsManager 构造函数开始 -----");
        
        // 初始化音频管理器
        this.audio_manager = new AudioManager();
        
        // 从localStorage加载设置
        this.music_enabled = localStorage.getItem('music_enabled') !== 'false';
        this.sound_enabled = localStorage.getItem('sound_enabled') !== 'false';
        this.current_dynasty = this._loadCurrentDynasty();
        
        console.log('初始化设置状态:', {
            音乐: this.music_enabled ? '开启' : '关闭',
            音效: this.sound_enabled ? '开启' : '关闭',
            当前朝代: this.current_dynasty
        });
        
        // 加载UI资源
        this.ui_images = {
            return_btn: new Image(),
            switch_on: new Image(),
            switch_off: new Image(),
            dynasty_bg: new Image(),
            dynasty_current: new Image(),
            star_icon: new Image()
        };

        // 设置图片路径
        this.ui_images.return_btn.src = 'assets/UI/return.png';
        this.ui_images.switch_on.src = 'assets/UI/open.png';
        this.ui_images.switch_off.src = 'assets/UI/closed.png';
        this.ui_images.dynasty_bg.src = 'assets/UI/chaodai_1.png';
        this.ui_images.dynasty_current.src = 'assets/UI/chaodai_0.png';
        this.ui_images.star_icon.src = 'assets/UI/star.png';

        // 监听图片加载
        let loadedImages = 0;
        const totalImages = Object.keys(this.ui_images).length;

        const onImageLoad = () => {
            loadedImages++;
            console.log(`图片加载进度: ${loadedImages}/${totalImages}`);
            if (loadedImages === totalImages) {
                console.log('所有UI图片加载完成');
            }
        };

        // 为每个图片添加加载事件监听
        Object.entries(this.ui_images).forEach(([key, img]) => {
            img.onload = () => {
                console.log(`图片加载成功: ${key}`);
                onImageLoad();
            };
            img.onerror = (e) => {
                console.error(`图片加载失败: ${key}`, e);
                loadedImages++; // 即使加载失败也继续计数
            };
        });

        // 布局参数
        this.layout = {
            entry_width: 190,
            entry_height: 90,
            h_spacing: 20,
            v_spacing: 15,
            start_x: 10,
            start_y: 190
        };

        // 计算第二列的x坐标
        this.second_col_x = this.layout.start_x + this.layout.entry_width + this.layout.h_spacing;

        // 朝代配置
        this.dynasties = [
            { id: 'xianqin', name: '先秦', 
              pos: [this.layout.start_x, this.layout.start_y] },
            { id: 'han', name: '汉', 
              pos: [this.second_col_x, this.layout.start_y] },
            { id: 'sanguo', name: '魏晋', 
              pos: [this.layout.start_x, this.layout.start_y + this.layout.entry_height + this.layout.v_spacing] },
            { id: 'tang', name: '唐', 
              pos: [this.second_col_x, this.layout.start_y + this.layout.entry_height + this.layout.v_spacing] },
            { id: 'song', name: '宋', 
              pos: [this.layout.start_x, this.layout.start_y + (this.layout.entry_height + this.layout.v_spacing) * 2] },
            { id: 'yuan', name: '元', 
              pos: [this.second_col_x, this.layout.start_y + (this.layout.entry_height + this.layout.v_spacing) * 2] },
            { id: 'ming', name: '明', 
              pos: [this.layout.start_x, this.layout.start_y + (this.layout.entry_height + this.layout.v_spacing) * 3] },
            { id: 'qing', name: '清', 
              pos: [this.second_col_x, this.layout.start_y + (this.layout.entry_height + this.layout.v_spacing) * 3] }
        ];

        this.game_manager = game_manager;
        this.selected_dynasty = this.game_manager ? this.game_manager.current_dynasty : 'xianqin';

        console.log("----- SettingsManager 构造函数完成 -----");
    }

    // 加载当前朝代
    _loadCurrentDynasty() {
        return localStorage.getItem('current_dynasty') || 'xianqin';
    }

    // 保存当前朝代
    _saveCurrentDynasty(dynasty) {
        localStorage.setItem('current_dynasty', dynasty);
        this.current_dynasty = dynasty;
    }

    // 绘制开关
    drawSwitch(ctx, text, x, y, enabled) {
        // 绘制文本
        ctx.font = `${UI_CONFIG.TEXT_SIZE}px ${UI_CONFIG.FONT_FAMILY}`;
        ctx.fillStyle = UI_CONFIG.TEXT_COLOR;
        ctx.textAlign = 'left';
        ctx.fillText(text, x, y + 25);

        // 绘制开关
        const switchImg = enabled ? this.ui_images.switch_on : this.ui_images.switch_off;
        if (switchImg.complete) {
            ctx.drawImage(switchImg, x + 120, y);
        }
    }

    // 绘制朝代入口
    drawDynastyEntry(ctx, dynasty) {
        const [x, y] = dynasty.pos;
        const img = dynasty.id === this.current_dynasty ? 
                   this.ui_images.dynasty_current : 
                   this.ui_images.dynasty_bg;

        if (img.complete) {
            ctx.drawImage(img, x, y);
        }

        // 绘制朝代名称
        ctx.font = `${UI_CONFIG.TEXT_SIZE}px ${UI_CONFIG.FONT_FAMILY}`;
        ctx.fillStyle = UI_CONFIG.TEXT_COLOR;
        ctx.textAlign = 'center';
        ctx.fillText(dynasty.name, 
                    x + this.layout.entry_width / 2, 
                    y + this.layout.entry_height / 2);
    }

    // 绘制设置界面
    draw(ctx) {
        // 填充白色背景
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // 绘制返回按钮
        if (this.ui_images.return_btn.complete) {
            ctx.drawImage(this.ui_images.return_btn, 20, 20);
        }
        
        // 绘制声音设置标题
        ctx.font = '34px STXINWEI';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'right';
        const title = ctx.measureText('声音设置');
        ctx.fillText('声音设置', 280, 40);
        
        // 绘制音乐和音效开关
        this._drawSwitch(ctx, '音乐', 50, 70, this.music_enabled);
        this._drawSwitch(ctx, '音效', 50, 110, this.sound_enabled);
        
        console.log('当前设置状态:', {
            音乐: this.music_enabled ? '开启' : '关闭',
            音效: this.sound_enabled ? '开启' : '关闭'
        });
        
        // 绘制朝代选择标题
        ctx.font = '34px STXINWEI';
        ctx.fillText('朝代选择', 280, 160);
        
        // 绘制分隔线
        ctx.beginPath();
        ctx.moveTo(20, 180);
        ctx.lineTo(400, 180);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 绘制朝代入口
        this.dynasties.forEach(dynasty => {
            this._drawDynastyEntry(ctx, dynasty);
        });
    }

    _drawSwitch(ctx, text, x, y, enabled) {
        // 绘制文字
        ctx.font = '20px STXINWEI';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'right';
        ctx.fillText(text, x + 50, y + 15);
        
        // 绘制开关图标 - 修正逻辑：enabled为true时显示open.png，为false时显示closed.png
        const switchImg = enabled ? this.ui_images.switch_on : this.ui_images.switch_off;
        if (switchImg && switchImg.complete) {
            ctx.drawImage(switchImg, x + 280, y + 5);
            console.log(`绘制${text}开关:`, {
                状态: enabled ? '开启' : '关闭',
                图片: enabled ? 'open.png' : 'closed.png',
                实际图片: switchImg.src
            });
        } else {
            console.warn(`${text}开关图片未加载完成`);
        }
        
        // 保存开关区域
        const rect = {
            x: x + 280,
            y: y + 5,
            width: switchImg ? switchImg.width : 40,
            height: switchImg ? switchImg.height : 40
        };
        
        if (text === '音乐') {
            this.music_switch_rect = rect;
        } else {
            this.sound_switch_rect = rect;
        }
    }

    async _drawDynastyEntry(ctx, dynasty) {
        const [x, y] = dynasty.pos;
        
        // 获取背景图片
        const bgImage = dynasty.id === this.current_dynasty ? 
                       this.ui_images.dynasty_current : 
                       this.ui_images.dynasty_bg;
        
        // 绘制背景图片
        if (bgImage.complete) {
            ctx.drawImage(bgImage, x, y);
        }
        
        // 绘制朝代名称
        ctx.font = '28px STXINWEI';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.fillText(dynasty.name, x + this.layout.entry_width/2, y + 30);
        
        // 绘制星星图标
        if (this.ui_images.star_icon.complete) {
            const starImg = this.ui_images.star_icon;
            ctx.drawImage(starImg, x + 15, y + 60, 15, 15);
        }
        
        // 获取并绘制进度
        const progress = await this._getDynastyProgress(dynasty.id);
        ctx.font = '20px STXINWEI';
        ctx.textAlign = 'left';
        ctx.fillText(`${progress.earned}/${progress.total}`, x + 70, y + 70);

        // 保存点击区域
        dynasty.bounds = {
            x: x,
            y: y,
            width: this.layout.entry_width,
            height: this.layout.entry_height
        };
    }

    async _getDynastyProgress(dynasty_id) {
        try {
            // 从localStorage获取分数数据
            const scoreData = JSON.parse(localStorage.getItem('score_save') || '{}');
            const dynastyScores = scoreData[dynasty_id] || {};
            
            // 计算已获得的星星数
            let earnedStars = 0;
            Object.values(dynastyScores).forEach(levelData => {
                const score = levelData.score || 0;
                if (score >= 100) earnedStars += 3;
                else if (score >= 80) earnedStars += 2;
                else if (score >= 60) earnedStars += 1;
            });
            
            // 获取该朝代的总关卡数
            const totalLevels = await this._getTotalLevels(dynasty_id);
            const totalStars = totalLevels * 3;
            
            return {
                earned: earnedStars,
                total: totalStars
            };
        } catch (error) {
            console.error('获取朝代进度时出错:', error);
            return { earned: 0, total: 0 };
        }
    }

    async _getTotalLevels(dynasty_id) {
        try {
            // 从配置文件中获取关卡数据
            const response = await fetch(`configs/${dynasty_id}.csv`);
            if (!response.ok) {
                throw new Error(`无法加载朝代 ${dynasty_id} 的关卡数据`);
            }
            const csvText = await response.text();
            
            // 计算实际关卡数（减去标题行）
            const lines = csvText.split('\n').filter(line => line.trim());
            const levelCount = lines.length - 1;
            
            console.log(`朝代 ${dynasty_id} 的实际关卡数：${levelCount}`);
            return levelCount;
        } catch (error) {
            console.error(`获取朝代 ${dynasty_id} 的关卡数量时出错:`, error);
            return 0;
        }
    }

    // 处理点击事件
    handleClick(x, y) {
        console.log('处理点击事件:', x, y);
        
        // 检查返回按钮点击
        if (x >= 20 && x <= 70 && y >= 20 && y <= 70) {
            console.log('点击返回按钮');
            if (this.audio_manager) {
                this.audio_manager.playRight();
            }
            return 'back';
        }
        
        // 检查音乐开关点击
        if (this.music_switch_rect && this.isPointInRect(x, y, this.music_switch_rect)) {
            console.log('点击音乐开关');
            this.music_enabled = !this.music_enabled;
            localStorage.setItem('music_enabled', this.music_enabled);
            if (this.audio_manager) {
                this.audio_manager.playRight();
            }
            console.log('音乐状态更新为:', this.music_enabled ? '开启' : '关闭');
            return 'toggle_music';
        }
        
        // 检查音效开关点击
        if (this.sound_switch_rect && this.isPointInRect(x, y, this.sound_switch_rect)) {
            console.log('点击音效开关');
            this.sound_enabled = !this.sound_enabled;
            localStorage.setItem('sound_enabled', this.sound_enabled);
            if (this.audio_manager) {
                this.audio_manager.playRight();
            }
            console.log('音效状态更新为:', this.sound_enabled ? '开启' : '关闭');
            return 'toggle_sound';
        }
        
        // 检查朝代点击
        for (const dynasty of this.dynasties) {
            if (dynasty.bounds && this.isPointInRect(x, y, dynasty.bounds)) {
                console.log('点击朝代:', dynasty.id);
                if (this.audio_manager) {
                    this.audio_manager.playRight();
                }
                // 确保使用正确的朝代 ID
                const dynastyId = dynasty.id === 'weijin' ? 'sanguo' : dynasty.id;
                this._saveCurrentDynasty(dynastyId);
                // 通知 game_manager 切换到关卡列表界面
                if (this.game_manager) {
                    this.game_manager.setCurrentDynasty(dynastyId);
                    this.game_manager.setCurrentState('LEVEL_SELECT');
                }
                return `select_dynasty_${dynastyId}`;
            }
        }
        
        return null;
    }

    // 初始化
    async initialize() {
        // 从localStorage加载设置
        this.music_enabled = localStorage.getItem('music_enabled') !== 'false';
        this.sound_enabled = localStorage.getItem('sound_enabled') !== 'false';
        this.current_dynasty = this._loadCurrentDynasty();
        
        // 确保图片正确加载
        this.ui_images.switch_on.src = 'assets/UI/open.png';
        this.ui_images.switch_off.src = 'assets/UI/closed.png';
        
        console.log('初始化设置:', {
            music_enabled: this.music_enabled,
            sound_enabled: this.sound_enabled,
            current_dynasty: this.current_dynasty
        });

        // 绘制所有朝代入口
        for (let i = 0; i < this.dynasties.length; i++) {
            const x = this.dynasties[i].pos[0];
            const y = this.dynasties[i].pos[1];
            await this._drawDynastyEntry(this.ctx, this.dynasties[i]);
        }
    }

    handleDynastySelection(dynasty_id) {
        if (this.dynasties.find(d => d.id === dynasty_id)) {
            this.selected_dynasty = dynasty_id;
            this.game_manager.setCurrentDynasty(dynasty_id);
            return true;
        }
        return false;
    }

    isPointInRect(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.width &&
               y >= rect.y && y <= rect.y + rect.height;
    }
} 

