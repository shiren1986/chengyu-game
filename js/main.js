import { GameManager } from './game_manager.js';
import { UIManager } from './ui_manager.js';
import { DataStorage } from './data_storage.js';
import { ConfigLoader } from './config_loader.js';
import { GAME_STATES } from './constants.js';

class Game {
    constructor() {
        this.initialize();
    }

    async initialize() {
        try {
            console.log('初始化游戏...');
            
            // 创建配置加载器
            this.configLoader = new ConfigLoader('configs');
            
            // 创建数据存储
            this.dataStorage = new DataStorage(this.configLoader);
            
            // 创建游戏管理器
            this.gameManager = new GameManager(this.configLoader, this.dataStorage);
            
            // 获取canvas元素
            const canvas = document.getElementById('game-canvas');
            if (!canvas) {
                throw new Error('找不到canvas元素');
            }
            
            // 创建UI管理器
            this.uiManager = new UIManager(canvas);
            
            // 设置UI管理器和游戏管理器的相互引用
            this.uiManager.setGameManager(this.gameManager);
            this.gameManager.uiManager = this.uiManager;
            
            // 初始化游戏管理器
            await this.gameManager.initialize();
            
            // 显示加载界面
            this.uiManager.drawLoadingScreen();
            
            // 加载保存的游戏状态
            const savedState = this.dataStorage.loadGameState();
            if (savedState) {
                console.log("加载保存的游戏状态");
                if (await this.gameManager.loadGameState(savedState)) {
                    console.log(`成功加载到第 ${this.gameManager.level_id} 关`);
                } else {
                    console.log("加载游戏状态失败，开始新游戏");
                    await this.gameManager.startNewGame();
                }
            } else {
                console.log("没有找到保存的游戏状态，开始新游戏");
                await this.gameManager.startNewGame();
            }
            
            // 设置UI回调函数
            this.uiManager.setCallbacks({
                onStartGame: () => this.gameManager.startNewGame(),
                onShowSettings: () => this.gameManager.showSettings(),
                onUndo: () => this.gameManager.undoLastMove(),
                onTextClick: (index) => this.gameManager.handleTextSelection(index),
                onRestart: () => this.gameManager.handleSettlementAction("restart"),
                onNextLevel: () => this.gameManager.handleSettlementAction("next")
            });
            
            console.log('游戏初始化完成');
        } catch (error) {
            console.error('初始化游戏时出错:', error);
            throw error;
        }
    }

    setupEventListeners() {
        document.addEventListener('click', (event) => {
            const state = this.gameManager.getCurrentState();
            switch (state) {
                case GAME_STATES.MAIN_MENU:
                    this.handleMainMenuClick(event);
                    break;
                case GAME_STATES.GAME:
                    this.handleGameClick(event);
                    break;
                case GAME_STATES.GAME_OVER:
                    this.handleGameOverClick(event);
                    break;
            }
        });
    }

    handleMainMenuClick(event) {
        if (this.uiManager.isStartButtonClicked(event)) {
            this.gameManager.startNewGame();
            this.uiManager.updateGameState();
        }
    }

    handleGameClick(event) {
        if (this.uiManager.isUndoButtonClicked(event)) {
            this.uiManager.undoLastMove();
        } else {
            const answer = this.uiManager.getAnswerFromClick(event);
            if (answer) {
                const isCorrect = this.gameManager.checkAnswer(answer);
                this.uiManager.updateGameState(isCorrect);
                
                if (this.gameManager.isGameOver()) {
                    this.gameManager.setCurrentState(GAME_STATES.GAME_OVER);
                    this.uiManager.showGameOver();
                }
            }
        }
    }

    handleGameOverClick(event) {
        if (this.uiManager.isContinueButtonClicked(event)) {
            this.gameManager.setCurrentState(GAME_STATES.MAIN_MENU);
            this.uiManager.updateGameState();
        }
    }
}

// 当页面加载完成时启动游戏
window.addEventListener('load', () => {
    new Game();
}); 