-- GomGom Database Schema
-- HDBank Hackathon Project
-- Comprehensive schema for Dynamic NFTs and Perks system

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist (for re-running the script)
DROP TABLE IF EXISTS user_perk_claims CASCADE;
DROP TABLE IF EXISTS user_actions CASCADE;
DROP TABLE IF EXISTS perks CASCADE;
DROP TABLE IF EXISTS nft_attributes CASCADE;
DROP TABLE IF EXISTS loyalty_nfts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS brand_partners CASCADE;

-- =============================================================================
-- USERS TABLE
-- =============================================================================
-- Stores basic user information indexed by wallet address
CREATE TABLE users (
    wallet_address VARCHAR(42) PRIMARY KEY NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Additional user metadata
    display_name VARCHAR(255),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    
    -- Constraints
    CONSTRAINT valid_wallet_address CHECK (
        wallet_address ~ '^0x[a-fA-F0-9]{40}$'
    )
);

-- Index for efficient lookups
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_is_active ON users(is_active);

-- =============================================================================
-- LOYALTY_NFTS TABLE
-- =============================================================================
-- Stores core NFT ownership data
CREATE TABLE loyalty_nfts (
    token_id INT PRIMARY KEY NOT NULL,
    owner_wallet_address VARCHAR(42) NOT NULL,
    minted_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- NFT metadata
    token_uri TEXT,
    is_staked BOOLEAN DEFAULT false,
    
    -- Constraints and relationships
    CONSTRAINT fk_loyalty_nft_owner 
        FOREIGN KEY (owner_wallet_address) 
        REFERENCES users(wallet_address) 
        ON DELETE CASCADE,
    
    CONSTRAINT positive_token_id CHECK (token_id >= 0)
);

-- Indexes for efficient queries
CREATE INDEX idx_loyalty_nfts_owner ON loyalty_nfts(owner_wallet_address);
CREATE INDEX idx_loyalty_nfts_minted_at ON loyalty_nfts(minted_at);
CREATE INDEX idx_loyalty_nfts_is_staked ON loyalty_nfts(is_staked);

-- =============================================================================
-- NFT_ATTRIBUTES TABLE
-- =============================================================================
-- Stores dynamic attributes for each NFT (1:1 relationship with loyalty_nfts)
CREATE TABLE nft_attributes (
    nft_token_id INT PRIMARY KEY NOT NULL,
    
    -- Core loyalty metrics
    loyalty_level INT DEFAULT 1,
    loyalty_points INT DEFAULT 0,
    flights_taken INT DEFAULT 0,
    bank_tier VARCHAR(50) DEFAULT 'Standard',
    resorts_visited INT DEFAULT 0,
    
    -- Metadata
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    -- Additional attributes for extensibility
    total_spending DECIMAL(12,2) DEFAULT 0.00,
    miles_earned INT DEFAULT 0,
    status_tier VARCHAR(50) DEFAULT 'Bronze',
    
    -- Constraints and relationships
    CONSTRAINT fk_nft_attributes_token 
        FOREIGN KEY (nft_token_id) 
        REFERENCES loyalty_nfts(token_id) 
        ON DELETE CASCADE,
    
    -- Data validation constraints
    CONSTRAINT valid_loyalty_level CHECK (loyalty_level >= 1 AND loyalty_level <= 10),
    CONSTRAINT valid_loyalty_points CHECK (loyalty_points >= 0),
    CONSTRAINT valid_flights_taken CHECK (flights_taken >= 0),
    CONSTRAINT valid_resorts_visited CHECK (resorts_visited >= 0),
    CONSTRAINT valid_total_spending CHECK (total_spending >= 0),
    CONSTRAINT valid_miles_earned CHECK (miles_earned >= 0),
    CONSTRAINT valid_bank_tier CHECK (bank_tier IN ('Standard', 'Silver', 'Gold', 'Platinum', 'Diamond')),
    CONSTRAINT valid_status_tier CHECK (status_tier IN ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'))
);

-- Indexes for efficient attribute queries
CREATE INDEX idx_nft_attributes_loyalty_level ON nft_attributes(loyalty_level);
CREATE INDEX idx_nft_attributes_loyalty_points ON nft_attributes(loyalty_points);
CREATE INDEX idx_nft_attributes_bank_tier ON nft_attributes(bank_tier);
CREATE INDEX idx_nft_attributes_last_updated ON nft_attributes(last_updated);

-- =============================================================================
-- BRAND PARTNERS TABLE
-- =============================================================================
-- Stores information about partner brands for demo
CREATE TABLE brand_partners (
    brand_id SERIAL PRIMARY KEY,
    brand_name VARCHAR(255) NOT NULL UNIQUE,
    brand_type VARCHAR(100) NOT NULL,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Brand-specific configuration
    loyalty_multiplier DECIMAL(3,2) DEFAULT 1.00,
    tier_benefits JSONB,
    
    -- Constraints
    CONSTRAINT valid_brand_type CHECK (
        brand_type IN ('banking', 'finance', 'airline', 'real_estate', 'hospitality', 'retail', 'travel')
    ),
    CONSTRAINT valid_loyalty_multiplier CHECK (loyalty_multiplier > 0)
);

-- Indexes for brand queries
CREATE INDEX idx_brand_partners_type ON brand_partners(brand_type);
CREATE INDEX idx_brand_partners_active ON brand_partners(is_active);
CREATE INDEX idx_brand_partners_name ON brand_partners(brand_name);

-- =============================================================================
-- USER_ACTIONS TABLE
-- =============================================================================
-- Stores all user actions for processing and audit trail
CREATE TABLE user_actions (
    action_id SERIAL PRIMARY KEY,
    user_wallet_address VARCHAR(42) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_details JSONB,
    action_timestamp TIMESTAMPTZ DEFAULT NOW(),
    processed BOOLEAN DEFAULT false,
    brand_id INT REFERENCES brand_partners(brand_id),
    
    -- Processing metadata
    processed_at TIMESTAMPTZ,
    processing_error TEXT,
    retry_count INT DEFAULT 0,
    
    -- Constraints and relationships
    CONSTRAINT fk_user_actions_user 
        FOREIGN KEY (user_wallet_address) 
        REFERENCES users(wallet_address) 
        ON DELETE CASCADE,
    
    -- Data validation
    CONSTRAINT valid_action_type CHECK (
        action_type IN (
            'flight_booking', 'hotel_booking', 'resort_visit', 
            'bank_transaction', 'loyalty_redemption', 'referral',
            'nft_mint', 'nft_stake', 'nft_unstake', 'perk_claim',
            -- Brand-specific actions
            'hdbank_deposit', 'hdbank_credit_card_usage', 'hdbank_investment',
            'hd_saison_loan_application', 'hd_saison_payment', 
            'vietjet_flight_booking', 'vietjet_checkin', 'vietjet_loyalty_signup',
            'dragon_city_property_inquiry', 'dragon_city_property_purchase', 'dragon_city_consultation',
            'halong_star_booking', 'halong_star_checkin', 'halong_star_spa_service',
            -- Cross-brand activities
            'partner_referral', 'cross_brand_transaction', 'multi_brand_milestone'
        )
    ),
    CONSTRAINT valid_retry_count CHECK (retry_count >= 0)
);

-- Indexes for efficient action processing
CREATE INDEX idx_user_actions_user ON user_actions(user_wallet_address);
CREATE INDEX idx_user_actions_type ON user_actions(action_type);
CREATE INDEX idx_user_actions_processed ON user_actions(processed, action_timestamp);
CREATE INDEX idx_user_actions_timestamp ON user_actions(action_timestamp);
CREATE INDEX idx_user_actions_details_gin ON user_actions USING GIN (action_details);
CREATE INDEX idx_user_actions_brand ON user_actions(brand_id);

-- =============================================================================
-- PERKS TABLE
-- =============================================================================
-- Stores available perks and their unlock conditions
CREATE TABLE perks (
    perk_id SERIAL PRIMARY KEY,
    perk_name VARCHAR(255) NOT NULL,
    description TEXT,
    unlock_type VARCHAR(50) NOT NULL,
    unlock_threshold VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    brand_id INT REFERENCES brand_partners(brand_id),
    
    -- Perk metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    category VARCHAR(100),
    value_type VARCHAR(50) DEFAULT 'discount', -- discount, cashback, upgrade, etc.
    value_amount DECIMAL(10,2),
    
    -- Usage constraints
    usage_limit INT, -- NULL means unlimited
    expiry_days INT, -- NULL means no expiry
    
    -- Constraints
    CONSTRAINT valid_unlock_type CHECK (
        unlock_type IN (
            'loyalty_level', 'loyalty_points', 'flights_taken', 
            'bank_tier', 'resorts_visited', 'total_spending',
            'miles_earned', 'status_tier', 'combined'
        )
    ),
    CONSTRAINT valid_value_type CHECK (
        value_type IN ('discount', 'cashback', 'upgrade', 'free_service', 'priority_access')
    ),
    CONSTRAINT positive_value_amount CHECK (value_amount >= 0),
    CONSTRAINT positive_usage_limit CHECK (usage_limit > 0),
    CONSTRAINT positive_expiry_days CHECK (expiry_days > 0)
);

-- Indexes for efficient perk queries
CREATE INDEX idx_perks_unlock_type ON perks(unlock_type);
CREATE INDEX idx_perks_is_active ON perks(is_active);
CREATE INDEX idx_perks_category ON perks(category);
CREATE INDEX idx_perks_created_at ON perks(created_at);
CREATE INDEX idx_perks_brand ON perks(brand_id);

-- =============================================================================
-- ADDITIONAL UTILITY TABLES
-- =============================================================================

-- User Perk Claims tracking
CREATE TABLE user_perk_claims (
    claim_id SERIAL PRIMARY KEY,
    user_wallet_address VARCHAR(42) NOT NULL,
    perk_id INT NOT NULL,
    claimed_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_used BOOLEAN DEFAULT false,
    
    -- Constraints
    CONSTRAINT fk_user_perk_claims_user 
        FOREIGN KEY (user_wallet_address) 
        REFERENCES users(wallet_address) 
        ON DELETE CASCADE,
    CONSTRAINT fk_user_perk_claims_perk 
        FOREIGN KEY (perk_id) 
        REFERENCES perks(perk_id) 
        ON DELETE CASCADE,
    
    -- Prevent duplicate active claims for limited perks
    CONSTRAINT unique_active_claim UNIQUE (user_wallet_address, perk_id, claimed_at)
);

CREATE INDEX idx_user_perk_claims_user ON user_perk_claims(user_wallet_address);
CREATE INDEX idx_user_perk_claims_perk ON user_perk_claims(perk_id);
CREATE INDEX idx_user_perk_claims_expires ON user_perk_claims(expires_at);

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nft_attributes_last_updated 
    BEFORE UPDATE ON nft_attributes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_perks_updated_at 
    BEFORE UPDATE ON perks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_partners_updated_at 
    BEFORE UPDATE ON brand_partners 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Complete NFT information with attributes and brand activities
CREATE OR REPLACE VIEW nft_complete_info AS
SELECT 
    ln.token_id,
    ln.owner_wallet_address,
    ln.minted_at,
    ln.token_uri,
    ln.is_staked,
    na.loyalty_level,
    na.loyalty_points,
    na.flights_taken,
    na.bank_tier,
    na.resorts_visited,
    na.total_spending,
    na.miles_earned,
    na.status_tier,
    na.last_updated,
    u.display_name as owner_display_name,
    u.created_at as owner_joined_at,
    -- Brand activity summary
    (
        SELECT COUNT(*) 
        FROM user_actions ua 
        JOIN brand_partners bp ON ua.brand_id = bp.brand_id 
        WHERE ua.user_wallet_address = ln.owner_wallet_address 
        AND bp.brand_name = 'HDBank'
    ) as hdbank_activities,
    (
        SELECT COUNT(*) 
        FROM user_actions ua 
        JOIN brand_partners bp ON ua.brand_id = bp.brand_id 
        WHERE ua.user_wallet_address = ln.owner_wallet_address 
        AND bp.brand_name = 'Vietjet Air'
    ) as vietjet_activities,
    (
        SELECT COUNT(*) 
        FROM user_actions ua 
        JOIN brand_partners bp ON ua.brand_id = bp.brand_id 
        WHERE ua.user_wallet_address = ln.owner_wallet_address 
        AND bp.brand_name = 'Ha Long Star'
    ) as halong_star_activities
FROM loyalty_nfts ln
LEFT JOIN nft_attributes na ON ln.token_id = na.nft_token_id
LEFT JOIN users u ON ln.owner_wallet_address = u.wallet_address;

-- User activity summary with brand engagement
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
    u.wallet_address,
    u.display_name,
    u.created_at as user_since,
    COUNT(ln.token_id) as nfts_owned,
    COUNT(ua.action_id) as total_actions,
    COUNT(CASE WHEN ua.processed = false THEN 1 END) as pending_actions,
    MAX(ua.action_timestamp) as last_action_at,
    COUNT(DISTINCT ua.brand_id) as brands_engaged,
    -- Most active brand
    (
        SELECT bp.brand_name 
        FROM user_actions ua2 
        JOIN brand_partners bp ON ua2.brand_id = bp.brand_id 
        WHERE ua2.user_wallet_address = u.wallet_address 
        GROUP BY bp.brand_name 
        ORDER BY COUNT(*) DESC 
        LIMIT 1
    ) as most_active_brand
FROM users u
LEFT JOIN loyalty_nfts ln ON u.wallet_address = ln.owner_wallet_address
LEFT JOIN user_actions ua ON u.wallet_address = ua.user_wallet_address
GROUP BY u.wallet_address, u.display_name, u.created_at;

-- Brand performance analytics view
CREATE OR REPLACE VIEW brand_analytics AS
SELECT 
    bp.brand_id,
    bp.brand_name,
    bp.brand_type,
    bp.loyalty_multiplier,
    COUNT(DISTINCT ua.user_wallet_address) as active_users,
    COUNT(ua.action_id) as total_actions,
    COUNT(CASE WHEN ua.processed = true THEN 1 END) as processed_actions,
    AVG(CASE WHEN na.loyalty_points > 0 THEN na.loyalty_points END) as avg_user_loyalty_points,
    COUNT(upc.claim_id) as total_perk_claims,
    COUNT(p.perk_id) as available_perks
FROM brand_partners bp
LEFT JOIN user_actions ua ON bp.brand_id = ua.brand_id
LEFT JOIN users u ON ua.user_wallet_address = u.wallet_address
LEFT JOIN loyalty_nfts ln ON u.wallet_address = ln.owner_wallet_address
LEFT JOIN nft_attributes na ON ln.token_id = na.nft_token_id
LEFT JOIN perks p ON bp.brand_id = p.brand_id
LEFT JOIN user_perk_claims upc ON p.perk_id = upc.perk_id
WHERE bp.is_active = true
GROUP BY bp.brand_id, bp.brand_name, bp.brand_type, bp.loyalty_multiplier
ORDER BY active_users DESC;

-- =============================================================================
-- SAMPLE DATA (Demo Brands and Perks)
-- =============================================================================

-- Insert demo brand partners
INSERT INTO brand_partners (brand_name, brand_type, description, loyalty_multiplier, tier_benefits) VALUES
('HDBank', 'banking', 'Leading Vietnamese bank offering comprehensive financial services', 1.50, 
 '{"Standard": {"cashback": 0.5}, "Silver": {"cashback": 1.0}, "Gold": {"cashback": 1.5}, "Platinum": {"cashback": 2.0}, "Diamond": {"cashback": 3.0}}'),

('HD Saison', 'finance', 'Consumer finance company providing credit and payment solutions', 1.25,
 '{"Standard": {"interest_discount": 0.1}, "Silver": {"interest_discount": 0.2}, "Gold": {"interest_discount": 0.3}, "Platinum": {"interest_discount": 0.5}, "Diamond": {"interest_discount": 0.7}}'),

('Vietjet Air', 'airline', 'Vietnam''s leading low-cost airline with extensive domestic and international routes', 2.00,
 '{"Standard": {"baggage_discount": 10}, "Silver": {"baggage_discount": 15, "priority_checkin": true}, "Gold": {"baggage_discount": 20, "priority_checkin": true, "lounge_access": "domestic"}, "Platinum": {"baggage_discount": 25, "priority_checkin": true, "lounge_access": "international"}, "Diamond": {"baggage_discount": 30, "priority_checkin": true, "lounge_access": "premium", "free_seat_selection": true}}'),

('Dragon City', 'real_estate', 'Premium real estate development company specializing in luxury properties', 1.75,
 '{"Standard": {"consultation_discount": 2}, "Silver": {"consultation_discount": 3, "priority_viewing": true}, "Gold": {"consultation_discount": 5, "priority_viewing": true, "exclusive_events": true}, "Platinum": {"consultation_discount": 7, "priority_viewing": true, "exclusive_events": true, "vip_support": true}, "Diamond": {"consultation_discount": 10, "priority_viewing": true, "exclusive_events": true, "vip_support": true, "investment_advisory": true}}'),

('Ha Long Star', 'hospitality', 'Luxury resort and hospitality group in the scenic Ha Long Bay area', 1.80,
 '{"Standard": {"room_discount": 5}, "Silver": {"room_discount": 10, "late_checkout": true}, "Gold": {"room_discount": 15, "late_checkout": true, "spa_discount": 10}, "Platinum": {"room_discount": 20, "late_checkout": true, "spa_discount": 15, "complimentary_breakfast": true}, "Diamond": {"room_discount": 25, "late_checkout": true, "spa_discount": 20, "complimentary_breakfast": true, "suite_upgrade": true, "private_concierge": true}}');

-- Insert brand-specific perks
INSERT INTO perks (perk_name, description, unlock_type, unlock_threshold, category, value_type, value_amount, brand_id) VALUES
-- HDBank Perks
('HDBank VIP Banking', 'Access to VIP banking services with dedicated relationship manager', 'bank_tier', 'Gold', 'banking', 'free_service', 0, 
 (SELECT brand_id FROM brand_partners WHERE brand_name = 'HDBank')),
('HDBank Credit Card Fee Waiver', 'Annual fee waiver for HDBank premium credit cards', 'loyalty_points', '5000', 'banking', 'discount', 100.00,
 (SELECT brand_id FROM brand_partners WHERE brand_name = 'HDBank')),
('HDBank Investment Advisory', 'Free consultation with investment experts', 'bank_tier', 'Platinum', 'banking', 'free_service', 0,
 (SELECT brand_id FROM brand_partners WHERE brand_name = 'HDBank')),

-- HD Saison Perks
('HD Saison Interest Rate Discount', '0.5% interest rate reduction on personal loans', 'loyalty_level', '3', 'finance', 'discount', 0.5,
 (SELECT brand_id FROM brand_partners WHERE brand_name = 'HD Saison')),
('HD Saison Fast Loan Approval', 'Priority processing for loan applications', 'total_spending', '50000000', 'finance', 'priority_access', 0,
 (SELECT brand_id FROM brand_partners WHERE brand_name = 'HD Saison')),

-- Vietjet Air Perks
('Vietjet Priority Check-in', 'Skip the lines with priority check-in counter access', 'flights_taken', '5', 'travel', 'priority_access', 0,
 (SELECT brand_id FROM brand_partners WHERE brand_name = 'Vietjet Air')),
('Vietjet Baggage Allowance Upgrade', 'Free 10kg additional baggage allowance', 'flights_taken', '10', 'travel', 'upgrade', 0,
 (SELECT brand_id FROM brand_partners WHERE brand_name = 'Vietjet Air')),
('Vietjet Lounge Access', 'Access to VietJet Sky Lounge at major airports', 'loyalty_level', '4', 'travel', 'free_service', 0,
 (SELECT brand_id FROM brand_partners WHERE brand_name = 'Vietjet Air')),
('Vietjet Free Seat Selection', 'Complimentary seat selection for all flights', 'miles_earned', '25000', 'travel', 'free_service', 0,
 (SELECT brand_id FROM brand_partners WHERE brand_name = 'Vietjet Air')),

-- Dragon City Perks
('Dragon City VIP Property Tour', 'Exclusive guided tours of premium properties with refreshments', 'total_spending', '100000000', 'real_estate', 'free_service', 0,
 (SELECT brand_id FROM brand_partners WHERE brand_name = 'Dragon City')),
('Dragon City Investment Consultation', 'Free consultation with real estate investment experts', 'loyalty_level', '3', 'real_estate', 'free_service', 0,
 (SELECT brand_id FROM brand_partners WHERE brand_name = 'Dragon City')),
('Dragon City Purchase Discount', '2% discount on property purchase price', 'loyalty_points', '15000', 'real_estate', 'discount', 2.00,
 (SELECT brand_id FROM brand_partners WHERE brand_name = 'Dragon City')),

-- Ha Long Star Perks
('Ha Long Star Room Upgrade', 'Complimentary room upgrade to next category (subject to availability)', 'resorts_visited', '3', 'hospitality', 'upgrade', 0,
 (SELECT brand_id FROM brand_partners WHERE brand_name = 'Ha Long Star')),
('Ha Long Star Spa Discount', '20% discount on all spa and wellness services', 'loyalty_level', '2', 'hospitality', 'discount', 20.00,
 (SELECT brand_id FROM brand_partners WHERE brand_name = 'Ha Long Star')),
('Ha Long Star Late Checkout', 'Late checkout until 2 PM without additional charges', 'resorts_visited', '2', 'hospitality', 'free_service', 0,
 (SELECT brand_id FROM brand_partners WHERE brand_name = 'Ha Long Star')),
('Ha Long Star VIP Concierge', 'Access to dedicated concierge services for tour planning and reservations', 'status_tier', 'Platinum', 'hospitality', 'free_service', 0,
 (SELECT brand_id FROM brand_partners WHERE brand_name = 'Ha Long Star')),

-- Cross-brand loyalty perks
('Multi-Brand Elite Status', 'Accelerated tier progression across all partner brands', 'loyalty_points', '20000', 'loyalty', 'upgrade', 0, NULL),
('Partner Network Cashback', '1.5x cashback when using services across different partner brands', 'loyalty_level', '5', 'loyalty', 'cashback', 1.50, NULL),
('Exclusive Partner Events', 'Invitations to exclusive networking events with all partner brands', 'status_tier', 'Diamond', 'loyalty', 'free_service', 0, NULL);

-- =============================================================================
-- SCHEMA INFORMATION
-- =============================================================================

COMMENT ON TABLE users IS 'Stores user wallet addresses and basic profile information';
COMMENT ON TABLE loyalty_nfts IS 'Core NFT ownership data with basic metadata';
COMMENT ON TABLE nft_attributes IS 'Dynamic attributes for NFTs that change based on user activities';
COMMENT ON TABLE user_actions IS 'Audit trail of all user actions for processing rewards and updates, now with brand tracking';
COMMENT ON TABLE perks IS 'Available perks and their unlock conditions, both brand-specific and cross-brand';
COMMENT ON TABLE user_perk_claims IS 'Tracking of perk claims and usage by users';
COMMENT ON TABLE brand_partners IS 'Partner brands for demo: HDBank, HD Saison, Vietjet Air, Dragon City, Ha Long Star';

-- Additional comments for brand integration
COMMENT ON COLUMN user_actions.brand_id IS 'Links action to specific brand partner for brand-specific loyalty tracking';
COMMENT ON COLUMN perks.brand_id IS 'NULL for cross-brand perks, specific brand_id for brand-exclusive perks';
COMMENT ON COLUMN brand_partners.loyalty_multiplier IS 'Multiplier for loyalty points earned through this brand';
COMMENT ON COLUMN brand_partners.tier_benefits IS 'JSON object defining tier-specific benefits for this brand';

-- Grant necessary permissions (adjust as needed for your deployment)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- Schema creation completed with demo brands
SELECT 'GomGom Database Schema with Demo Brands (HDBank, HD Saison, Vietjet Air, Dragon City, Ha Long Star) Created Successfully!' as result;