CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE products (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(200)     NOT NULL,
  description TEXT             NOT NULL,
  price       DECIMAL(10, 2)   NOT NULL CHECK (price >= 0),
  stock       INTEGER          NOT NULL DEFAULT 0 CHECK (stock >= 0),
  seller_id   UUID             NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMP        DEFAULT NOW(),
  updated_at  TIMESTAMP        DEFAULT NOW()
);