import express from 'express';
import usersRouter from './routes/users';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// 路由
app.use('/users', usersRouter);

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