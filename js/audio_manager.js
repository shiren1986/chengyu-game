// audio_manager.js

export class AudioManager {
    constructor() {
        this.sounds = {};
        this.musicEnabled = true;
        this.soundEnabled = true;
        this.preloadedSounds = {};
        console.log("初始化声音管理器");
    }

    async initialize() {
        console.log('初始化音频管理器...');
        try {
            // 加载音效文件
            this.sounds = {
                'right': new Audio('/assets/sounds/right.mp3'),
                'error': new Audio('/assets/sounds/error.mp3'),
                'bgm': new Audio('/assets/sounds/music_bg.mp3')
            };

            // 设置音量和错误处理
            Object.values(this.sounds).forEach(sound => {
                sound.volume = 0.5;
                sound.onerror = (e) => {
                    console.error(`加载音效文件时出错: ${e.target.src}`);
                };
            });

            // 设置背景音乐循环
            if (this.sounds.bgm) {
                this.sounds.bgm.loop = true;
                this.sounds.bgm.volume = 0.3;
            }

            // 预加载音频
            await this.preloadAudio();

            console.log('音频管理器初始化完成');
        } catch (error) {
            console.error("初始化音频管理器时出错:", error);
        }
    }

    async preloadAudio() {
        console.log('开始预加载音频文件...');
        const soundFiles = {
            'right': '/assets/sounds/right.mp3',
            'error': '/assets/sounds/error.mp3',
            'bgm': '/assets/sounds/music_bg.mp3'
        };

        const loadPromises = [];
        for (const [key, path] of Object.entries(soundFiles)) {
            const audio = new Audio();
            audio.src = path;
            this.preloadedSounds[key] = audio;
            
            const loadPromise = new Promise((resolve, reject) => {
                audio.oncanplaythrough = resolve;
                audio.onerror = reject;
            });
            loadPromises.push(loadPromise);
            
            console.log(`预加载音频: ${key}`);
        }

        try {
            await Promise.all(loadPromises);
            console.log('所有音频文件预加载完成');
        } catch (error) {
            console.error('音频预加载出错:', error);
        }
    }

    playSound(soundName) {
        if (!this.soundEnabled) return;
        
        const soundPath = `assets/sounds/${soundName}.mp3`;
        console.log(`播放音效: ${soundPath}`);
        
        try {
            const audio = new Audio(soundPath);
            audio.play().catch(error => {
                console.error(`播放音效失败: ${soundName}`, error);
            });
        } catch (error) {
            console.error(`加载音效失败: ${soundName}`, error);
        }
    }

    playRight() {
        return this.playSound('right');
    }

    playError() {
        return this.playSound('error');
    }

    playMusic() {
        if (!this.musicEnabled) {
            console.log('音乐已禁用');
            return;
        }

        try {
            if (this.sounds.bgm) {
                return this.sounds.bgm.play();
            }
        } catch (error) {
            console.warn('播放背景音乐时出错:', error);
        }
    }

    stopMusic() {
        try {
            if (this.sounds.bgm) {
                this.sounds.bgm.pause();
                this.sounds.bgm.currentTime = 0;
            }
        } catch (error) {
            console.warn('停止背景音乐时出错:', error);
        }
    }

    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
        if (!enabled) {
            this.stopMusic();
        } else {
            this.playMusic();
        }
        console.log(`音乐已${enabled ? '启用' : '禁用'}`);
    }

    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
        console.log(`音效已${enabled ? '启用' : '禁用'}`);
    }

    // 便捷方法
    playClick() {
        return this.playSound('right');
    }

    playComplete() {
        return this.playSound('right');
    }
} 