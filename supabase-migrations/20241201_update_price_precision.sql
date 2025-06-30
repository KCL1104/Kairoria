-- Migration: Update price fields to support Solana USDC storage units
-- This migration changes price fields from DECIMAL(12,2) to DECIMAL(18,6)
-- to properly store Solana USDC amounts in their smallest units (6 decimal places)

BEGIN;

-- Update products table price fields to support 6 decimal places
ALTER TABLE products 
  ALTER COLUMN price_per_day TYPE DECIMAL(18,6),
  ALTER COLUMN price_per_hour TYPE DECIMAL(18,6),
  ALTER COLUMN security_deposit TYPE DECIMAL(18,6);

-- Update bookings table total_price field to support 6 decimal places
ALTER TABLE bookings 
  ALTER COLUMN total_price TYPE DECIMAL(18,6);

-- Add comment to document the change
COMMENT ON COLUMN products.price_per_day IS 'Price per day in USDC smallest units (6 decimal places)';
COMMENT ON COLUMN products.price_per_hour IS 'Price per hour in USDC smallest units (6 decimal places)';
COMMENT ON COLUMN products.security_deposit IS 'Security deposit in USDC smallest units (6 decimal places)';
COMMENT ON COLUMN bookings.total_price IS 'Total booking price in USDC smallest units (6 decimal places)';

COMMIT;