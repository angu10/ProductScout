// Test script to verify updated product availability checker with search URLs
// This can be run in the browser console to test the availability checker

async function testUpdatedAvailabilityWithSearch() {
  console.log('🧪 Testing Updated Product Availability Checker with Search URLs...');
  
  // Mock product data for MacBook charger (similar to the Amazon example)
  const testProductData = {
    title: 'USB-C Charger MacBook Power Adapter',
    price: 30.99,
    rating: 4.5,
    reviewCount: 14252,
    productType: 'electronics',
    brand: 'KissCall',
    description: 'USB-C charger for MacBook with fast charging capability',
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
      
      if (foundProducts.length > 0) {
        console.log('✅ Found products with search URLs:');
        foundProducts.forEach(result => {
          console.log(`  - ${result.website}: $${result.product.price} - ${result.product.url}`);
          console.log(`    Search Type: ${result.product.searchType}`);
        });
      }
      
      results.forEach(result => {
        if (result.found) {
          console.log(`✅ ${result.website}: Found - $${result.product.price} (${result.product.rating}/5 stars)`);
          console.log(`   Search URL: ${result.product.url}`);
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
testUpdatedAvailabilityWithSearch();
