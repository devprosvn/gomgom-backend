# Enhanced Database Schema with Demo Brands

## Overview

The GomGom database schema has been successfully updated to include the five specific demo brands requested for the HDBank Hackathon project:

1. **HDBank** (Banking) - 1.5x loyalty multiplier
2. **HD Saison** (Finance) - 1.25x loyalty multiplier  
3. **Vietjet Air** (Airline) - 2.0x loyalty multiplier
4. **Dragon City** (Real Estate) - 1.75x loyalty multiplier
5. **Ha Long Star** (Hospitality) - 1.8x loyalty multiplier

## New Features Added

### 1. Brand Partners Table
- Stores partner brand information
- Includes loyalty multipliers for each brand
- Tier-specific benefits in JSONB format
- Brand categorization and metadata

### 2. Enhanced User Actions
- Added `brand_id` column to track brand-specific activities
- Extended action types to include brand-specific actions:
  - HDBank: `hdbank_deposit`, `hdbank_credit_card_usage`, `hdbank_investment`
  - HD Saison: `hd_saison_loan_application`, `hd_saison_payment`
  - Vietjet Air: `vietjet_flight_booking`, `vietjet_checkin`, `vietjet_loyalty_signup`
  - Dragon City: `dragon_city_property_inquiry`, `dragon_city_property_purchase`, `dragon_city_consultation`
  - Ha Long Star: `halong_star_booking`, `halong_star_checkin`, `halong_star_spa_service`

### 3. Brand-Specific Perks
- 16 brand-specific perks across all partner brands
- 3 cross-brand loyalty perks
- Perks linked to specific brands or available across all brands

## Demo Brand Perks

### HDBank (Banking)
- **HDBank VIP Banking**: Access to VIP banking services with dedicated relationship manager
- **HDBank Credit Card Fee Waiver**: Annual fee waiver for HDBank premium credit cards
- **HDBank Investment Advisory**: Free consultation with investment experts

### HD Saison (Finance)
- **HD Saison Interest Rate Discount**: 0.5% interest rate reduction on personal loans
- **HD Saison Fast Loan Approval**: Priority processing for loan applications

### Vietjet Air (Airline)
- **Vietjet Priority Check-in**: Skip the lines with priority check-in counter access
- **Vietjet Baggage Allowance Upgrade**: Free 10kg additional baggage allowance
- **Vietjet Lounge Access**: Access to VietJet Sky Lounge at major airports
- **Vietjet Free Seat Selection**: Complimentary seat selection for all flights

### Dragon City (Real Estate)
- **Dragon City VIP Property Tour**: Exclusive guided tours of premium properties
- **Dragon City Investment Consultation**: Free consultation with real estate investment experts
- **Dragon City Purchase Discount**: 2% discount on property purchase price

### Ha Long Star (Hospitality)
- **Ha Long Star Room Upgrade**: Complimentary room upgrade to next category
- **Ha Long Star Spa Discount**: 20% discount on all spa and wellness services
- **Ha Long Star Late Checkout**: Late checkout until 2 PM without additional charges
- **Ha Long Star VIP Concierge**: Access to dedicated concierge services

### Cross-Brand Perks
- **Multi-Brand Elite Status**: Accelerated tier progression across all partner brands
- **Partner Network Cashback**: 1.5x cashback when using services across different brands
- **Exclusive Partner Events**: Invitations to exclusive networking events

## Enhanced Views and Analytics

### Brand Analytics View
Provides comprehensive metrics for each brand:
- Active users count
- Total actions performed
- Available perks count
- Average user loyalty points

### Enhanced NFT Complete Info View
Now includes brand activity counters for:
- HDBank activities
- Vietjet Air activities
- Ha Long Star activities

### User Activity Summary
Includes:
- Number of brands engaged with
- Most active brand per user
- Cross-brand engagement metrics

## Database Statistics

✅ **Current Status**: All tables operational
- **Brand Partners**: 5 demo brands configured
- **Total Perks**: 19 (16 brand-specific + 3 cross-brand)
- **Action Types**: 15+ including brand-specific actions
- **Views**: 3 enhanced analytical views

## Testing Commands

```bash
# Test database health
npm run db:health

# Test brand integration
npm run test:brands

# Reset and reseed database
npm run db:reset
npm run db:seed
```

## API Integration Ready

The database schema is now fully prepared for:
- Brand-specific loyalty tracking
- Cross-brand reward systems
- Dynamic NFT attribute updates based on brand interactions
- Comprehensive analytics and reporting
- Demo scenarios with real Vietnamese brand partners

All demo brands are configured with realistic tier benefits and loyalty multipliers appropriate for their respective industries.