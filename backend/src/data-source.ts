import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config();

const DB_CLIENT = (process.env.DATABASE_CLIENT || '').toLowerCase();

export const AppDataSource = new DataSource(
  DB_CLIENT === 'sqlite'
    ? {
        type: 'sqlite',
        database: process.env.SQLITE_PATH || 'caredroid.dev.sqlite',
        entities: [join(__dirname, '**', '*.entity.{ts,js}')],
        migrations: [join(__dirname, 'database', 'migrations', '*{.ts,.js}')],
        synchronize: false,
        logging: false,
      }
    : {
        type: 'postgres',
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        username: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD || 'postgres',
        database: process.env.DATABASE_NAME || 'caredroid',
        entities: [join(__dirname, '**', '*.entity.{ts,js}')],
        migrations: [join(__dirname, 'database', 'migrations', '*{.ts,.js}')],
        synchronize: false,
        logging: process.env.DATABASE_LOGGING === 'true',
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
      },
);
