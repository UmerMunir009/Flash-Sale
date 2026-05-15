CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE purchases (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deal_id     UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  created_at  TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_user_deal UNIQUE (user_id, deal_id)
);