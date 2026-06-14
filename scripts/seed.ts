import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as bcrypt from 'bcryptjs';
import { users, categories, products } from '../lib/db/schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function main() {
  console.log('Seeding database...');

  // Seed users
  const adminPassword = await bcrypt.hash('password', 10);
  const cashierPassword = await bcrypt.hash('password', 10);

  await db.insert(users).values([
    { username: 'admin', password: adminPassword, role: 'admin' },
    { username: 'cashier', password: cashierPassword, role: 'cashier' },
  ]).onConflictDoNothing();

  console.log('Seeded users');

  // Seed categories
  const insertedCategories = await db.insert(categories).values([
    { name: 'Appetizers' },
    { name: 'Seafood platters' },
    { name: 'Fish' },
    { name: 'Shrimp' },
    { name: 'Crab' },
    { name: 'Squid' },
    { name: 'Rice' },
    { name: 'Drinks' },
    { name: 'Dessert' },
  ]).returning();

  console.log('Seeded categories');

  // Find some category IDs
  const seafoodId = insertedCategories.find(c => c.name === 'Seafood platters')?.id || insertedCategories[0].id;
  const shrimpId = insertedCategories.find(c => c.name === 'Shrimp')?.id || insertedCategories[0].id;
  
  // Seed products
  await db.insert(products).values([
    { name: 'Spicy Shrimp Rice', price: '8.99', categoryId: shrimpId, imageUrl: '/spicy-shrimp-rice.png' },
    { name: 'Garlic fried butter', price: '8.99', categoryId: seafoodId, imageUrl: '/garlic-fried-butter.png' },
    { name: 'Thai hot seafood', price: '8.99', categoryId: seafoodId, imageUrl: '/thai-hot-seafood.png' },
  ]).onConflictDoNothing();

  console.log('Seeded products');
  console.log('Database seeding completed successfully!');
}

main().catch((err) => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
