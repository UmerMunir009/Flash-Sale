CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE wishlists (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at  TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_user_product UNIQUE (user_id, product_id)
);