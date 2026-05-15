CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE deal_status AS ENUM ('pending', 'active', 'expired');

CREATE TABLE deals (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  discount_percentage DECIMAL(5, 2) NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  start_time          TIMESTAMP NOT NULL,
  end_time            TIMESTAMP NOT NULL,
  status              deal_status NOT NULL DEFAULT 'pending',
  purchase_count      INTEGER NOT NULL DEFAULT 0 CHECK (purchase_count >= 0),
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW(),


  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);