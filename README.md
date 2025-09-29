# 🛡️ 坦克大战 Tank Battle Game

一个基于HTML5 Canvas开发的经典坦克大战网页游戏，支持键盘和鼠标混合操作。

## 🎮 游戏特色

- 🚀 **流畅操作**: 支持方向键/WASD移动，鼠标瞄准射击
- 🤖 **智能AI**: 敌方坦克具备追击和巡逻模式
- 🏆 **排行榜系统**: 本地存储个人最高分记录
- 🧱 **丰富地形**: 多种障碍物类型（砖墙、钢墙、草丛）
- 📈 **难度渐进**: 敌方坦克等级随游戏进程逐步提升

## 🎯 在线体验

[🎮 立即开始游戏](https://your-username.github.io/tank-battle-game)

## 🚀 本地运行

### 方法1：Python服务器
```bash
cd tank-battle-game
python3 -m http.server 8080
```
然后访问 `http://localhost:8080`

### 方法2：直接打开
双击 `index.html` 文件即可在浏览器中运行

## 🎮 操作指南

### 键盘控制
- ⬆️⬇️⬅️➡️ **方向键** 或 **WASD**: 坦克移动
- 🚀 **空格键**: 发射子弹

### 鼠标控制  
- 🎯 **鼠标移动**: 控制炮管方向
- 💥 **鼠标左键**: 发射子弹

### 游戏目标
- 🏅 消灭敌方坦克获得分数
- 💔 避免被敌方击中（生命值: 3）
- 📊 挑战个人最高分记录

## 🛠️ 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6)
- **图形**: Canvas 2D API
- **存储**: LocalStorage
- **架构**: 面向对象设计 + 分离式输入控制

## 📁 项目结构

```
tank-battle-game/
├── index.html          # 游戏主页面
├── game.js             # 游戏核心逻辑
├── PRD.md              # 产品需求文档
└── README.md           # 项目说明
```

## 🚀 部署到网上

### GitHub Pages (推荐)
1. Fork 或下载此项目到你的 GitHub
2. 在仓库设置中启用 GitHub Pages
3. 选择 main 分支作为源
4. 几分钟后即可通过 `https://你的用户名.github.io/tank-battle-game` 访问

### 其他平台
- **Netlify**: 拖拽文件夹到 netlify.com
- **Vercel**: 连接 GitHub 自动部署
- **Firebase Hosting**: 使用 Firebase CLI 部署

## 📋 更新日志

### v7.0 (最新)
- ✨ 新增鼠标控制炮管功能
- 🔧 重构分离式输入控制系统
- 🎯 优化键盘事件响应
- 📱 改进移动端兼容性

### v6.0
- 🤖 智能AI敌方坦克系统
- 📈 敌方等级渐进提升
- 🏆 排行榜去重优化
- 🧱 丰富障碍物类型

## 👨‍💻 开发者

**Eric Liang** - 游戏开发与设计

## 📄 许可证

MIT License - 欢迎分享和修改

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进游戏！

---

⭐ 如果你喜欢这个项目，请给个 Star 支持一下！