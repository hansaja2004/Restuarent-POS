import { pgTable, text, serial, numeric, integer, timestamp, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  // Extended roles: 'admin' | 'manager' | 'director' | 'cashier'
  role: text('role').notNull().default('cashier'),
  employeeId: text('employee_id').unique(),
});

// Key-value store for POS tax/receipt/hardware configuration
export const posConfig = pgTable('pos_config', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  smallPrice: numeric('small_price', { precision: 10, scale: 2 }),
  mediumPrice: numeric('medium_price', { precision: 10, scale: 2 }),
  largePrice: numeric('large_price', { precision: 10, scale: 2 }),
  categoryId: integer('category_id').references(() => categories.id).notNull(),
  imageUrl: text('image_url'),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull().default('completed'), // e.g. completed
  createdAt: timestamp('created_at').defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  size: text('size'),
  quantity: integer('quantity').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
});
