/*
 * @Author: zada zada.wu@gmail.com
 * @Date: 2024-12-07 10:12:46
 * @LastEditors: zada zada.wu@gmail.com
 * @LastEditTime: 2024-12-07 11:41:40
 * @FilePath: /Kids_Todo_List/Users/zada/Downloads/CORSOR_COURSR/TuMo-Interview/src/app.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */ 
import express from 'express';
import usersRouter from './routes/users';
import dotenv from 'dotenv';
import orderRouter from './routes/order';

dotenv.config();

const app = express();
app.use(express.json());

// 路由
app.use('/users', usersRouter);
app.use('/orders', orderRouter);


const PORT = process.env.PORT || 3000;

// 初始化数据库并启动服务器
const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();