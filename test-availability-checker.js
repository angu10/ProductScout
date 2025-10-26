// Test script to verify product availability checker
// This can be run in the browser console to test the availability checker

async function testProductAvailability() {
  console.log('🧪 Testing Product Availability Checker...');
  
  // Mock product data for Lilly Pulitzer dress
  const testProductData = {
    title: 'Lilly Pulitzer Trisha Shirtdress',
    price: 152.60,
    rating: 5.0,
    reviewCount: 1,
    productType: 'clothing',
    brand: 'Lilly Pulitzer',
    description: 'Classic shirtdress with elegant design and quality construction',
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
      
      results.forEach(result => {
        if (result.found) {
          console.log(`✅ ${result.website}: Found - $${result.product.price} (${result.product.rating}/5 stars)`);
        } else {
          console.log(`❌ ${result.website}: Not found`);
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
testProductAvailability();
