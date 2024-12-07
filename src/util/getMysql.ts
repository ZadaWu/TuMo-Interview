import mysql from 'mysql2/promise';

class MySQLClient {
  private static instance: MySQLClient;
  private connection: mysql.Connection | null = null;

  private constructor() {}

  public static getInstance(): MySQLClient {
    if (!MySQLClient.instance) {
      MySQLClient.instance = new MySQLClient();
    }
    return MySQLClient.instance;
  }

  public async getConnection(): Promise<mysql.Connection> {
    if (!this.connection) {
      console.log('Creating new connection', process.env.MYSQL_HOST,process.env.MYSQL_USER, process.env.MYSQL_PASSWORD, process.env.MYSQL_DATABASE, process.env.MYSQL_DATABASE );
      this.connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST || 'localhost',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'payment'
      });
    }
    return this.connection;
  }

  public async query<T>(sql: string, values?: any[]): Promise<T> {
    const conn = await this.getConnection();
    const [results] = await conn.query(sql, values);
    return results as T;
  }

  public async close(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }
}

export default MySQLClient.getInstance();
