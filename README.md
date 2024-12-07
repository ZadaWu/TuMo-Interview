# my-express-app/my-express-app/README.md

# My Express App

这是一个使用 Express 框架构建的 Node.js 应用程序示例。

## 项目结构

```
my-express-app
├── src
│   ├── app.js               # 应用程序入口点
│   ├── controllers          # 控制器目录
│   │   └── index.js         # 控制器实现
│   ├── routes               # 路由目录
│   │   └── index.js         # 路由设置
│   └── models               # 模型目录
│       └── index.js         # 数据模型实现
├── package.json             # npm 配置文件
├── .gitignore               # 版本控制忽略文件
└── README.md                # 项目文档
```

## 安装依赖

在项目根目录下运行以下命令以安装依赖：

```
npm install
```

## 启动应用

使用以下命令启动应用程序：

```
npm start
```

## 数据库

CREATE TABLE IF NOT EXISTS user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

CREATE TABLE IF NOT EXISTS `order` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id)
)

## 贡献

欢迎提出问题和贡献代码！