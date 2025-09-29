

// 游戏配置
const GAME_CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    TANK_SIZE: 40,
    BULLET_SIZE: 6,
    TANK_SPEED: 3,
    BULLET_SPEED: 8,
    ENEMY_SPAWN_INTERVAL: 3000, // 3秒
    MAX_ENEMIES: 5
};

// 游戏状态
let gameState = {
    isRunning: false,
    isPaused: false,
    score: 0,
    playerHealth: 3,
    enemyCount: 0,
    enemyKilled: 0, // 新增：杀死敌方坦克数量
    currentEnemyLevel: 1 // 新增：当前敌方坦克等级
};

// 获取canvas和context
let canvas, ctx;

try {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        throw new Error('Canvas元素未找到');
    }
    
    ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('无法获取Canvas 2D上下文');
    }
    
    console.log('✅ Canvas初始化成功:', canvas.width, 'x', canvas.height);
} catch (error) {
    console.error('❌ Canvas初始化失败:', error);
    alert('游戏初始化失败：' + error.message + '\n请使用现代浏览器打开游戏。');
}

// 玩家信息
let currentPlayerName = '';

// 排行榜数据
let leaderboard = [];

// 游戏是否已初始化
let gameInitialized = false;

// ===========================================
// 📋 分离式输入控制系统架构
// ===========================================

// 输入状态管理
const InputManager = {
    // 键盘输入状态
    keyboard: {
        up: false,
        down: false,
        left: false,
        right: false,
        space: false
    },
    
    // 鼠标输入状态
    mouse: {
        x: 0,
        y: 0,
        isPressed: false,
        angle: 0  // 相对于坦克的角度
    },
    
    // 最终动作输出
    actions: {
        moveX: 0,
        moveY: 0,
        turretAngle: 0,
        shouldShoot: false
    },
    
    // 更新最终动作
    updateActions: function(playerTank) {
        console.log('🎮 更新输入动作...', {
            keyboard: this.keyboard,
            mouse: this.mouse
        });
        
        // 1️⃣ 处理移动输入（键盘）
        this.actions.moveX = 0;
        this.actions.moveY = 0;
        
        if (this.keyboard.up) {
            this.actions.moveY = -1;
            console.log('⬆️ 向上移动');
        }
        if (this.keyboard.down) {
            this.actions.moveY = 1;
            console.log('⬇️ 向下移动');
        }
        if (this.keyboard.left) {
            this.actions.moveX = -1;
            console.log('⬅️ 向左移动');
        }
        if (this.keyboard.right) {
            this.actions.moveX = 1;
            console.log('➡️ 向右移动');
        }
        
        // 2️⃣ 处理炮塔角度（鼠标）
        if (playerTank && gameState.isRunning) {
            const dx = this.mouse.x - playerTank.x;
            const dy = this.mouse.y - playerTank.y;
            this.actions.turretAngle = Math.atan2(dy, dx);
        }
        
        // 3️⃣ 处理射击输入（键盘空格 或 鼠标左键）
        this.actions.shouldShoot = this.keyboard.space || this.mouse.isPressed;
        
        console.log('🎯 最终动作输出:', this.actions);
        
        return this.actions;
    },
    
    // 重置所有输入
    reset: function() {
        this.keyboard = {
            up: false, down: false, left: false, right: false, space: false
        };
        this.mouse = {
            x: 0, y: 0, isPressed: false, angle: 0
        };
        this.actions = {
            moveX: 0, moveY: 0, turretAngle: 0, shouldShoot: false
        };
    }
};

// ===========================================
// ⌨️ 键盘输入监听器
// ===========================================
const KeyboardManager = {
    setup: function() {
        console.log('⌨️ 设置键盘输入监听器...');
        
        document.addEventListener('keydown', (event) => {
            const key = event.code;
            console.log('⌨️ 键盘按下:', key);
            
            // 防止页面滚动
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
                event.preventDefault();
            }
            
            switch(key) {
                case 'ArrowUp':
                case 'KeyW':
                    InputManager.keyboard.up = true;
                    console.log('✅ 设置向上移动');
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    InputManager.keyboard.down = true;
                    console.log('✅ 设置向下移动');
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    InputManager.keyboard.left = true;
                    console.log('✅ 设置向左移动');
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    InputManager.keyboard.right = true;
                    console.log('✅ 设置向右移动');
                    break;
                case 'Space':
                    InputManager.keyboard.space = true;
                    console.log('✅ 设置射击');
                    break;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            const key = event.code;
            console.log('⌨️ 键盘释放:', key);
            
            switch(key) {
                case 'ArrowUp':
                case 'KeyW':
                    InputManager.keyboard.up = false;
                    console.log('❌ 停止向上移动');
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    InputManager.keyboard.down = false;
                    console.log('❌ 停止向下移动');
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    InputManager.keyboard.left = false;
                    console.log('❌ 停止向左移动');
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    InputManager.keyboard.right = false;
                    console.log('❌ 停止向右移动');
                    break;
                case 'Space':
                    InputManager.keyboard.space = false;
                    console.log('❌ 停止射击');
                    break;
            }
        });
        
        console.log('✅ 键盘输入监听器设置完成');
    }
};

// ===========================================
// 🖱️ 鼠标输入监听器
// ===========================================
const MouseManager = {
    setup: function() {
        console.log('🖱️ 设置鼠标输入监听器...');
        
        // 获取canvas相对坐标
        function getMousePos(canvas, evt) {
            const rect = canvas.getBoundingClientRect();
            return {
                x: evt.clientX - rect.left,
                y: evt.clientY - rect.top
            };
        }
        
        // 鼠标移动事件
        canvas.addEventListener('mousemove', (event) => {
            const pos = getMousePos(canvas, event);
            InputManager.mouse.x = pos.x;
            InputManager.mouse.y = pos.y;
        });
        
        // 鼠标按下事件
        canvas.addEventListener('mousedown', (event) => {
            if (event.button === 0) { // 左键
                InputManager.mouse.isPressed = true;
                console.log('🖱️ 鼠标左键按下');
                event.preventDefault();
            }
        });
        
        // 鼠标释放事件
        canvas.addEventListener('mouseup', (event) => {
            if (event.button === 0) { // 左键
                InputManager.mouse.isPressed = false;
                console.log('🖱️ 鼠标左键释放');
                event.preventDefault();
            }
        });
        
        // 鼠标离开canvas时释放按键状态
        canvas.addEventListener('mouseleave', () => {
            InputManager.mouse.isPressed = false;
        });
        
        console.log('✅ 鼠标输入监听器设置完成');
    }
};

// ===========================================
// 🚀 输入系统初始化
// ===========================================
function initializeInputSystem() {
    console.log('🚀 初始化输入控制系统...');
    
    // 重置输入管理器
    InputManager.reset();
    
    // 设置键盘监听
    KeyboardManager.setup();
    
    // 设置鼠标监听
    MouseManager.setup();
    
    // 确保canvas获得焦点
    if (canvas) {
        canvas.setAttribute('tabindex', '0');
        canvas.focus();
        console.log('🎯 Canvas已获得焦点');
    }
    
    console.log('✅ 输入控制系统初始化完成');
}

// 立即初始化
initializeInputSystem();

// 暴露到全局用于调试
window.InputManager = InputManager;
window.testInput = function() {
    console.log('🧪 输入状态测试:', {
        keyboard: InputManager.keyboard,
        mouse: InputManager.mouse,
        actions: InputManager.actions
    });
};

// 坦克类
class Tank {
    constructor(x, y, color, isPlayer = false, level = 1) {
        this.x = x;
        this.y = y;
        this.width = GAME_CONFIG.TANK_SIZE;
        this.height = GAME_CONFIG.TANK_SIZE;
        this.color = color;
        this.isPlayer = isPlayer;
        this.angle = 0; // 坦克车身朝向角度
        this.turretAngle = 0; // 炮管朝向角度（新增）
        this.health = isPlayer ? 3 : 1;
        this.lastShot = 0;
        this.level = isPlayer ? 1 : level; // 敌方坦克等级（1-10）
        
        // 根据等级设置属性
        this.speed = this.getSpeedByLevel();
        this.shootCooldown = this.getShootCooldownByLevel(); // 发射冷却时间
        
        // AI相关属性（敌方坦克）
        if (!isPlayer) {
            this.targetX = Math.random() * GAME_CONFIG.CANVAS_WIDTH;
            this.targetY = Math.random() * GAME_CONFIG.CANVAS_HEIGHT;
            this.lastDirectionChange = Date.now();
            this.directionChangeInterval = 2000 + Math.random() * 3000;
            this.aiMode = 'hunt'; // 'hunt'（追击）或 'patrol'（巡逻）
            this.lastPlayerSeen = 0;
            this.huntingRange = 300; // 追击范围
            this.attackRange = 250; // 攻击范围
        }
    }
    
    // 根据等级获取移动速度
    getSpeedByLevel() {
        if (this.isPlayer) {
            return GAME_CONFIG.TANK_SPEED;
        }
        // 敌方坦克速度：1等最慢，10等最快
        const baseSpeed = 1.5; // 最慢速度
        const maxSpeed = 4.5;  // 最快速度
        return baseSpeed + (maxSpeed - baseSpeed) * (this.level - 1) / 9;
    }
    
    // 根据等级获取射击冷却时间
    getShootCooldownByLevel() {
        if (this.isPlayer) {
            return 500; // 玩家固定冷却时间
        }
        // 敌方坦克射击频率：1等最慢，10等最快
        const maxCooldown = 2000; // 1等：2秒一发
        const minCooldown = 600;  // 10等：0.6秒一发
        return maxCooldown - (maxCooldown - minCooldown) * (this.level - 1) / 9;
    }
    
    // 绘制玩家头像（狮子头像风格）
    drawPlayerAvatar() {
        // 保存当前状态
        ctx.save();
        
        // 在坦克上方绘制头像
        const avatarSize = 16;
        const avatarX = 0;
        const avatarY = -this.height/2 - avatarSize - 10;
        
        // 绘制头像背景（黑色圆形）
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarSize/2, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制狮子面部（金色）
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarSize/2 - 1, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制眼睛
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.arc(avatarX - 3, avatarY - 2, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(avatarX + 3, avatarY - 2, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制鼻子
        ctx.fillStyle = '#e67e22';
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制嘴巴
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(avatarX, avatarY + 1, 2, 0, Math.PI);
        ctx.stroke();
        
        // 绘制鬃毛（简化的金色线条）
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 1;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(avatarX + i * 2, avatarY - 6);
            ctx.lineTo(avatarX + i * 2, avatarY - 4);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    update() {
        console.log('Tank update被调用, isPlayer:', this.isPlayer, 'x:', this.x, 'y:', this.y); // 调试日志
        
        // 备份当前位置
        const prevX = this.x;
        const prevY = this.y;
        
        if (this.isPlayer) {
            this.handlePlayerInput();
        } else {
            this.handleAI();
        }
        
        // 检查与障碍物的碰撞
        for (let obstacle of obstacles) {
            if (!obstacle.canPassThrough() && this.collidesWith(obstacle)) {
                // 发生碰撞，恢复到之前的位置
                console.log('发生碰撞，恢复位置');
                this.x = prevX;
                this.y = prevY;
                break;
            }
        }
        
        // 修复后的边界限制逻辑
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        
        // 只在位置真正超出边界时才调整
        if (this.x - halfWidth < 0) {
            this.x = halfWidth;
            console.log('修正左边界越界');
        } else if (this.x + halfWidth > GAME_CONFIG.CANVAS_WIDTH) {
            this.x = GAME_CONFIG.CANVAS_WIDTH - halfWidth;
            console.log('修正右边界越界');
        }
        
        if (this.y - halfHeight < 0) {
            this.y = halfHeight;
            console.log('修正上边界越界');
        } else if (this.y + halfHeight > GAME_CONFIG.CANVAS_HEIGHT) {
            this.y = GAME_CONFIG.CANVAS_HEIGHT - halfHeight;
            console.log('修正下边界越界');
        }
    }
    
    handlePlayerInput() {
        console.log('🎮 坦克处理玩家输入...');
        
        // 获取最新的输入动作
        const actions = InputManager.updateActions(this);
        
        // 处理移动
        if (actions.moveX !== 0 || actions.moveY !== 0) {
            console.log('🛡️ 执行坦克移动:', { 
                moveX: actions.moveX, 
                moveY: actions.moveY,
                当前位置: { x: this.x, y: this.y },
                速度: this.speed
            });
            
            // 计算移动角度（车身朝向）
            this.angle = Math.atan2(actions.moveY, actions.moveX);
            
            // 执行移动
            const oldX = this.x;
            const oldY = this.y;
            
            this.x += actions.moveX * this.speed;
            this.y += actions.moveY * this.speed;
            
            console.log('📍 坦克移动结果:', {
                移动前: { x: oldX, y: oldY },
                移动后: { x: this.x, y: this.y },
                差值: { dx: this.x - oldX, dy: this.y - oldY }
            });
        }
        
        // 处理炮塔角度
        this.turretAngle = actions.turretAngle;
        
        // 处理射击
        if (actions.shouldShoot && Date.now() - this.lastShot > this.shootCooldown) {
            console.log('💥 执行射击');
            this.shoot();
            this.lastShot = Date.now();
        }
    }
    
    handleAI() {
        const now = Date.now();
        
        if (!playerTank || playerTank.health <= 0) {
            // 如果没有玩家坦克，则随机巡逻
            this.aiMode = 'patrol';
        } else {
            // 计算与玩家的距离
            const playerDx = playerTank.x - this.x;
            const playerDy = playerTank.y - this.y;
            const playerDistance = Math.sqrt(playerDx * playerDx + playerDy * playerDy);
            
            // 检查是否可以看到玩家（简单的视线检测）
            const canSeePlayer = this.hasLineOfSight(playerTank);
            
            // 決定AI模式
            if (canSeePlayer && playerDistance <= this.huntingRange) {
                this.aiMode = 'hunt';
                this.lastPlayerSeen = now;
                this.targetX = playerTank.x;
                this.targetY = playerTank.y;
            } else if (now - this.lastPlayerSeen < 5000) { // 5秒内看到过玩家
                this.aiMode = 'hunt';
                // 保持最后知道的玩家位置
            } else {
                this.aiMode = 'patrol';
            }
        }
        
        // 根据AI模式执行不同的行为
        if (this.aiMode === 'hunt') {
            this.huntPlayer();
        } else {
            this.patrolArea();
        }
        
        // 攻击玩家
        this.tryAttackPlayer();
    }
    
    // 检查是否有到玩家的视线
    hasLineOfSight(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.floor(distance / 10); // 每10像素检查一次
        
        for (let i = 1; i < steps; i++) {
            const checkX = this.x + (dx / steps) * i;
            const checkY = this.y + (dy / steps) * i;
            
            // 检查这个点是否被障碍物阻挡
            for (let obstacle of obstacles) {
                if (!obstacle.canPassThrough() &&
                    checkX >= obstacle.x && checkX <= obstacle.x + obstacle.width &&
                    checkY >= obstacle.y && checkY <= obstacle.y + obstacle.height) {
                    return false;
                }
            }
        }
        return true;
    }
    
    // 追击玩家
    huntPlayer() {
        if (!playerTank) return;
        
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 10) {
            let moveX = (dx / distance) * this.speed * (1.1 + this.level * 0.05); // 追击时的速度加成基于等级
            let moveY = (dy / distance) * this.speed * (1.1 + this.level * 0.05);
            
            // 检查前方是否有障碍物
            const nextX = this.x + moveX;
            const nextY = this.y + moveY;
            
            let blocked = false;
            for (let obstacle of obstacles) {
                if (!obstacle.canPassThrough()) {
                    const tempTank = { x: nextX, y: nextY, width: this.width, height: this.height };
                    if (this.collidesWith.call(tempTank, obstacle)) {
                        blocked = true;
                        break;
                    }
                }
            }
            
            if (blocked) {
                // 如果被阻挡，尝试绕路
                this.findAlternatePath();
            } else {
                this.x += moveX;
                this.y += moveY;
                this.angle = Math.atan2(moveY, moveX);
            }
        }
    }
    
    // 巡逻区域
    patrolArea() {
        const now = Date.now();
        
        // 定期改变巡逻目标
        if (now - this.lastDirectionChange > this.directionChangeInterval) {
            this.targetX = Math.random() * GAME_CONFIG.CANVAS_WIDTH;
            this.targetY = Math.random() * GAME_CONFIG.CANVAS_HEIGHT;
            this.lastDirectionChange = now;
            this.directionChangeInterval = 3000 + Math.random() * 4000;
        }
        
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            let moveX = (dx / distance) * this.speed;
            let moveY = (dy / distance) * this.speed;
            
            // 检查障碍物
            const nextX = this.x + moveX;
            const nextY = this.y + moveY;
            
            let blocked = false;
            for (let obstacle of obstacles) {
                if (!obstacle.canPassThrough()) {
                    const tempTank = { x: nextX, y: nextY, width: this.width, height: this.height };
                    if (this.collidesWith.call(tempTank, obstacle)) {
                        blocked = true;
                        break;
                    }
                }
            }
            
            if (blocked) {
                // 如果被阻挡，立即改变目标
                const randomAngle = Math.random() * Math.PI * 2;
                this.targetX = this.x + Math.cos(randomAngle) * 100;
                this.targetY = this.y + Math.sin(randomAngle) * 100;
                this.lastDirectionChange = now;
            } else {
                this.x += moveX;
                this.y += moveY;
                this.angle = Math.atan2(moveY, moveX);
            }
        }
    }
    
    // 寻找替代路径
    findAlternatePath() {
        const directions = [
            { x: 1, y: 0 },   // 右
            { x: -1, y: 0 },  // 左
            { x: 0, y: 1 },   // 下
            { x: 0, y: -1 },  // 上
            { x: 1, y: 1 },   // 右下
            { x: -1, y: 1 },  // 左下
            { x: 1, y: -1 },  // 右上
            { x: -1, y: -1 }  // 左上
        ];
        
        for (let dir of directions) {
            const moveX = dir.x * this.speed;
            const moveY = dir.y * this.speed;
            const nextX = this.x + moveX;
            const nextY = this.y + moveY;
            
            let canMove = true;
            for (let obstacle of obstacles) {
                if (!obstacle.canPassThrough()) {
                    const tempTank = { x: nextX, y: nextY, width: this.width, height: this.height };
                    if (this.collidesWith.call(tempTank, obstacle)) {
                        canMove = false;
                        break;
                    }
                }
            }
            
            if (canMove) {
                this.x += moveX;
                this.y += moveY;
                this.angle = Math.atan2(moveY, moveX);
                break;
            }
        }
    }
    
    // 尝试攻击玩家
    tryAttackPlayer() {
        const now = Date.now();
        
        if (!playerTank || playerTank.health <= 0) return;
        if (now - this.lastShot < this.shootCooldown) return;
        
        const playerDx = playerTank.x - this.x;
        const playerDy = playerTank.y - this.y;
        const playerDistance = Math.sqrt(playerDx * playerDx + playerDy * playerDy);
        
        // 在攻击范围内且有视线
        if (playerDistance <= this.attackRange && this.hasLineOfSight(playerTank)) {
            // 计算预测位置（简单的预判）
            const playerSpeedEstimate = 3; // 估计玩家移动速度
            const bulletTravelTime = playerDistance / GAME_CONFIG.BULLET_SPEED;
            const predictedX = playerTank.x;
            const predictedY = playerTank.y;
            
            // 调整角度指向预测位置
            this.angle = Math.atan2(predictedY - this.y, predictedX - this.x);
            
            // 发射子弹
            this.shoot();
            this.lastShot = now;
        }
    }
    
    shoot() {
        // 使用炮管角度计算子弹位置和方向
        const shootAngle = this.isPlayer ? this.turretAngle : this.angle;
        const bulletX = this.x + Math.cos(shootAngle) * (this.width/2 + 10);
        const bulletY = this.y + Math.sin(shootAngle) * (this.height/2 + 10);
        
        bullets.push(new Bullet(bulletX, bulletY, shootAngle, this.isPlayer));
    }
    
    draw() {
        ctx.save();
        
        // 移动到坦克中心
        ctx.translate(this.x, this.y);
        
        // 绘制坦克主体（车身） - 只有在移动时才旋转车身
        if (!this.isPlayer) {
            // 敌方坦克始终按移动方向旋转
            ctx.rotate(this.angle);
        }
        
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // 绘制坦克车身轮廓
        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // 恢复变换矩阵以绘制炮管
        ctx.restore();
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 绘制坦克炮管（按照炮管角度）
        const gunAngle = this.isPlayer ? this.turretAngle : this.angle;
        ctx.rotate(gunAngle);
        
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(this.width/2 - 5, -3, 20, 6);
        
        ctx.restore();
        
        // 如果是玩家坦克，绘制一个标识和头像
        if (this.isPlayer) {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            // 绘制玩家头像（代表狮子头像）
            this.drawPlayerAvatar();
            
            // 绘制白色标识
            ctx.fillStyle = '#fff';
            ctx.fillRect(-5, -5, 10, 10);
            
            ctx.restore();
        } else {
            // 敌方坦克的AI状态指示器
            if (this.aiMode === 'hunt') {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.fillStyle = '#ff4757'; // 红色表示追击模式
                ctx.beginPath();
                ctx.arc(0, -this.height/2 - 8, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
        
        // 绘制玩家坦克的血量条
        if (this.isPlayer && this.health > 0) {
            const barWidth = this.width;
            const barHeight = 6;
            const barX = this.x - barWidth/2;
            const barY = this.y - this.height/2 - 15;
            
            // 绘制血量条背景
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // 绘制血量条
            const healthRatio = this.health / 3; // 最大血量为3
            if (healthRatio > 0.6) {
                ctx.fillStyle = '#27ae60'; // 绿色（健康）
            } else if (healthRatio > 0.3) {
                ctx.fillStyle = '#f39c12'; // 黄色（警告）
            } else {
                ctx.fillStyle = '#e74c3c'; // 红色（危险）
            }
            ctx.fillRect(barX, barY, barWidth * healthRatio, barHeight);
            
            // 绘制血量数字
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.health}/3`, this.x, barY - 2);
        }
        
        // 绘制敌方坦克的生命值条
        if (!this.isPlayer && this.health > 0) {
            const barWidth = this.width;
            const barHeight = 4;
            const barX = this.x - barWidth/2;
            const barY = this.y - this.height/2 - 10;
            
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            ctx.fillStyle = '#27ae60';
            ctx.fillRect(barX, barY, barWidth * (this.health / 1), barHeight);
            
            // 显示敌方坦克等级
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeText(`Lv.${this.level}`, this.x, barY - 5);
            ctx.fillText(`Lv.${this.level}`, this.x, barY - 5);
        }
    }
    
    takeDamage(damage = 1) {
        this.health -= damage;
        if (this.health <= 0) {
            if (this.isPlayer) {
                gameState.playerHealth = this.health;
                if (this.health <= 0) {
                    endGame();
                }
            } else {
                // 敌方坦克被摧毁，增加分数
                gameState.score += 100;
                updateUI();
                return true; // 返回true表示坦克被摧毁
            }
        }
        return false;
    }
    
    // 检测与其他对象的碰撞
    collidesWith(other) {
        return this.x - this.width/2 < other.x + other.width &&
               this.x + this.width/2 > other.x &&
               this.y - this.height/2 < other.y + other.height &&
               this.y + this.height/2 > other.y;
    }
}

// 障碍物类
class Obstacle {
    constructor(x, y, width, height, type = 'wall') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.health = this.getHealthByType(type);
        this.maxHealth = this.health;
    }
    
    getHealthByType(type) {
        switch(type) {
            case 'wall': return 1; // 普通墙壁，一发摧毁
            case 'steel': return 3; // 钢墙，需要3发摧毁
            case 'bush': return 0; // 草丛，不会被摧毁但可以穿过
            default: return 1;
        }
    }
    
    getColorByType() {
        switch(this.type) {
            case 'wall': return '#8b4513'; // 棕色砖墙
            case 'steel': return '#708090'; // 灰色钢墙
            case 'bush': return '#228b22'; // 绿色草丛
            default: return '#8b4513';
        }
    }
    
    canPassThrough() {
        return this.type === 'bush';
    }
    
    takeDamage(damage = 1) {
        if (this.type === 'bush') return false; // 草丛不会被摧毁
        
        this.health -= damage;
        return this.health <= 0;
    }
    
    draw() {
        ctx.fillStyle = this.getColorByType();
        
        if (this.type === 'steel') {
            // 钢墙有特殊的条纹效果
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = '#a9a9a9';
            for (let i = 0; i < this.width; i += 8) {
                ctx.fillRect(this.x + i, this.y, 2, this.height);
            }
        } else if (this.type === 'bush') {
            // 草丛有随机的草叶效果
            for (let i = 0; i < this.width; i += 6) {
                for (let j = 0; j < this.height; j += 6) {
                    if (Math.random() > 0.3) {
                        ctx.fillRect(this.x + i, this.y + j, 4, 4);
                    }
                }
            }
        } else {
            // 普通砖墙
            ctx.fillRect(this.x, this.y, this.width, this.height);
            // 添加砖块纹理
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 1;
            for (let i = 0; i < this.height; i += 10) {
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + i);
                ctx.lineTo(this.x + this.width, this.y + i);
                ctx.stroke();
            }
            for (let i = 0; i < this.width; i += 20) {
                ctx.beginPath();
                ctx.moveTo(this.x + i, this.y);
                ctx.lineTo(this.x + i, this.y + this.height);
                ctx.stroke();
            }
        }
        
        // 如果是钢墙，显示生命值
        if (this.type === 'steel' && this.health < this.maxHealth) {
            const barWidth = this.width;
            const barHeight = 3;
            const barX = this.x;
            const barY = this.y - 8;
            
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            ctx.fillStyle = '#27ae60';
            ctx.fillRect(barX, barY, barWidth * (this.health / this.maxHealth), barHeight);
        }
    }
    
    // 检测碰撞
    collidesWith(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
}

// 子弹类
class Bullet {
    constructor(x, y, angle, isPlayerBullet) {
        this.x = x;
        this.y = y;
        this.width = GAME_CONFIG.BULLET_SIZE;
        this.height = GAME_CONFIG.BULLET_SIZE;
        this.angle = angle;
        this.speed = GAME_CONFIG.BULLET_SPEED;
        this.isPlayerBullet = isPlayerBullet;
        this.velocityX = Math.cos(angle) * this.speed;
        this.velocityY = Math.sin(angle) * this.speed;
    }
    
    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
    }
    
    draw() {
        ctx.fillStyle = this.isPlayerBullet ? '#f1c40f' : '#e74c3c';
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
    }
    
    // 检查子弹是否超出画布
    isOutOfBounds() {
        return this.x < 0 || this.x > GAME_CONFIG.CANVAS_WIDTH || 
               this.y < 0 || this.y > GAME_CONFIG.CANVAS_HEIGHT;
    }
    
    // 检测碰撞
    collidesWith(target) {
        return this.x < target.x + target.width/2 &&
               this.x + this.width/2 > target.x - target.width/2 &&
               this.y < target.y + target.height/2 &&
               this.y + this.height/2 > target.y - target.height/2;
    }
}

// 游戏对象数组
let playerTank;
let enemyTanks = [];
let bullets = [];
let obstacles = [];
let lastEnemySpawn = 0;

// 生成障碍物
function generateObstacles() {
    obstacles = [];
    
    // 在地图中随机生成一些障碍物
    const obstacleTypes = ['wall', 'steel', 'bush'];
    const numObstacles = 15 + Math.floor(Math.random() * 10); // 15-25个障碍物
    
    for (let i = 0; i < numObstacles; i++) {
        let x, y, width, height, type;
        let attempts = 0;
        let validPosition = false;
        
        while (!validPosition && attempts < 50) {
            // 随机选择障碍物类型
            type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
            
            // 根据类型设置大小
            if (type === 'bush') {
                width = 40 + Math.random() * 60; // 草丛可以更大
                height = 40 + Math.random() * 60;
            } else {
                width = 20 + Math.random() * 40;
                height = 20 + Math.random() * 40;
            }
            
            x = Math.random() * (GAME_CONFIG.CANVAS_WIDTH - width);
            y = Math.random() * (GAME_CONFIG.CANVAS_HEIGHT - height);
            
            // 检查是否与其他障碍物重叠
            validPosition = true;
            
            // 不在玩家初始位置附近
            const playerStartX = GAME_CONFIG.CANVAS_WIDTH / 2;
            const playerStartY = GAME_CONFIG.CANVAS_HEIGHT - 100;
            if (x < playerStartX + 80 && x + width > playerStartX - 80 &&
                y < playerStartY + 80 && y + height > playerStartY - 80) {
                validPosition = false;
            }
            
            // 不在敌人生成区域上方
            if (y < 150) {
                if (Math.random() > 0.3) { // 70%的几率不在上方生成
                    validPosition = false;
                }
            }
            
            // 检查与已有障碍物的重叠
            for (let obstacle of obstacles) {
                if (x < obstacle.x + obstacle.width + 20 &&
                    x + width > obstacle.x - 20 &&
                    y < obstacle.y + obstacle.height + 20 &&
                    y + height > obstacle.y - 20) {
                    validPosition = false;
                    break;
                }
            }
            
            attempts++;
        }
        
        if (validPosition) {
            obstacles.push(new Obstacle(x, y, width, height, type));
        }
    }
}

// 初始化游戏
function initGame() {
    console.log('正在初始化游戏...');
    
    // 创建玩家坦克
    playerTank = new Tank(GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT - 100, '#3498db', true);
    console.log('玩家坦克已创建:', playerTank);
    
    // 清空数组
    enemyTanks = [];
    bullets = [];
    
    // 生成障碍物
    generateObstacles();
    console.log('障碍物已生成:', obstacles.length, '个');
    
    // 重置游戏状态
    gameState.isRunning = true;
    gameState.score = 0;
    gameState.playerHealth = 3;
    gameState.enemyCount = 0;
    gameState.enemyKilled = 0; // 重置杀死数量
    gameState.currentEnemyLevel = 1; // 重置敌方等级
    
    // 重置生成时间
    lastEnemySpawn = Date.now();
    
    console.log('游戏状态已重置:', gameState);
    updateUI();
}

// 排行榜管理系统

// 加载排行榜数据
function loadLeaderboard() {
    const saved = localStorage.getItem('tankBattleLeaderboard');
    if (saved) {
        leaderboard = JSON.parse(saved);
        // 清理重复记录（如果有的话）
        cleanupDuplicateRecords();
    } else {
        leaderboard = [];
    }
}

// 清理重复记录
function cleanupDuplicateRecords() {
    const playerMap = new Map();
    
    // 遍历所有记录，保留每个玩家的最高分数
    leaderboard.forEach(record => {
        const normalizedName = normalizePlayerName(record.name);
        const existing = playerMap.get(normalizedName);
        
        if (!existing || record.score > existing.score) {
            playerMap.set(normalizedName, record);
        }
    });
    
    // 重建排行榜
    leaderboard = Array.from(playerMap.values());
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);
    
    // 保存清理后的数据
    saveLeaderboard();
}

// 保存排行榜数据
function saveLeaderboard() {
    localStorage.setItem('tankBattleLeaderboard', JSON.stringify(leaderboard));
}

// 规范化玩家姓名（统一处理格式）
function normalizePlayerName(name) {
    if (!name) return '匿名玩家';
    
    // 去除首尾空格，将多个连续空格替换为单个空格，转换为小写用于比较
    return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

// 查找现有玩家记录
function findExistingPlayer(playerName) {
    const normalizedName = normalizePlayerName(playerName);
    return leaderboard.find(record => 
        normalizePlayerName(record.name) === normalizedName
    );
}

// 添加新记录到排行榜
function addToLeaderboard(playerName, score) {
    const displayName = playerName ? playerName.trim().replace(/\s+/g, ' ') : '匿名玩家';
    
    // 查找是否已有相同玩家的记录
    const existingPlayer = findExistingPlayer(playerName);
    
    if (existingPlayer) {
        // 如果新分数更高，更新记录
        if (score > existingPlayer.score) {
            existingPlayer.score = score;
            existingPlayer.date = new Date().toLocaleDateString('zh-CN');
            existingPlayer.name = displayName; // 更新显示名称为最新格式
            
            console.log(`更新玩家 "${displayName}" 的最高分数: ${score}`);
        } else {
            console.log(`玩家 "${displayName}" 的分数 ${score} 未超过历史最高分 ${existingPlayer.score}`);
        }
        
        // 重新排序
        leaderboard.sort((a, b) => b.score - a.score);
        saveLeaderboard();
        return existingPlayer;
    } else {
        // 新玩家，直接添加记录
        const newRecord = {
            name: displayName,
            score: score,
            date: new Date().toLocaleDateString('zh-CN')
        };
        
        leaderboard.push(newRecord);
        console.log(`新玩家 "${displayName}" 首次上榜，分数: ${score}`);
        
        // 按分数排序（降序）
        leaderboard.sort((a, b) => b.score - a.score);
        
        // 只保留前10名
        leaderboard = leaderboard.slice(0, 10);
        
        saveLeaderboard();
        return newRecord;
    }
}

// 显示排行榜
function showLeaderboard() {
    document.getElementById('playerInput').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    
    const leaderboardDiv = document.getElementById('leaderboard');
    const listElement = document.getElementById('leaderboardList');
    
    // 清空列表
    listElement.innerHTML = '';
    
    if (leaderboard.length === 0) {
        listElement.innerHTML = '<li class="leaderboard-item"><span>暂无记录</span></li>';
    } else {
        leaderboard.forEach((record, index) => {
            const li = document.createElement('li');
            li.className = 'leaderboard-item';
            
            // 检查是否是当前玩家（使用规范化名称比较）
            const isCurrentPlayer = normalizePlayerName(record.name) === normalizePlayerName(currentPlayerName);
            if (isCurrentPlayer) {
                li.classList.add('current-player');
            }
            
            li.innerHTML = `
                <span class="rank">${index + 1}</span>
                <span class="player-name">${record.name}</span>
                <span class="score">${record.score}</span>
            `;
            
            listElement.appendChild(li);
        });
    }
    
    leaderboardDiv.style.display = 'block';
}

// 隐藏排行榜
function hideLeaderboard() {
    document.getElementById('leaderboard').style.display = 'none';
    
    // 根据游戏状态决定显示哪个界面
    if (gameInitialized && !gameState.isRunning) {
        document.getElementById('gameOver').style.display = 'block';
    } else {
        document.getElementById('playerInput').style.display = 'block';
    }
}

// 游戏流程管理

// 开始游戏
function startGame() {
    const nameInput = document.getElementById('playerNameInput');
    currentPlayerName = nameInput.value.trim();
    
    if (currentPlayerName.length === 0) {
        alert('请输入你的姓名！');
        return;
    }
    
    if (currentPlayerName.length > 20) {
        alert('姓名不能超过20个字符！');
        return;
    }
    
    // 隐藏输入界面
    document.getElementById('playerInput').style.display = 'none';
    
    // 初始化游戏
    initGame();
    gameInitialized = true;
    
    // 确保canvas获得焦点以接收键盘事件
    setTimeout(() => {
        canvas.focus();
        console.log('Canvas已获得焦点，尝试按方向键移动');
        
        // 自动运行测试
        setTimeout(() => {
            console.log('自动运行移动测试...');
            testTankMovement();
            runMovementTest();
        }, 1000);
    }, 100);
    
    // 游戏循环已经在系统启动时开始运行，不需要重复启动
}

// 返回主菜单
function backToMenu() {
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('leaderboard').style.display = 'none';
    document.getElementById('playerInput').style.display = 'block';
    
    // 重置游戏状态
    gameState.isRunning = false;
    gameInitialized = false;
    
    // 清空输入框
    document.getElementById('playerNameInput').value = '';
    currentPlayerName = '';
}

// 检查敌方坦克等级提升
function checkEnemyLevelUp() {
    // 每损失两台敌方坦克，提升一等级
    const newLevel = Math.min(10, Math.floor(gameState.enemyKilled / 2) + 1);
    if (newLevel > gameState.currentEnemyLevel) {
        gameState.currentEnemyLevel = newLevel;
        console.log(`敌方坦克等级提升至 ${gameState.currentEnemyLevel} 级！`);
    }
}

// 检查位置是否安全（用于坦克生成）
function isPositionSafe(x, y, tankSize, checkPlayer = true, checkEnemies = true, checkObstacles = true) {
    // 检查是否在画布范围内
    if (x - tankSize/2 < 0 || x + tankSize/2 > GAME_CONFIG.CANVAS_WIDTH ||
        y - tankSize/2 < 0 || y + tankSize/2 > GAME_CONFIG.CANVAS_HEIGHT) {
        return false;
    }
    
    // 检查与玩家坦克的距离
    if (checkPlayer && playerTank && playerTank.health > 0) {
        const playerDx = x - playerTank.x;
        const playerDy = y - playerTank.y;
        const playerDistance = Math.sqrt(playerDx * playerDx + playerDy * playerDy);
        
        if (playerDistance < 100) { // 减少最小距离限制
            return false;
        }
    }
    
    // 检查与其他敌方坦克的距离
    if (checkEnemies) {
        for (let tank of enemyTanks) {
            const tankDx = x - tank.x;
            const tankDy = y - tank.y;
            const tankDistance = Math.sqrt(tankDx * tankDx + tankDy * tankDy);
            
            if (tankDistance < 70) { // 减少最小距离限制
                return false;
            }
        }
    }
    
    // 检查与障碍物的碰撞
    if (checkObstacles) {
        const tempTank = {
            x: x,
            y: y,
            width: tankSize,
            height: tankSize
        };
        
        for (let obstacle of obstacles) {
            if (!obstacle.canPassThrough()) {
                // 简化碰撞检测，添加一些缓冲距离
                const buffer = 5;
                if (tempTank.x - tempTank.width/2 - buffer < obstacle.x + obstacle.width &&
                    tempTank.x + tempTank.width/2 + buffer > obstacle.x &&
                    tempTank.y - tempTank.height/2 - buffer < obstacle.y + obstacle.height &&
                    tempTank.y + tempTank.height/2 + buffer > obstacle.y) {
                    return false;
                }
            }
        }
    }
    
    return true;
}

// 生成敌方坦克
function spawnEnemyTank() {
    if (enemyTanks.length >= GAME_CONFIG.MAX_ENEMIES) {
        return; // 如果已达到最大数量，直接返回
    }
    
    let x, y;
    let attempts = 0;
    let validPosition = false;
    const maxAttempts = 100; // 减少最大尝试次数
    
    // 定义多个候选区域
    const spawnAreas = [
        { x: 0, y: 0, width: GAME_CONFIG.CANVAS_WIDTH, height: 150 }, // 上方区域（缩小）
        { x: 0, y: 0, width: 100, height: GAME_CONFIG.CANVAS_HEIGHT }, // 左侧区域（缩小）
        { x: GAME_CONFIG.CANVAS_WIDTH - 100, y: 0, width: 100, height: GAME_CONFIG.CANVAS_HEIGHT }, // 右侧区域（缩小）
    ];
    
    while (!validPosition && attempts < maxAttempts) {
        // 随机选择一个生成区域
        const area = spawnAreas[Math.floor(Math.random() * spawnAreas.length)];
        
        // 在选定区域内随机生成位置
        x = area.x + Math.random() * Math.max(1, area.width - GAME_CONFIG.TANK_SIZE) + GAME_CONFIG.TANK_SIZE/2;
        y = area.y + Math.random() * Math.max(1, area.height - GAME_CONFIG.TANK_SIZE) + GAME_CONFIG.TANK_SIZE/2;
        
        // 确保在画布范围内
        x = Math.max(GAME_CONFIG.TANK_SIZE/2, Math.min(GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.TANK_SIZE/2, x));
        y = Math.max(GAME_CONFIG.TANK_SIZE/2, Math.min(GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.TANK_SIZE/2, y));
        
        // 使用辅助函数检查位置是否安全
        validPosition = isPositionSafe(x, y, GAME_CONFIG.TANK_SIZE, true, true, true);
        
        attempts++;
    }
    
    // 如果还是找不到合适位置，尝试更宽松的条件
    if (!validPosition) {
        attempts = 0;
        while (!validPosition && attempts < 30) {
            x = Math.random() * (GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.TANK_SIZE) + GAME_CONFIG.TANK_SIZE/2;
            y = Math.random() * 200 + GAME_CONFIG.TANK_SIZE/2; // 只在上方区域生成
            
            // 只检查障碍物碰撞和基本距离限制
            validPosition = isPositionSafe(x, y, GAME_CONFIG.TANK_SIZE, true, false, true);
            attempts++;
        }
    }
    
    // 如果找到有效位置，创建敌方坦克
    if (validPosition) {
        enemyTanks.push(new Tank(x, y, '#e74c3c', false, gameState.currentEnemyLevel));
        gameState.enemyCount = enemyTanks.length;
        updateUI();
        console.log(`敌方坦克已生成，位置: (${Math.round(x)}, ${Math.round(y)})，等级: ${gameState.currentEnemyLevel}`);
    } else {
        // 如果无法找到有效位置，跳过这次生成（不递归调用）
        console.warn('无法为敌方坦克找到有效的生成位置，跳过本次生成');
    }
}

// 更新游戏状态
function updateGame() {
    // 始终更新玩家坦克（不受gameState.isRunning限制）
    if (playerTank) {
        playerTank.update();
    }
    
    // 只有在游戏运行时才更新其他游戏元素
    if (!gameState.isRunning) return;
    
    // 更新敌方坦克
    for (let i = enemyTanks.length - 1; i >= 0; i--) {
        enemyTanks[i].update();
    }
    
    // 检查玩家坦克与敌方坦克的碰撞
    if (playerTank && playerTank.health > 0) {
        for (let i = enemyTanks.length - 1; i >= 0; i--) {
            if (playerTank.collidesWith(enemyTanks[i])) {
                // 玩家坦克受到伤害
                playerTank.takeDamage();
                gameState.playerHealth = playerTank.health;
                updateUI();
                
                // 敌方坦克立即死亡
                gameState.score += 50; // 碰撞杀死得分
                gameState.enemyKilled++;
                enemyTanks.splice(i, 1);
                gameState.enemyCount = enemyTanks.length;
                updateUI();
                
                // 检查是否需要提升敌方坦克等级
                checkEnemyLevelUp();
                
                break; // 一次只处理一个碰撞
            }
        }
    }
    
    // 更新子弹
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        
        // 移除超出边界的子弹
        if (bullets[i].isOutOfBounds()) {
            bullets.splice(i, 1);
            continue;
        }
        
        // 检测子弹与障碍物的碰撞
        let bulletDestroyed = false;
        for (let j = obstacles.length - 1; j >= 0; j--) {
            if (bullets[i] && bullets[i].collidesWith(obstacles[j])) {
                // 子弹击中障碍物
                if (obstacles[j].takeDamage()) {
                    // 障碍物被摧毁
                    obstacles.splice(j, 1);
                }
                bullets.splice(i, 1);
                bulletDestroyed = true;
                break;
            }
        }
        
        if (bulletDestroyed) continue;
        
        // 检测子弹碰撞
        if (bullets[i].isPlayerBullet) {
            // 玩家子弹与敌方坦克碰撞
            for (let j = enemyTanks.length - 1; j >= 0; j--) {
                if (bullets[i].collidesWith(enemyTanks[j])) {
                    if (enemyTanks[j].takeDamage()) {
                        gameState.enemyKilled++;
                        enemyTanks.splice(j, 1);
                        gameState.enemyCount = enemyTanks.length;
                        checkEnemyLevelUp(); // 检查等级提升
                    }
                    bullets.splice(i, 1);
                    break;
                }
            }
        } else {
            // 敌方子弹与玩家坦克碰撞
            if (playerTank && bullets[i].collidesWith(playerTank)) {
                playerTank.takeDamage();
                gameState.playerHealth = playerTank.health;
                updateUI();
                bullets.splice(i, 1);
            }
        }
    }
    
    // 生成敌方坦克
    const now = Date.now();
    if (now - lastEnemySpawn > GAME_CONFIG.ENEMY_SPAWN_INTERVAL) {
        console.log('尝试生成敌方坦克...');
        spawnEnemyTank();
        lastEnemySpawn = now;
    }
}

// 渲染游戏
function renderGame() {
    // 清空画布
    ctx.clearRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
    
    // 绘制背景格子
    drawBackground();
    
    // 只有在游戏运行时才绘制游戏对象
    if (gameState.isRunning) {
        // console.log('渲染游戏中...', '玩家坦克:', !!playerTank, '敌方坦克:', enemyTanks.length, '障碍物:', obstacles.length);
        
        // 绘制障碍物
        obstacles.forEach(obstacle => obstacle.draw());
        
        // 绘制玩家坦克
        if (playerTank && playerTank.health > 0) {
            playerTank.draw();
        }
        
        // 绘制敌方坦克
        enemyTanks.forEach(tank => tank.draw());
        
        // 绘制子弹
        bullets.forEach(bullet => bullet.draw());
    }
}

// 绘制背景
function drawBackground() {
    const gridSize = 50;
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 0.5;
    
    // 绘制垂直线
    for (let x = 0; x <= GAME_CONFIG.CANVAS_WIDTH; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, GAME_CONFIG.CANVAS_HEIGHT);
        ctx.stroke();
    }
    
    // 绘制水平线
    for (let y = 0; y <= GAME_CONFIG.CANVAS_HEIGHT; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(GAME_CONFIG.CANVAS_WIDTH, y);
        ctx.stroke();
    }
}

// 游戏主循环
function gameLoop() {
    // 始终更新游戏逻辑（包括玩家输入）
    updateGame();
    
    // 始终渲染界面（包括背景）
    renderGame();
    
    requestAnimationFrame(gameLoop);
}

// 更新UI
function updateUI() {
    document.getElementById('playerHealth').textContent = Math.max(0, gameState.playerHealth);
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('enemyCount').textContent = enemyTanks.length; // 使用实际数量
    document.getElementById('enemyLevel').textContent = gameState.currentEnemyLevel;
}

// 结束游戏
function endGame() {
    gameState.isRunning = false;
    
    // 添加到排行榜
    const playerRecord = addToLeaderboard(currentPlayerName, gameState.score);
    
    // 显示最终分数
    document.getElementById('finalScore').textContent = gameState.score;
    
    // 检查是否进入前10名
    const rank = leaderboard.findIndex(record => 
        normalizePlayerName(record.name) === normalizePlayerName(currentPlayerName)
    ) + 1;
    
    if (rank <= 10 && rank > 0) {
        // 检查是否是新的最高分数
        const existingPlayer = findExistingPlayer(currentPlayerName);
        const isNewHighScore = !existingPlayer || gameState.score > (existingPlayer.previousScore || 0);
        
        if (isNewHighScore) {
            document.getElementById('gameOverTitle').textContent = `🏆 新记录！排名第${rank}名！`;
            document.getElementById('gameOverMessage').innerHTML = `
                <p>🔥 太棒了！你刷新了个人最高记录！</p>
                <p>你的最终分数: <span id="finalScore">${gameState.score}</span></p>
            `;
        } else {
            document.getElementById('gameOverTitle').textContent = `🏆 排名第${rank}名！`;
            document.getElementById('gameOverMessage').innerHTML = `
                <p>👏 太棒了！你进入了前10名！</p>
                <p>你的最终分数: <span id="finalScore">${gameState.score}</span></p>
            `;
        }
    } else {
        document.getElementById('gameOverTitle').textContent = '游戏结束';
        document.getElementById('gameOverMessage').innerHTML = `
            <p>你的最终分数: <span id="finalScore">${gameState.score}</span></p>
        `;
    }
    
    document.getElementById('gameOver').style.display = 'block';
}

// 重新开始游戏
function restartGame() {
    document.getElementById('gameOver').style.display = 'none';
    
    // 清空所有游戏对象
    enemyTanks = [];
    bullets = [];
    
    // 重新初始化游戏
    initGame();
}






// 手动控制测试函数
function manualControl(direction) {
    console.log('手动控制测试:', direction);
    
    // 重置所有按键
    keys.ArrowUp = false;
    keys.ArrowDown = false;
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
    debugKeys.up = false;
    debugKeys.down = false;
    debugKeys.left = false;
    debugKeys.right = false;
    
    // 设置指定方向
    switch(direction) {
        case 'up':
            keys.ArrowUp = true;
            debugKeys.up = true;
            break;
        case 'down':
            keys.ArrowDown = true;
            debugKeys.down = true;
            break;
        case 'left':
            keys.ArrowLeft = true;
            debugKeys.left = true;
            break;
        case 'right':
            keys.ArrowRight = true;
            debugKeys.right = true;
            break;
    }
    
    console.log('手动设置后的状态:', { keys, debugKeys });
    
    // 2秒后重置
    setTimeout(() => {
        keys.ArrowUp = false;
        keys.ArrowDown = false;
        keys.ArrowLeft = false;
        keys.ArrowRight = false;
        debugKeys.up = false;
        debugKeys.down = false;
        debugKeys.left = false;
        debugKeys.right = false;
        console.log('手动控制重置');
    }, 2000);
}

// 暴露到全局
window.manualControl = manualControl;

// 简化测试函数
function testTankMovement() {
    console.log('========== 简化移动测试 ==========');
    
    if (!playerTank) {
        console.log('❌ 没有玩家坦克');
        return;
    }
    
    console.log('原始位置:', { x: playerTank.x, y: playerTank.y });
    
    // 直接移动坦克
    playerTank.x += 10;
    playerTank.y -= 10;
    
    console.log('直接修改后位置:', { x: playerTank.x, y: playerTank.y });
    
    // 测试按键设置
    keys.ArrowUp = true;
    console.log('设置 ArrowUp = true');
    
    const originalX = playerTank.x;
    const originalY = playerTank.y;
    
    // 手动调用输入处理
    playerTank.handlePlayerInput();
    
    console.log('调用handlePlayerInput后位置:', { x: playerTank.x, y: playerTank.y });
    console.log('位置是否改变:', originalX !== playerTank.x || originalY !== playerTank.y);
    
    // 重置
    keys.ArrowUp = false;
    
    console.log('========== 测试结束 ==========');
}

// 暴露到全局
window.testTankMovement = testTankMovement;

// 自动测试函数
function runMovementTest() {
    console.log('========== 开始自动移动测试 ==========');
    
    if (!playerTank) {
        console.log('❌ 测试失败：玩家坦克不存在');
        return;
    }
    
    console.log('玩家坦克当前位置:', { x: playerTank.x, y: playerTank.y });
    console.log('玩家坦克速度:', playerTank.speed);
    console.log('游戏状态:', gameState);
    console.log('关键问题：gameState.isRunning =', gameState.isRunning);
    
    if (!gameState.isRunning) {
        console.log('🔴 问题找到了！gameState.isRunning为false，游戏逻辑不会更新！');
        console.log('正在修复...');
        gameState.isRunning = true;
        console.log('✅ 已修复：gameState.isRunning =', gameState.isRunning);
    }
    
    // 测试1：直接设置按键状态
    console.log('\n--- 测试1：直接设置按键状态 ---');
    keys.ArrowUp = true;
    debugKeys.up = true;
    console.log('设置向上按键为true:', keys, debugKeys);
    
    // 手动调用输入处理
    const originalX = playerTank.x;
    const originalY = playerTank.y;
    
    playerTank.handlePlayerInput();
    
    console.log('处理输入后位置:', { x: playerTank.x, y: playerTank.y });
    console.log('位置是否改变:', originalX !== playerTank.x || originalY !== playerTank.y);
    
    if (originalX === playerTank.x && originalY === playerTank.y) {
        console.log('🔴 问题：在直接调用handlePlayerInput时坦克位置也没有改变');
    } else {
        console.log('✅ 正常：直接调用handlePlayerInput时坦克位置正常改变');
    }
    
    // 重置按键状态
    keys.ArrowUp = false;
    debugKeys.up = false;
    
    console.log('========== 测试完成 ==========');
}

// 暴露测试函数到全局
window.runMovementTest = runMovementTest;

// 启动游戏系统
// 加载排行榜数据
loadLeaderboard();

// 确保canvas获得焦点以接收键盘事件
canvas.focus();

// 点击canvas时获得焦点
canvas.addEventListener('click', () => {
    canvas.focus();
});

// 启动游戏循环（用于渲染背景和界面）
gameLoop();

console.log('游戏系统已启动');