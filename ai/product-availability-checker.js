// Product Availability Checker - Checks if the same product exists on other websites
class ProductAvailabilityChecker {
  static async checkProductAvailability(productData) {
    try {
      PromptBridgeHelpers.log('🔍 Checking product availability across websites...', {
        productTitle: productData.title,
        productPrice: productData.price
      });

      const availabilityResults = [];

      // Define websites to check
      const websites = [
        {
          name: 'Amazon',
          checker: this.checkAmazon,
          icon: '🛒'
        },
        {
          name: 'eBay',
          checker: this.checkEbay,
          icon: '🏪'
        },
        {
          name: 'Walmart',
          checker: this.checkWalmart,
          icon: '🏬'
        },
        {
          name: 'Target',
          checker: this.checkTarget,
          icon: '🎯'
        }
      ];

      // Check each website in parallel
      const checkPromises = websites.map(website => 
        this.checkWebsiteAvailability(website, productData)
      );

      const results = await Promise.allSettled(checkPromises);
      
      // Process results
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          availabilityResults.push(result.value);
        }
      });

      PromptBridgeHelpers.log('✅ Product availability check completed', {
        websitesChecked: websites.length,
        productsFound: availabilityResults.length
      });

      return availabilityResults;

    } catch (error) {
      PromptBridgeHelpers.error('❌ Product availability check failed', error);
      return [];
    }
  }

  static async checkWebsiteAvailability(website, productData) {
    try {
      PromptBridgeHelpers.log(`🔍 Checking ${website.name}...`);
      
      const result = await website.checker(productData);
      
      if (result && result.found) {
        PromptBridgeHelpers.log(`✅ Found on ${website.name}:`, {
          price: result.price,
          url: result.url
        });
        return {
          website: website.name,
          icon: website.icon,
          found: true,
          product: result
        };
      } else {
        PromptBridgeHelpers.log(`❌ Not found on ${website.name}`);
        return {
          website: website.name,
          icon: website.icon,
          found: false
        };
      }

    } catch (error) {
      PromptBridgeHelpers.error(`❌ ${website.name} check failed`, error);
      return {
        website: website.name,
        icon: website.icon,
        found: false,
        error: error.message
      };
    }
  }

  static async checkAmazon(productData) {
    // Check if we're already on Amazon - if so, don't show duplicate
    if (window.location.hostname.includes('amazon.com')) {
      return { found: false, reason: 'Already on Amazon' };
    }

    try {
      // Generate search URL for Amazon
      const searchQuery = encodeURIComponent(productData.title);
      const amazonSearchUrl = `https://www.amazon.com/s?k=${searchQuery}`;
      
      // For demonstration, let's simulate finding the product
      // In real implementation, this would use Amazon's API or web scraping
      const mockResult = {
        found: true,
        title: productData.title,
        price: (productData.price * 0.95).toFixed(2), // Slightly cheaper on Amazon
        url: amazonSearchUrl, // Use search URL instead of fake product URL
        rating: 4.6,
        reviewCount: 1250,
        availability: 'In Stock',
        searchType: 'search_results' // Indicate this is a search page, not direct product
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return mockResult;
    } catch (error) {
      return { found: false, error: error.message };
    }
  }

  static async checkEbay(productData) {
    // Check if we're already on eBay - if so, don't show duplicate
    if (window.location.hostname.includes('ebay.com')) {
      return { found: false, reason: 'Already on eBay' };
    }

    try {
      // Generate search URL for eBay
      const searchQuery = encodeURIComponent(productData.title);
      const ebaySearchUrl = `https://www.ebay.com/sch/i.html?_nkw=${searchQuery}`;
      
      // For demonstration, let's simulate finding the product
      const mockResult = {
        found: true,
        title: `${productData.title} - Pre-owned`,
        price: (productData.price * 0.7).toFixed(2), // Cheaper on eBay
        url: ebaySearchUrl, // Use search URL instead of fake product URL
        rating: 4.4,
        reviewCount: 340,
        availability: 'Available',
        condition: 'Pre-owned - Excellent',
        searchType: 'search_results' // Indicate this is a search page, not direct product
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      return mockResult;
    } catch (error) {
      return { found: false, error: error.message };
    }
  }

  static async checkWalmart(productData) {
    // Check if we're already on Walmart - if so, don't show duplicate
    if (window.location.hostname.includes('walmart.com')) {
      return { found: false, reason: 'Already on Walmart' };
    }

    try {
      // Generate search URL for Walmart
      const searchQuery = encodeURIComponent(productData.title);
      const walmartSearchUrl = `https://www.walmart.com/search?q=${searchQuery}`;
      
      // For demonstration, let's simulate finding the product
      const mockResult = {
        found: true,
        title: productData.title,
        price: (productData.price * 0.9).toFixed(2), // Slightly cheaper on Walmart
        url: walmartSearchUrl, // Use search URL instead of fake product URL
        rating: 4.3,
        reviewCount: 567,
        availability: 'In Stock',
        searchType: 'search_results' // Indicate this is a search page, not direct product
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 700));
      
      return mockResult;
    } catch (error) {
      return { found: false, error: error.message };
    }
  }

  static async checkTarget(productData) {
    // Check if we're already on Target - if so, don't show duplicate
    if (window.location.hostname.includes('target.com')) {
      return { found: false, reason: 'Already on Target' };
    }

    try {
      // Generate search URL for Target
      const searchQuery = encodeURIComponent(productData.title);
      const targetSearchUrl = `https://www.target.com/s?searchTerm=${searchQuery}`;
      
      // For demonstration, let's simulate finding the product
      const mockResult = {
        found: true,
        title: productData.title,
        price: (productData.price * 1.05).toFixed(2), // Slightly more expensive on Target
        url: targetSearchUrl, // Use search URL instead of fake product URL
        rating: 4.5,
        reviewCount: 234,
        availability: 'In Stock',
        searchType: 'search_results' // Indicate this is a search page, not direct product
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 400));
      
      return mockResult;
    } catch (error) {
      return { found: false, error: error.message };
    }
  }

  static formatAvailabilityResults(results) {
    return results.map(result => ({
      website: result.website,
      icon: result.icon,
      found: result.found,
      product: result.product || null,
      error: result.error || null
    }));
  }
}

// Make available globally
window.ProductAvailabilityChecker = ProductAvailabilityChecker;
