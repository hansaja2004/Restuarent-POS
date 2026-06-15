alter table products
  add column if not exists small_price numeric(10, 2),
  add column if not exists medium_price numeric(10, 2),
  add column if not exists large_price numeric(10, 2);

alter table order_items
  add column if not exists size text;
