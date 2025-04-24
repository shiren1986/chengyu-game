// constants.js

// 朝代顺序
export const DYNASTY_ORDER = [
    ['xianqin', '先秦'],
    ['han', '汉'],
    ['sanguo', '魏晋'],
    ['tang', '唐'],
    ['song', '宋'],
    ['yuan', '元'],
    ['ming', '明'],
    ['qing', '清']
];

// 游戏配置
export const GAME_CONFIG = {
    MAX_ATTEMPTS: 3,  // 最大尝试次数
    INITIAL_SCORE: 0,  // 初始分数
    POINTS_PER_CORRECT: 10,  // 每个正确答案的分数
    POINTS_PER_WRONG: -5,  // 每个错误答案的分数
    SCORE_PER_LEVEL: 100,  // 每关基础分数
    STAR_THRESHOLDS: [3, 2, 1],  // 星级阈值
};

// UI配置
export const UI_CONFIG = {
    CANVAS_WIDTH: 420,
    CANVAS_HEIGHT: 800,
    TEXT_SIZE: 24,  // 基础字体大小
    TITLE_SIZE: 36,
    LARGE_TEXT_SIZE: 36,  // 大字体大小
    MEDIUM_TEXT_SIZE: 20,  // 中等字体大小
    SMALL_TEXT_SIZE: 16,  // 小字体大小
    BUTTON_WIDTH: 120,  // 修改为底部按钮的宽度
    BUTTON_HEIGHT: 50,  // 修改为底部按钮的高度
    BUTTON_MARGIN: 20,
    TEXT_COLOR: '#000000',
    BUTTON_COLOR: '#4CAF50',
    BUTTON_HOVER_COLOR: '#45a049',
    BUTTON_TEXT_COLOR: '#ffffff',
    SETTINGS_BUTTON_COLOR: '#2196F3',
    BACKGROUND_COLOR: '#ffffff',
    
    // 字体配置
    FONT_FAMILY: '"Microsoft YaHei", "SimHei", sans-serif',
    
    // 文字块配置
    TEXT_BLOCK: {
        WIDTH: 76,  // 修改为正确的宽度
        HEIGHT: 76,  // 修改为正确的高度
        MARGIN: 10,
        SPACING: 109,  // X轴间隔
        ROW_SPACING: 90,  // Y轴间隔
        START_X: 15,  // 起始X坐标
        START_Y: 130  // 起始Y坐标
    },
    
    // 按钮配置
    CONTINUE_BUTTON: {
        x: 110,
        y: 500,
        width: 200,
        height: 60,
        text: '继续'
    },
    
    // 设置按钮配置
    SETTINGS_BUTTON: {
        x: 330,
        y: 22,
        width: 40,
        height: 40
    }
};

// 游戏状态
export const GAME_STATES = {
    LOADING: 'LOADING',
    MAIN_MENU: 'MAIN_MENU',
    GAME: 'GAME',
    SETTINGS: 'SETTINGS',
    SETTLEMENT: 'SETTLEMENT',
    LEVEL_SELECT: 'LEVEL_SELECT'
};

// 存储键名
export const STORAGE_KEYS = {
    GAME_STATE: 'game_state',
    UNLOCKED_LEVELS: 'unlocked_levels',
    HIGH_SCORES: 'high_scores',
}; 