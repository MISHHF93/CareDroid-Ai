import { TypeOrmModuleOptions } from '@nestjs/typeorm';

// Support SQLite for local development when Docker/Postgres isn't available
const DB_CLIENT = (process.env.DATABASE_CLIENT || '').toLowerCase();

let config: TypeOrmModuleOptions;

if (DB_CLIENT === 'sqlite') {
  config = {
    type: 'sqlite',
    database: process.env.SQLITE_PATH || 'caredroid.dev.sqlite',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: true,
    logging: false,
  } as TypeOrmModuleOptions;
} else {
  // Default to Postgres
  config = {
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'caredroid',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.DATABASE_LOGGING === 'true',
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    migrationsRun: true,
    extra: {
      max: parseInt(process.env.DATABASE_POOL_SIZE || '10', 10),
    },
  } as TypeOrmModuleOptions;
}

export const databaseConfig: TypeOrmModuleOptions = config;
