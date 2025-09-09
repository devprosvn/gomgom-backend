import dotenv from 'dotenv';
import path from 'path';
import { db } from './database';

// Load environment variables from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Test script to demonstrate brand integration
 */
async function testBrandIntegration(): Promise<void> {
  console.log('🧪 Testing Brand Integration...');
  
  try {
    // Test brand partners
    console.log('\n📋 Brand Partners:');
    const brands = await db.query('SELECT brand_id, brand_name, brand_type, loyalty_multiplier FROM brand_partners ORDER BY brand_name');
    brands.rows.forEach((brand: any) => {
      console.log(`  ${brand.brand_id}. ${brand.brand_name} (${brand.brand_type}) - ${brand.loyalty_multiplier}x multiplier`);
    });
    
    // Test brand-specific perks
    console.log('\n🎁 Brand-Specific Perks:');
    const brandPerks = await db.query(`
      SELECT p.perk_name, bp.brand_name, p.category, p.value_type, p.value_amount
      FROM perks p 
      JOIN brand_partners bp ON p.brand_id = bp.brand_id 
      ORDER BY bp.brand_name, p.perk_name
    `);
    
    let currentBrand = '';
    brandPerks.rows.forEach((perk: any) => {
      if (perk.brand_name !== currentBrand) {
        console.log(`\n  📍 ${perk.brand_name}:`);
        currentBrand = perk.brand_name;
      }
      console.log(`    • ${perk.perk_name} (${perk.category} - ${perk.value_type}${perk.value_amount ? ': ' + perk.value_amount : ''})`);
    });
    
    // Test cross-brand perks
    console.log('\n🌐 Cross-Brand Perks:');
    const crossBrandPerks = await db.query(`
      SELECT perk_name, category, value_type, value_amount
      FROM perks 
      WHERE brand_id IS NULL 
      ORDER BY perk_name
    `);
    
    crossBrandPerks.rows.forEach((perk: any) => {
      console.log(`  • ${perk.perk_name} (${perk.category} - ${perk.value_type}${perk.value_amount ? ': ' + perk.value_amount : ''})`);
    });
    
    // Test brand analytics view
    console.log('\n📊 Brand Analytics:');
    const analytics = await db.query(`
      SELECT brand_name, brand_type, active_users, total_actions, available_perks
      FROM brand_analytics 
      ORDER BY brand_name
    `);
    
    analytics.rows.forEach((stat: any) => {
      console.log(`  ${stat.brand_name}: ${stat.active_users} users, ${stat.total_actions} actions, ${stat.available_perks} perks`);
    });
    
    // Test comprehensive NFT view
    console.log('\n🎨 Sample NFT Data with Brand Activities:');
    const nftData = await db.query(`
      SELECT token_id, owner_display_name, loyalty_level, loyalty_points, 
             hdbank_activities, vietjet_activities, halong_star_activities
      FROM nft_complete_info 
      WHERE token_id IS NOT NULL
      ORDER BY token_id
    `);
    
    nftData.rows.forEach((nft: any) => {
      console.log(`  NFT #${nft.token_id} (${nft.owner_display_name}): Level ${nft.loyalty_level}, ${nft.loyalty_points} points`);
      console.log(`    Brand Activities - HDBank: ${nft.hdbank_activities}, Vietjet: ${nft.vietjet_activities}, Ha Long Star: ${nft.halong_star_activities}`);
    });
    
    console.log('\n✅ Brand integration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Brand integration test failed:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// Run test if called directly
if (require.main === module) {
  testBrandIntegration();
}

export { testBrandIntegration };