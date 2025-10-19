// Enhanced product data extraction with robust review count handling
class ProductExtractor {
  static async extractProductData(detectionResult) {
    const { site, config, productType, url } = detectionResult;
    
    PromptBridgeHelpers.log(`🔍 Starting data extraction for ${config.name}`, {
      site,
      productType,
      url,
      timestamp: new Date().toISOString()
    });

    const productData = {
      title: null,
      price: null,
      originalPrice: null,
      currency: 'USD',
      images: [],
      rating: null,
      reviewCount: null,
      availability: null,
      description: null,
      specifications: {},
      source: {
        site: config.name,
        url: url,
        extractedAt: new Date().toISOString()
      },
      productType,
      extractionLog: []
    };

    // Extract each data point with detailed logging
    await this.extractTitle(productData, config);
    await this.extractPricing(productData, config);
    await this.extractImages(productData, config);
    await this.extractRating(productData, config, site);
    await this.extractAvailability(productData, config);
    await this.extractDescription(productData, config);
    
    // Additional Amazon-specific extractions
    if (site === 'amazon.com') {
      await this.extractAmazonSpecifics(productData);
    }

    PromptBridgeHelpers.log('✅ Data extraction completed', {
      extractedFields: Object.keys(productData).filter(key => 
        productData[key] !== null && key !== 'extractionLog'
      ),
      totalLogEntries: productData.extractionLog.length,
      reviewCount: productData.reviewCount,
      rating: productData.rating
    });

    return productData;
  }

  static async extractTitle(productData, config) {
    try {
      PromptBridgeHelpers.log('📝 Extracting product title...');
      
      const titleSelectors = config.selectors.title.split(', ');
      let titleElement = null;
      let usedSelector = null;

      for (const selector of titleSelectors) {
        titleElement = document.querySelector(selector.trim());
        if (titleElement) {
          usedSelector = selector.trim();
          break;
        }
      }

      if (titleElement) {
        productData.title = PromptBridgeHelpers.sanitizeText(titleElement.textContent);
        productData.extractionLog.push({
          field: 'title',
          success: true,
          selector: usedSelector,
          value: productData.title,
          timestamp: Date.now()
        });
        PromptBridgeHelpers.log('✅ Title extracted successfully', {
          title: productData.title,
          selector: usedSelector
        });
      } else {
        productData.extractionLog.push({
          field: 'title',
          success: false,
          selectors: titleSelectors,
          error: 'Element not found',
          timestamp: Date.now()
        });
        PromptBridgeHelpers.error('❌ Title extraction failed - element not found', {
          triedSelectors: titleSelectors
        });
      }
    } catch (error) {
      productData.extractionLog.push({
        field: 'title',
        success: false,
        error: error.message,
        timestamp: Date.now()
      });
      PromptBridgeHelpers.error('❌ Title extraction failed with error', error);
    }
  }

  static async extractPricing(productData, config) {
    try {
      PromptBridgeHelpers.log('💰 Extracting product pricing...');
      
      const priceSelectors = config.selectors.price.split(', ');
      let priceElement = null;
      let usedSelector = null;

      for (const selector of priceSelectors) {
        priceElement = document.querySelector(selector.trim());
        if (priceElement) {
          usedSelector = selector.trim();
          break;
        }
      }

      if (priceElement) {
        const priceText = priceElement.textContent || priceElement.innerText;
        productData.price = PromptBridgeHelpers.parsePrice(priceText);
        productData.currency = PromptBridgeHelpers.extractCurrency(priceText);
        
        // Look for original price (crossed out)
        const originalPriceSelectors = [
          '.a-price.a-text-price .a-offscreen',
          '.a-price-was .a-offscreen',
          '[data-testid="was-price"]',
          '.strikethrough'
        ];

        for (const selector of originalPriceSelectors) {
          const originalElement = document.querySelector(selector);
          if (originalElement) {
            productData.originalPrice = PromptBridgeHelpers.parsePrice(originalElement.textContent);
            break;
          }
        }

        productData.extractionLog.push({
          field: 'price',
          success: true,
          selector: usedSelector,
          rawText: priceText,
          parsedPrice: productData.price,
          currency: productData.currency,
          originalPrice: productData.originalPrice,
          timestamp: Date.now()
        });

        PromptBridgeHelpers.log('✅ Pricing extracted successfully', {
          price: productData.price,
          originalPrice: productData.originalPrice,
          currency: productData.currency,
          selector: usedSelector,
          rawText: priceText
        });
      } else {
        productData.extractionLog.push({
          field: 'price',
          success: false,
          selectors: priceSelectors,
          error: 'Element not found',
          timestamp: Date.now()
        });
        PromptBridgeHelpers.error('❌ Price extraction failed - element not found', {
          triedSelectors: priceSelectors
        });
      }
    } catch (error) {
      productData.extractionLog.push({
        field: 'price',
        success: false,
        error: error.message,
        timestamp: Date.now()
      });
      PromptBridgeHelpers.error('❌ Price extraction failed with error', error);
    }
  }

  static async extractImages(productData, config) {
    try {
      PromptBridgeHelpers.log('🖼️ Extracting product images...');
      
      const imageSelectors = config.selectors.image.split(', ');
      const foundImages = new Set();

      for (const selector of imageSelectors) {
        const imageElements = document.querySelectorAll(selector.trim());
        imageElements.forEach(img => {
          if (img.src && PromptBridgeHelpers.isValidUrl(img.src)) {
            foundImages.add(img.src);
          }
          if (img.dataset?.src && PromptBridgeHelpers.isValidUrl(img.dataset.src)) {
            foundImages.add(img.dataset.src);
          }
        });
      }

      productData.images = Array.from(foundImages).slice(0, 5);
      
      productData.extractionLog.push({
        field: 'images',
        success: productData.images.length > 0,
        selectors: imageSelectors,
        foundCount: productData.images.length,
        images: productData.images,
        timestamp: Date.now()
      });

      PromptBridgeHelpers.log('✅ Images extracted successfully', {
        imageCount: productData.images.length,
        images: productData.images
      });
    } catch (error) {
      productData.extractionLog.push({
        field: 'images',
        success: false,
        error: error.message,
        timestamp: Date.now()
      });
      PromptBridgeHelpers.error('❌ Image extraction failed with error', error);
    }
  }

  static async extractRating(productData, config, site) {
    try {
      PromptBridgeHelpers.log('⭐ Extracting product rating and reviews...');
      
      // Extract rating first
      const ratingSelectors = config.selectors.rating.split(', ');
      let ratingElement = null;
      let usedRatingSelector = null;

      for (const selector of ratingSelectors) {
        ratingElement = document.querySelector(selector.trim());
        if (ratingElement) {
          usedRatingSelector = selector.trim();
          break;
        }
      }

      if (ratingElement) {
        const ratingText = ratingElement.textContent || ratingElement.alt || ratingElement.title;
        const ratingMatch = ratingText.match(/(\d+\.?\d*)\s*out\s*of\s*(\d+)/i) || 
                           ratingText.match(/(\d+\.?\d*)\s*stars?/i) ||
                           ratingText.match(/(\d+\.?\d*)/);
        
        if (ratingMatch) {
          productData.rating = parseFloat(ratingMatch[1]);
        }

        PromptBridgeHelpers.log('✅ Rating extracted', {
          rating: productData.rating,
          rawText: ratingText,
          selector: usedRatingSelector
        });
      }

      // IMPROVED: Extract review count with site-specific strategies
      productData.reviewCount = await this.extractReviewCount(site, config);

      productData.extractionLog.push({
        field: 'rating',
        success: productData.rating !== null || productData.reviewCount !== null,
        selector: usedRatingSelector,
        rating: productData.rating,
        reviewCount: productData.reviewCount,
        timestamp: Date.now()
      });

      PromptBridgeHelpers.log('✅ Rating and reviews extraction completed', {
        rating: productData.rating,
        reviewCount: productData.reviewCount
      });

    } catch (error) {
      productData.extractionLog.push({
        field: 'rating',
        success: false,
        error: error.message,
        timestamp: Date.now()
      });
      PromptBridgeHelpers.error('❌ Rating extraction failed with error', error);
    }
  }

  static async extractReviewCount(site, config) {
    try {
      PromptBridgeHelpers.log('📊 Extracting review count with multi-strategy approach...');
      
      let reviewCount = null;
      const strategies = [];

      // Strategy 1: Use config selectors if available
      if (config.selectors.reviews) {
        strategies.push({
          name: 'config_selectors',
          selectors: config.selectors.reviews.split(', ')
        });
      }

      // Strategy 2: Amazon-specific selectors (most common)
      if (site === 'amazon.com') {
        strategies.push({
          name: 'amazon_primary',
          selectors: [
            '#acrCustomerReviewText',           // Primary: "69,032 ratings"
            '[data-hook="total-review-count"]', // Alternative
            '#averageCustomerReviews_feature_div [data-hook="total-review-count"]'
          ]
        });
        
        strategies.push({
          name: 'amazon_secondary',
          selectors: [
            '.a-size-base.a-link-normal',      // Sometimes in link
            '#reviewsMedley .a-size-base',     // Reviews section
            '.review-count'
          ]
        });
      }

      // Strategy 3: Generic review selectors
      strategies.push({
        name: 'generic',
        selectors: [
          '[class*="review-count"]',
          '[class*="reviewCount"]',
          '[data-test*="review"]',
          '[aria-label*="review"]'
        ]
      });

      // Try each strategy until we find reviews
      for (const strategy of strategies) {
        PromptBridgeHelpers.log(`🔍 Trying strategy: ${strategy.name}`, {
          selectors: strategy.selectors
        });

        for (const selector of strategy.selectors) {
          const element = document.querySelector(selector.trim());
          
          if (element) {
            const text = element.textContent || element.innerText;
            PromptBridgeHelpers.log(`📄 Found element with text: "${text}"`, {
              selector: selector.trim()
            });

            // Multiple regex patterns to catch different formats
            const patterns = [
              /([0-9,]+)\s*ratings?/i,           // "69,032 ratings"
              /([0-9,]+)\s*reviews?/i,           // "69,032 reviews"
              /([0-9,]+)\s*customer reviews?/i,  // "69,032 customer reviews"
              /\(([0-9,]+)\s*ratings?\)/i,       // "(69,032 ratings)"
              /\(([0-9,]+)\)/,                   // "(69,032)"
              /([0-9,]+)\s*total/i,              // "69,032 total"
            ];

            for (const pattern of patterns) {
              const match = text.match(pattern);
              if (match) {
                reviewCount = parseInt(match[1].replace(/,/g, ''), 10);
                
                if (reviewCount && reviewCount > 0) {
                  PromptBridgeHelpers.log('✅ Review count extracted successfully!', {
                    count: reviewCount,
                    strategy: strategy.name,
                    selector: selector.trim(),
                    rawText: text,
                    pattern: pattern.toString()
                  });
                  return reviewCount;
                }
              }
            }
          }
        }
      }

      // Final fallback: search all text nodes for review count
      if (!reviewCount) {
        PromptBridgeHelpers.log('🔍 Attempting fallback: scanning all text nodes...');
        
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );

        let node;
        while (node = walker.nextNode()) {
          const text = node.textContent;
          const match = text.match(/([0-9,]+)\s*(?:ratings?|reviews?)/i);
          
          if (match) {
            const count = parseInt(match[1].replace(/,/g, ''), 10);
            if (count > 10) { // Sanity check: at least 10 reviews
              reviewCount = count;
              PromptBridgeHelpers.log('✅ Review count found via text scan!', {
                count: reviewCount,
                text: text.substring(0, 100)
              });
              break;
            }
          }
        }
      }

      if (!reviewCount) {
        PromptBridgeHelpers.log('⚠️ Review count not found after all strategies');
      }

      return reviewCount;

    } catch (error) {
      PromptBridgeHelpers.error('❌ Review count extraction failed', error);
      return null;
    }
  }

  static async extractAvailability(productData, config) {
    try {
      PromptBridgeHelpers.log('📦 Extracting product availability...');
      
      const availabilitySelectors = config.selectors.availability.split(', ');
      let availabilityElement = null;
      let usedSelector = null;

      for (const selector of availabilitySelectors) {
        availabilityElement = document.querySelector(selector.trim());
        if (availabilityElement) {
          usedSelector = selector.trim();
          break;
        }
      }

      if (availabilityElement) {
        productData.availability = PromptBridgeHelpers.sanitizeText(availabilityElement.textContent);
        
        productData.extractionLog.push({
          field: 'availability',
          success: true,
          selector: usedSelector,
          value: productData.availability,
          timestamp: Date.now()
        });

        PromptBridgeHelpers.log('✅ Availability extracted successfully', {
          availability: productData.availability,
          selector: usedSelector
        });
      } else {
        productData.extractionLog.push({
          field: 'availability',
          success: false,
          selectors: availabilitySelectors,
          error: 'Element not found',
          timestamp: Date.now()
        });
        PromptBridgeHelpers.log('⚠️ Availability extraction - element not found', {
          triedSelectors: availabilitySelectors
        });
      }
    } catch (error) {
      productData.extractionLog.push({
        field: 'availability',
        success: false,
        error: error.message,
        timestamp: Date.now()
      });
      PromptBridgeHelpers.error('❌ Availability extraction failed with error', error);
    }
  }

  static async extractDescription(productData, config) {
    try {
      PromptBridgeHelpers.log('📄 Extracting product description...');
      
      const descriptionSelectors = config.selectors.description.split(', ');
      let descriptionElement = null;
      let usedSelector = null;

      for (const selector of descriptionSelectors) {
        descriptionElement = document.querySelector(selector.trim());
        if (descriptionElement) {
          usedSelector = selector.trim();
          break;
        }
      }

      if (descriptionElement) {
        const bulletPoints = descriptionElement.querySelectorAll('li');
        if (bulletPoints.length > 0) {
          productData.description = Array.from(bulletPoints)
            .map(li => PromptBridgeHelpers.sanitizeText(li.textContent))
            .filter(text => text.length > 0)
            .join('. ');
        } else {
          productData.description = PromptBridgeHelpers.sanitizeText(descriptionElement.textContent);
        }

        productData.extractionLog.push({
          field: 'description',
          success: true,
          selector: usedSelector,
          bulletPointsFound: bulletPoints.length,
          descriptionLength: productData.description.length,
          timestamp: Date.now()
        });

        PromptBridgeHelpers.log('✅ Description extracted successfully', {
          descriptionLength: productData.description.length,
          bulletPoints: bulletPoints.length,
          selector: usedSelector,
          preview: productData.description.substring(0, 100) + '...'
        });
      } else {
        productData.extractionLog.push({
          field: 'description',
          success: false,
          selectors: descriptionSelectors,
          error: 'Element not found',
          timestamp: Date.now()
        });
        PromptBridgeHelpers.log('⚠️ Description extraction - element not found', {
          triedSelectors: descriptionSelectors
        });
      }
    } catch (error) {
      productData.extractionLog.push({
        field: 'description',
        success: false,
        error: error.message,
        timestamp: Date.now()
      });
      PromptBridgeHelpers.error('❌ Description extraction failed with error', error);
    }
  }

  static async extractAmazonSpecifics(productData) {
    try {
      PromptBridgeHelpers.log('🛍️ Extracting Amazon-specific data...');
      
      // Extract ASIN
      const asinMatch = window.location.href.match(/\/dp\/([A-Z0-9]{10})/);
      if (asinMatch) {
        productData.asin = asinMatch[1];
        PromptBridgeHelpers.log('✅ ASIN extracted:', productData.asin);
      }

      // Extract brand
      const brandElement = document.querySelector('#bylineInfo, .a-brand');
      if (brandElement) {
        productData.brand = PromptBridgeHelpers.sanitizeText(brandElement.textContent);
        PromptBridgeHelpers.log('✅ Brand extracted:', productData.brand);
      }

      // Extract product dimensions and specifications
      const specsTable = document.querySelector('#productDetails_detailBullets_sections1 tr, .prodDetTable tr');
      if (specsTable) {
        const specRows = document.querySelectorAll('#productDetails_detailBullets_sections1 tr, .prodDetTable tr');
        specRows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 2) {
            const key = PromptBridgeHelpers.sanitizeText(cells[0].textContent);
            const value = PromptBridgeHelpers.sanitizeText(cells[1].textContent);
            if (key && value) {
              productData.specifications[key] = value;
            }
          }
        });
        PromptBridgeHelpers.log('✅ Specifications extracted:', Object.keys(productData.specifications).length, 'items');
      }

      productData.extractionLog.push({
        field: 'amazonSpecifics',
        success: true,
        asin: productData.asin,
        brand: productData.brand,
        specsCount: Object.keys(productData.specifications).length,
        timestamp: Date.now()
      });

    } catch (error) {
      productData.extractionLog.push({
        field: 'amazonSpecifics',
        success: false,
        error: error.message,
        timestamp: Date.now()
      });
      PromptBridgeHelpers.error('❌ Amazon specifics extraction failed', error);
    }
  }

  static validateExtractedData(productData) {
    PromptBridgeHelpers.log('🔍 Validating extracted data...');
    
    const validation = {
      isValid: true,
      issues: [],
      score: 0,
      maxScore: 7
    };

    // Check required fields
    if (productData.title) {
      validation.score += 2;
      PromptBridgeHelpers.log('✅ Title validation passed');
    } else {
      validation.isValid = false;
      validation.issues.push('Missing product title');
      PromptBridgeHelpers.error('❌ Title validation failed');
    }

    if (productData.price !== null) {
      validation.score += 2;
      PromptBridgeHelpers.log('✅ Price validation passed');
    } else {
      validation.isValid = false;
      validation.issues.push('Missing product price');
      PromptBridgeHelpers.error('❌ Price validation failed');
    }

    // Check optional fields
    if (productData.images && productData.images.length > 0) {
      validation.score += 1;
      PromptBridgeHelpers.log('✅ Images validation passed');
    } else {
      validation.issues.push('No product images found');
    }

    if (productData.rating !== null) {
      validation.score += 1;
      PromptBridgeHelpers.log('✅ Rating validation passed');
    }

    if (productData.description) {
      validation.score += 1;
      PromptBridgeHelpers.log('✅ Description validation passed');
    }

    validation.completeness = (validation.score / validation.maxScore) * 100;
    
    PromptBridgeHelpers.log('📊 Data validation completed', {
      isValid: validation.isValid,
      score: `${validation.score}/${validation.maxScore}`,
      completeness: `${validation.completeness.toFixed(1)}%`,
      issues: validation.issues,
      reviewCount: productData.reviewCount
    });

    return validation;
  }
}

window.ProductExtractor = ProductExtractor;