import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// 需要先调用 dotenv.config() 来加载 .env 文件中的环境变量
dotenv.config();

const sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.MYSQL_HOST || 'localhost',
    username: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '', 
    database: process.env.MYSQL_DATABASE || 'payment1'
    // 其他配置...
});

export default sequelize;