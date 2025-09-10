-- Migration script for Dynamic NFT Architecture
-- Updates the existing schema to support dynamic NFT metadata

-- Update the loyalty_level constraint to allow level 0 (starting level)
-- and extend to level 7 (max level as per our configuration)
ALTER TABLE nft_attributes 
DROP CONSTRAINT IF EXISTS valid_loyalty_level;

ALTER TABLE nft_attributes 
ADD CONSTRAINT valid_loyalty_level CHECK (loyalty_level >= 0 AND loyalty_level <= 7);

-- Update the default loyalty_level to 0 (starting level)
ALTER TABLE nft_attributes 
ALTER COLUMN loyalty_level SET DEFAULT 0;

-- Add index for token_uri lookups (for reverse metadata queries)
CREATE INDEX IF NOT EXISTS idx_loyalty_nfts_token_uri ON loyalty_nfts(token_uri);

-- Add function to automatically calculate and update loyalty level
CREATE OR REPLACE FUNCTION calculate_and_update_loyalty_level(p_token_id INT)
RETURNS INT AS $$
DECLARE
    v_loyalty_points INT;
    v_flights_taken INT;
    v_total_spending DECIMAL;
    v_bank_tier VARCHAR(50);
    v_new_level INT := 0;
BEGIN
    -- Get current attributes
    SELECT loyalty_points, flights_taken, total_spending, bank_tier
    INTO v_loyalty_points, v_flights_taken, v_total_spending, v_bank_tier
    FROM nft_attributes
    WHERE nft_token_id = p_token_id;
    
    -- If no record found, return 0
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Calculate loyalty level based on conditions
    -- Level 7: Royal Crown (Ultimate tier)
    IF v_loyalty_points >= 50000 AND v_flights_taken >= 75 AND v_total_spending >= 500000000 AND v_bank_tier = 'Diamond' THEN
        v_new_level := 7;
    -- Level 6: Elite Wings
    ELSIF v_loyalty_points >= 35000 AND v_flights_taken >= 50 AND v_total_spending >= 300000000 AND v_bank_tier = 'Diamond' THEN
        v_new_level := 6;
    -- Level 5: Platinum Voyager
    ELSIF v_loyalty_points >= 20000 AND v_flights_taken >= 35 AND v_total_spending >= 150000000 AND v_bank_tier IN ('Platinum', 'Diamond') THEN
        v_new_level := 5;
    -- Level 4: Diamond Explorer
    ELSIF v_loyalty_points >= 10000 AND v_flights_taken >= 20 AND v_total_spending >= 75000000 AND v_bank_tier IN ('Platinum', 'Diamond') THEN
        v_new_level := 4;
    -- Level 3: Gold Adventurer
    ELSIF v_loyalty_points >= 5000 AND v_flights_taken >= 10 AND v_total_spending >= 35000000 AND v_bank_tier IN ('Gold', 'Platinum', 'Diamond') THEN
        v_new_level := 3;
    -- Level 2: Silver Navigator
    ELSIF v_loyalty_points >= 2500 AND v_flights_taken >= 5 AND v_total_spending >= 15000000 AND v_bank_tier IN ('Silver', 'Gold', 'Platinum', 'Diamond') THEN
        v_new_level := 2;
    -- Level 1: Bronze Traveler
    ELSIF v_loyalty_points >= 1000 AND v_flights_taken >= 2 AND v_total_spending >= 5000000 THEN
        v_new_level := 1;
    -- Level 0: Explorer (default starting level)
    ELSE
        v_new_level := 0;
    END IF;
    
    -- Update the loyalty level
    UPDATE nft_attributes 
    SET loyalty_level = v_new_level, 
        last_updated = NOW()
    WHERE nft_token_id = p_token_id;
    
    RETURN v_new_level;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update loyalty level when attributes change
CREATE OR REPLACE FUNCTION trigger_update_loyalty_level()
RETURNS TRIGGER AS $$
BEGIN
    -- Only recalculate if relevant fields have changed
    IF OLD.loyalty_points != NEW.loyalty_points OR 
       OLD.flights_taken != NEW.flights_taken OR 
       OLD.total_spending != NEW.total_spending OR 
       OLD.bank_tier != NEW.bank_tier THEN
        
        NEW.loyalty_level := calculate_and_update_loyalty_level(NEW.nft_token_id);
        NEW.last_updated := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS update_loyalty_level_trigger ON nft_attributes;
CREATE TRIGGER update_loyalty_level_trigger
    BEFORE UPDATE ON nft_attributes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_loyalty_level();

-- Add function to get NFT metadata for API
CREATE OR REPLACE FUNCTION get_nft_metadata(p_token_id INT)
RETURNS TABLE(
    token_id INT,
    owner_wallet_address VARCHAR(42),
    minted_at TIMESTAMPTZ,
    loyalty_level INT,
    loyalty_points INT,
    flights_taken INT,
    bank_tier VARCHAR(50),
    resorts_visited INT,
    total_spending DECIMAL(12,2),
    miles_earned INT,
    status_tier VARCHAR(50),
    last_updated TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ln.token_id,
        ln.owner_wallet_address,
        ln.minted_at,
        COALESCE(na.loyalty_level, 0) as loyalty_level,
        COALESCE(na.loyalty_points, 0) as loyalty_points,
        COALESCE(na.flights_taken, 0) as flights_taken,
        COALESCE(na.bank_tier, 'Standard') as bank_tier,
        COALESCE(na.resorts_visited, 0) as resorts_visited,
        COALESCE(na.total_spending, 0.00) as total_spending,
        COALESCE(na.miles_earned, 0) as miles_earned,
        COALESCE(na.status_tier, 'Bronze') as status_tier,
        COALESCE(na.last_updated, ln.minted_at) as last_updated
    FROM loyalty_nfts ln
    LEFT JOIN nft_attributes na ON ln.token_id = na.nft_token_id
    WHERE ln.token_id = p_token_id;
END;
$$ LANGUAGE plpgsql;

-- Update existing NFT attributes to have level 0 as starting point
UPDATE nft_attributes 
SET loyalty_level = 0 
WHERE loyalty_level = 1 AND loyalty_points = 0 AND flights_taken = 0 AND total_spending = 0;

-- Add comment to document the dynamic NFT architecture
COMMENT ON TABLE loyalty_nfts IS 'Core NFT ownership data with static tokenURI pointing to dynamic metadata API';
COMMENT ON COLUMN loyalty_nfts.token_uri IS 'Static API URL for dynamic metadata (e.g., https://api.gomgom.devpros.io.vn/metadata/1)';
COMMENT ON TABLE nft_attributes IS 'Dynamic attributes that change NFT appearance and unlock perks automatically';
COMMENT ON COLUMN nft_attributes.loyalty_level IS 'Current loyalty level (0-7) calculated automatically from user activities';
COMMENT ON FUNCTION calculate_and_update_loyalty_level(INT) IS 'Calculates loyalty level based on points, flights, spending, and bank tier';
COMMENT ON FUNCTION get_nft_metadata(INT) IS 'Returns complete NFT metadata for the dynamic metadata API endpoint';

-- Create a view for easy metadata API access
CREATE OR REPLACE VIEW nft_metadata_view AS
SELECT * FROM get_nft_metadata(NULL) WHERE FALSE; -- Template view structure

-- Grant necessary permissions for the API
-- Note: Adjust these permissions based on your database user setup
-- GRANT SELECT ON loyalty_nfts, nft_attributes TO your_api_user;
-- GRANT EXECUTE ON FUNCTION get_nft_metadata(INT) TO your_api_user;

-- Migration completed successfully
SELECT 'Dynamic NFT Architecture Migration Completed Successfully!' as result;