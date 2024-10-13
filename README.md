# <p align="center">使用Laya引擎开发的麻将游戏服务端</p>

## 🔥 [客户端仓库地址](https://github.com/liumengniu/majiang)
## 🔥 [直接上手？文档地址？](https://liumengniu.github.io/majiang-server/)

[//]: # (https://github.com/ikatyang/emoji-cheat-sheet 表情仓库)


## 🎞️ 项目介绍

> 使用laya3.x游戏引擎 + nodejs 开发的联网棋牌游戏。 \
> 以下是通过项目生成的原始示例，未经任何修改：
> ![img.png](./screenshot/麻将.gif)


## 🎨 项目结构

```
├── majiang-server         # 麻将服务端
├── .github                  # github的workflows脚本
├── .vitrpress               # vitepress文档
├── config                   # 配置
│   ├── AppletsConfig.js        # 应用环境配置   
│   ├── config.json             # 数据库配置（sequelize命令生成）       
│   ├── serviceConfig.json      # 服务总体配置  
├── core                     # 核心模块
│   ├── app                     # 应用服务  
│   │   ├── App.js                  # 应用主服务  
│   │   ├── GateWayServer.js        # 应用门服务  
│   │   ├── HallServer.js           # 应用大厅服务（×未使用，这边房间集合当做大厅使用了）
AppletsConfig
│   ├── ids                     # id生成  
│   ├── rpc                     # 调用第三方服务（如微信）  
│   ├── services                # 棋牌游戏基础服务  
│   │   ├── ConfigService.js        # 配置服务 
│   │   ├── HackService.js          # 返回客户端的数据hack  
│   │   ├── PlayerService.js        # 玩家集合 
│   │   ├── RoomService.js          # 房间服务
│   ├── socket                  # websocket相关类  
│   │   ├── SocketApi.js            # socket相关api
│   │   ├── SocketService.js        # websocket服务类
├── docs                     # 使用文档
├── models                   # sql表
├── routers                  # api路由
├── services                 # 游戏玩法相关服务
│   ├── game                    # 应用服务  
│   │   ├── GameControl.js          # 麻将相关服务  
│   │   ├── GameService.js          # 麻将相关数据操作 
│   ├── user                    # 应用服务  
│   │   ├── UserService.js          # 玩家相关服务，排名，结算  
├── utils                    # 工具类
├── .gitignore               # git忽略配置
├── index.js                 # nodejs服务进程入口
├── index.md                 # vitepress编写的技术文档首页
├── jsconfig.json            # CommonJS配置相对路径alias
├── package.json             # 依赖表
└── tsconfig.json            # ts配置文件
```

## 💡 正在开发中的内容

> 正在开发的内容 2024/9/29
>

| 蓝图                         | 完成情况       | 存在问题        |
|-----------------------------|------------|-------------|
| 1、登录注册                   | 已完成     | 暂无  |
| 2、开房/加入房间/解散房间        | 已完成     | 暂无  |
| 3、游戏全过程                  | 已完成     | 暂无  |
| 4、碰/杠/胡/流局               | 已完成     | 暂无  |
| 5、AI自动出牌                  | 已完成     | 暂无  |
| 6、胡牌/平局结算               | 已完成     | 暂无  |
| 7、掉线重新加入游戏             | 已完成     | 暂无  |
| 8、基础服务和棋牌玩法逻辑抽离     | 已完成     | 暂无  |
| 9、其它功能                    | 已完成     | 暂无  |
| 10、更详细的文档                | 开发中     | 暂无  |
| 11、扑克游戏（升级or斗地主）     | 开发中     | 暂无  |


## 🌟 Star History
<br>


[![Star History Chart](https://api.star-history.com/svg?repos=liumengniu/majiang-server&type=Timeline)](https://api.star-history.com/svg?repos=liumengniu/majiang-server&type=Timeline)