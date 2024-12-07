# TuMo interview

#  Node.js MySQL Typescript

这是一个使用Node.js、Express和MySQL构建的简单应用程序。该项目演示了如何创建一个RESTful API来处理用户相关的操作。
我尝试的题目是选题二：游戏支付系统

## 项目结构

```
TuMo interview
├── src
│   ├── app.js                # 应用程序入口点
│   ├── config
│   │   └── database.js       # 数据库配置
│   ├── controllers
│   │   └── userController.js  # 用户控制器
│   ├── models
│   │   └── userModel.js      # 用户模型
│   ├── routes
│   │   └── userRoutes.js     # 用户路由
│   └── services
│       └── userService.js    # 用户服务
├── package.json               # npm配置文件
├── .env                       # 环境变量配置
└── README.md                  # 项目文档
```

## 安装依赖

在项目根目录下运行以下命令以安装依赖：

```
npm install
```

## 配置数据库

在`.env`文件中配置您的数据库连接字符串，例如：

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=yourdatabase
```

## 启动应用

使用以下命令启动应用程序：

```
npm start
```

应用程序将在 `http://localhost:3000` 上运行。

## API 端点

- `GET /users` - 获取用户列表
- `POST /users` - 创建新用户

## 贡献

欢迎任何形式的贡献！请提交问题或拉取请求。

## 许可证

此项目使用MIT许可证。