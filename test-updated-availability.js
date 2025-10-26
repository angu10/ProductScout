// Test script to verify updated product availability checker
// This can be run in the browser console to test the availability checker

async function testUpdatedAvailabilityChecker() {
  console.log('🧪 Testing Updated Product Availability Checker...');
  
  // Mock product data for Dunlop boots
  const testProductData = {
    title: 'Dunlop Protective Footwear, Chesapeake plain toe Black Amazon, 100% Waterproo Lightweight and Durable',
    price: 24.59,
    rating: 4.5,
    reviewCount: 14252,
    productType: 'footwear',
    brand: 'Dunlop',
    description: 'Protective footwear with waterproof design',
    availability: 'In Stock'
  };

  try {
    // Test the availability checker
    console.log('🔍 Testing ProductAvailabilityChecker...');
    const results = await ProductAvailabilityChecker.checkProductAvailability(testProductData);
    
    console.log('✅ Availability Results:', results);
    
    // Verify results structure
    if (results && results.length > 0) {
      console.log('✅ Checked', results.length, 'websites');
      
      const foundProducts = results.filter(r => r.found);
      const notFoundProducts = results.filter(r => !r.found);
      
      console.log('📊 Summary:');
      console.log('  - Products found:', foundProducts.length);
      console.log('  - Products not found:', notFoundProducts.length);
      
      if (foundProducts.length === 0) {
        console.log('✅ No broken links will be shown - all products correctly marked as not found');
      }
      
      results.forEach(result => {
        if (result.found) {
          console.log(`✅ ${result.website}: Found - $${result.product.price} (${result.product.rating}/5 stars)`);
        } else {
          console.log(`❌ ${result.website}: Not found - ${result.reason || 'No reason provided'}`);
        }
      });
    } else {
      console.log('❌ No availability results');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testUpdatedAvailabilityChecker();
