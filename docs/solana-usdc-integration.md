# Solana USDC Integration Guide

## Overview

This document explains how the Kairoria marketplace handles Solana USDC pricing and storage.

## USDC Storage Format

On Solana blockchain, USDC uses 6 decimal places for precision. This means:
- 1 USD = 1,000,000 USDC smallest units
- All prices are stored in the database as USDC smallest units
- Database fields use `DECIMAL(18,6)` to accommodate large values with 6 decimal precision

## Price Conversion Flow

### 1. User Input (Frontend)
- Users enter prices in USD format (e.g., "50.00" for $50)
- Input fields use `step="0.01"` for cent precision
- No conversion happens on the frontend - values are sent as USD

### 2. Backend Processing (Edge Functions)
- `create-product` Edge Function converts USD to USDC storage units
- Uses `convertToUSDCStorageUnits()` function:
  ```typescript
  function convertToUSDCStorageUnits(price: number): number {
    return Math.round(price * 1_000_000);
  }
  ```
- Applies to: `price_per_day`, `price_per_hour`, `security_deposit`

### 3. Database Storage
- All price fields store values in USDC smallest units
- Schema uses `DECIMAL(18,6)` for precision:
  - `products.price_per_day`
  - `products.price_per_hour` 
  - `products.security_deposit`
  - `bookings.total_price`

### 4. Display (Frontend)
- Uses `convertFromStorageAmount()` to convert back to USD for display
- Function defined in `lib/data.ts`:
  ```typescript
  export function convertFromStorageAmount(storageAmount: string | number): number {
    const amount = typeof storageAmount === 'string' ? parseFloat(storageAmount) : storageAmount;
    return amount / Math.pow(10, STORAGE_DECIMALS); // STORAGE_DECIMALS = 6
  }
  ```

## Files Modified for USDC Support

### Database Schema
- `supabase-schema.sql`: Updated price fields to `DECIMAL(18,6)`
- `supabase-migrations/20241201_update_price_precision.sql`: Migration script

### Backend
- `supabase/functions/create-product/index.ts`: Added USDC conversion logic

### Frontend
- `lib/data.ts`: Contains conversion utilities
- Updated price display components to use `convertFromStorageAmount()`:
  - `app/profile/bookings/page.tsx`: Booking list price display
  - `app/booking/confirmation/[bookingId]/page.tsx`: Booking confirmation price display
  - `app/booking/[productId]/payment/page.tsx`: Payment page price display
  - Product grid and related components already use proper conversion

## Example Price Flow

1. **User Input**: $50.00
2. **Edge Function**: Converts to 50,000,000 USDC units
3. **Database**: Stores as `50000000.000000`
4. **Display**: Converts back to $50.00 for user

## Migration Notes

- Existing data needs migration using the provided SQL script
- New deployments use updated schema automatically
- All price calculations maintain 6-decimal precision

## Testing Considerations

- Test with various price ranges (small and large amounts)
- Verify precision is maintained through conversion cycles
- Ensure UI displays correct USD amounts
- Test edge cases like very small amounts (< $0.01)
- Verify booking creation and payment flow with new USDC handling
- Test price display consistency across all pages

## Implementation Summary

✅ **Completed Updates:**
- Database schema updated to support 6-decimal precision
- Edge Function converts USD input to USDC storage units
- Frontend displays prices correctly using conversion utilities
- Booking API handles USDC amounts properly
- All price display components updated for consistency

⚠️ **Important Notes:**
- Existing data may need migration using provided SQL script
- All new bookings will use correct USDC format
- Price calculations maintain precision throughout the system