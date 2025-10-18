// Product page detection for various e-commerce sites
class ProductDetector {
  static siteConfigs = {
    'amazon.com': {
      name: 'Amazon',
      productUrlPatterns: [
        /\/dp\/[A-Z0-9]{10}/,
        /\/gp\/product\/[A-Z0-9]{10}/,
        /\/product\/[A-Z0-9]{10}/
      ],
      selectors: {
        title: '#productTitle, .product-title',
        price: '.a-price-whole, .a-price, #priceblock_dealprice, #priceblock_ourprice',
        image: '#landingImage, .a-dynamic-image',
        rating: '.a-icon-alt, [data-hook="rating-out-of-text"]',
        reviews: '[data-hook="total-review-count"], .a-size-base',
        availability: '#availability span, .a-size-medium',
        description: '#feature-bullets ul, .a-unordered-list'
      }
    },
    'ebay.com': {
      name: 'eBay',
      productUrlPatterns: [
        /\/itm\/[0-9]+/,
        /\/p\/[0-9]+/
      ],
      selectors: {
        title: '.x-item-title-label, h1[data-testid="x-item-title-label"]',
        price: '.notranslate, [data-testid="display-price"]',
        image: '#icImg, .ux-image-magnify img',
        rating: '.ebay-star-rating',
        reviews: '.reviews .ebay-review-count',
        availability: '.u-flL, [data-testid="availability"]',
        description: '#desc_div, .itemAttr'
      }
    },
    'walmart.com': {
      name: 'Walmart',
      productUrlPatterns: [
        /\/ip\/[^\/]+\/[0-9]+/
      ],
      selectors: {
        title: '[data-automation-id="product-title"], h1',
        price: '[itemprop="price"], [data-automation-id="price"]',
        image: '[data-testid="hero-image-container"] img',
        rating: '.average-rating',
        reviews: '.review-count',
        availability: '[data-testid="fulfillment-speed"]',
        description: '[data-testid="product-highlights"]'
      }
    },
    'target.com': {
      name: 'Target',
      productUrlPatterns: [
        /\/p\/[A-Z0-9-]+\/[0-9-]+/
      ],
      selectors: {
        title: '[data-test="product-title"], h1',
        price: '[data-test="product-price"]',
        image: '[data-test="hero-image-img"]',
        rating: '[data-test="ratings-summary"]',
        reviews: '[data-test="review-count"]',
        availability: '[data-test="fulfillment-section"]',
        description: '[data-test="item-details-specifications"]'
      }
    }
  };

  static getCurrentSite() {
    const hostname = window.location.hostname.toLowerCase();
    for (const site in this.siteConfigs) {
      if (hostname.includes(site)) {
        return site;
      }
    }
    return null;
  }

  static isProductPage() {
    const site = this.getCurrentSite();
    if (!site) {
      PromptBridgeHelpers.log('Site not supported:', window.location.hostname);
      return false;
    }

    const config = this.siteConfigs[site];
    const currentUrl = window.location.href;

    // Check URL patterns
    const matchesPattern = config.productUrlPatterns.some(pattern => 
      pattern.test(currentUrl)
    );

    if (matchesPattern) {
      PromptBridgeHelpers.log(`Product page detected on ${config.name}`);
      return { site, config };
    }

    // Fallback: check for key product elements
    const hasTitle = document.querySelector(config.selectors.title);
    const hasPrice = document.querySelector(config.selectors.price);
    
    if (hasTitle && hasPrice) {
      PromptBridgeHelpers.log(`Product page detected via element presence on ${config.name}`);
      return { site, config };
    }

    return false;
  }

  static async waitForProductElements(config, timeout = 10000) {
    const requiredSelectors = ['title', 'price'];
    const elements = {};

    try {
      for (const key of requiredSelectors) {
        const selector = config.selectors[key];
        elements[key] = await PromptBridgeHelpers.waitForElement(selector, timeout);
      }
      
      PromptBridgeHelpers.log('Required product elements found');
      return true;
    } catch (error) {
      PromptBridgeHelpers.error('Required product elements not found', error);
      return false;
    }
  }

  static getProductType() {
    const title = document.title.toLowerCase();
    const url = window.location.href.toLowerCase();
    
    // Simple product categorization
    const categories = {
      'electronics': ['laptop', 'phone', 'tablet', 'computer', 'headphones', 'camera'],
      'clothing': ['shirt', 'pants', 'dress', 'shoes', 'jacket', 'clothing'],
      'books': ['book', 'kindle', 'paperback', 'hardcover'],
      'home': ['furniture', 'kitchen', 'home', 'decor', 'appliance'],
      'beauty': ['beauty', 'cosmetics', 'skincare', 'makeup'],
      'sports': ['fitness', 'sports', 'exercise', 'outdoor']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => title.includes(keyword) || url.includes(keyword))) {
        return category;
      }
    }
    
    return 'general';
  }

  static async detectAndInit() {
    try {
      PromptBridgeHelpers.log('Starting product detection...');
      
      const detection = this.isProductPage();
      if (!detection) {
        PromptBridgeHelpers.log('Not a product page, skipping initialization');
        return null;
      }

      const { site, config } = detection;
      PromptBridgeHelpers.log(`Initializing for ${config.name}...`);

      // Wait for essential elements to load
      const elementsReady = await this.waitForProductElements(config);
      if (!elementsReady) {
        PromptBridgeHelpers.error('Product elements not ready, aborting');
        return null;
      }

      const productType = this.getProductType();
      PromptBridgeHelpers.log(`Product type detected: ${productType}`);

      return {
        site,
        config,
        productType,
        url: window.location.href
      };
    } catch (error) {
      PromptBridgeHelpers.error('Product detection failed', error);
      return null;
    }
  }
}

// Make detector available globally
window.ProductDetector = ProductDetector;