import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = fileURLToPath(new URL('.', import.meta.url));

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const runMigration = async () => {
  const connection = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(connection);

  console.log('Running migrations...');
  
  try {
    await migrate(db, { migrationsFolder: join(__dirname, 'drizzle/migrations') });
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
};

runMigration(); 