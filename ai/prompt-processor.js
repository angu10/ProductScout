// Chrome Built-in AI Prompt API integration with detailed logging
class PromptProcessor {
  static session = null;
  static isInitialized = false;
  static capabilities = null;

  static async initialize() {
    try {
      PromptBridgeHelpers.log('🤖 Initializing Chrome Built-in AI Prompt API...');
      
      // Check if AI API is available
      if (!window.ai || !window.ai.languageModel) {
        throw new Error('Chrome Built-in AI API not available. Make sure you are using Chrome Canary with AI features enabled.');
      }

      // Get AI capabilities
      this.capabilities = await window.ai.languageModel.capabilities();
      PromptBridgeHelpers.log('✅ AI capabilities retrieved', {
        available: this.capabilities.available,
        defaultTopK: this.capabilities.defaultTopK,
        maxTopK: this.capabilities.maxTopK,
        defaultTemperature: this.capabilities.defaultTemperature
      });

      if (this.capabilities.available !== 'readily') {
        throw new Error(`AI model not ready. Status: ${this.capabilities.available}`);
      }

      // Create AI session
      this.session = await window.ai.languageModel.create({
        temperature: 0.7,
        topK: 3
      });

      this.isInitialized = true;
      PromptBridgeHelpers.log('✅ AI session created successfully');

      return true;
    } catch (error) {
      PromptBridgeHelpers.error('❌ AI initialization failed', error);
      this.isInitialized = false;
      return false;
    }
  }

  static async ensureInitialized() {
    if (!this.isInitialized) {
      PromptBridgeHelpers.log('🔄 AI not initialized, attempting initialization...');
      return await this.initialize();
    }
    return true;
  }

  static async analyzeProduct(productData) {
    try {
      PromptBridgeHelpers.log('🧠 Starting product analysis with AI...');
      
      if (!await this.ensureInitialized()) {
        throw new Error('AI initialization failed');
      }

      const prompt = this.buildProductAnalysisPrompt(productData);
      PromptBridgeHelpers.log('📝 Generated analysis prompt', {
        promptLength: prompt.length,
        promptPreview: prompt.substring(0, 200) + '...'
      });

      const startTime = performance.now();
      const response = await this.session.prompt(prompt);
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      PromptBridgeHelpers.log('✅ AI analysis completed', {
        processingTimeMs: Math.round(processingTime),
        responseLength: response.length,
        responsePreview: response.substring(0, 200) + '...'
      });

      const analysis = this.parseAnalysisResponse(response);
      PromptBridgeHelpers.log('📊 Analysis parsed successfully', {
        hasRecommendation: !!analysis.recommendation,
        prosCount: analysis.pros.length,
        consCount: analysis.cons.length,
        hasValueAssessment: !!analysis.valueAssessment
      });

      return {
        ...analysis,
        metadata: {
          processingTime: Math.round(processingTime),
          analyzedAt: new Date().toISOString(),
          promptLength: prompt.length,
          responseLength: response.length
        }
      };

    } catch (error) {
      PromptBridgeHelpers.error('❌ Product analysis failed', error);
      return {
        error: error.message,
        recommendation: 'Unable to analyze product due to AI processing error.',
        pros: [],
        cons: [],
        valueAssessment: 'unknown'
      };
    }
  }

  static buildProductAnalysisPrompt(productData) {
    const priceDisplay = productData.originalPrice 
      ? `$${productData.price} (was $${productData.originalPrice})`
      : `$${productData.price}`;

    const ratingDisplay = productData.rating 
      ? `${productData.rating}/5 stars (${productData.reviewCount || 'unknown'} reviews)`
      : 'No rating available';

    return `Analyze this product and provide a helpful shopping recommendation:

PRODUCT DETAILS:
- Title: ${productData.title}
- Price: ${priceDisplay}
- Rating: ${ratingDisplay}
- Availability: ${productData.availability || 'Unknown'}
- Category: ${productData.productType}
- Source: ${productData.source.site}
${productData.brand ? `- Brand: ${productData.brand}` : ''}
${productData.description ? `- Description: ${productData.description.substring(0, 500)}` : ''}

Please provide a JSON response with the following structure:
{
  "recommendation": "Brief 2-3 sentence recommendation for or against buying this product",
  "pros": ["List of 3-5 positive aspects"],
  "cons": ["List of potential concerns or drawbacks"],
  "valueAssessment": "excellent|good|fair|poor",
  "keyInsights": ["2-3 most important insights about this product"],
  "targetAudience": "Who would benefit most from this product"
}

Focus on practical shopping advice based on price, quality indicators, and user needs.`;
  }

  static parseAnalysisResponse(response) {
    try {
      PromptBridgeHelpers.log('🔍 Parsing AI analysis response...');
      
      // Try to extract JSON from the response
      let jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        PromptBridgeHelpers.log('✅ JSON response parsed successfully');
        return {
          recommendation: parsed.recommendation || 'No recommendation available',
          pros: Array.isArray(parsed.pros) ? parsed.pros : [],
          cons: Array.isArray(parsed.cons) ? parsed.cons : [],
          valueAssessment: parsed.valueAssessment || 'unknown',
          keyInsights: Array.isArray(parsed.keyInsights) ? parsed.keyInsights : [],
          targetAudience: parsed.targetAudience || 'General consumers'
        };
      } else {
        // Fallback: parse as plain text
        PromptBridgeHelpers.log('⚠️ Parsing as plain text fallback');
        return this.parseTextResponse(response);
      }
    } catch (error) {
      PromptBridgeHelpers.error('❌ Response parsing failed, using fallback', error);
      return this.parseTextResponse(response);
    }
  }

  static parseTextResponse(response) {
    // Simple text parsing fallback
    return {
      recommendation: response.substring(0, 300) || 'Unable to generate recommendation',
      pros: ['AI analysis available'],
      cons: ['Response parsing limited'],
      valueAssessment: 'unknown',
      keyInsights: ['Product information extracted'],
      targetAudience: 'General consumers'
    };
  }

  static async generateSearchSuggestions(productData) {
    try {
      PromptBridgeHelpers.log('🔍 Generating search suggestions...');
      
      if (!await this.ensureInitialized()) {
        throw new Error('AI initialization failed');
      }

      const prompt = `Based on this product: "${productData.title}" in the ${productData.productType} category at $${productData.price}, suggest 3-5 alternative search terms to find similar or competing products.

Respond with a JSON array of search terms:
["search term 1", "search term 2", "search term 3"]

Focus on:
- Generic product categories
- Key features
- Price ranges
- Alternative brands`;

      const startTime = performance.now();
      const response = await this.session.prompt(prompt);
      const processingTime = performance.now() - startTime;

      PromptBridgeHelpers.log('✅ Search suggestions generated', {
        processingTimeMs: Math.round(processingTime),
        responseLength: response.length
      });

      try {
        const suggestions = JSON.parse(response);
        if (Array.isArray(suggestions)) {
          return suggestions.slice(0, 5); // Limit to 5 suggestions
        }
      } catch (parseError) {
        PromptBridgeHelpers.error('❌ Failed to parse search suggestions, using fallback');
      }

      // Fallback suggestions
      return [
        `${productData.productType} under $${Math.round(productData.price * 1.2)}`,
        `best ${productData.productType} 2024`,
        `${productData.productType} reviews`
      ];

    } catch (error) {
      PromptBridgeHelpers.error('❌ Search suggestion generation failed', error);
      return [`${productData.productType} alternatives`];
    }
  }

  static async compareProducts(products) {
    try {
      PromptBridgeHelpers.log('⚖️ Starting multi-product comparison...');
      
      if (!await this.ensureInitialized()) {
        throw new Error('AI initialization failed');
      }

      if (!Array.isArray(products) || products.length < 2) {
        throw new Error('Need at least 2 products for comparison');
      }

      const prompt = this.buildComparisonPrompt(products);
      PromptBridgeHelpers.log('📝 Generated comparison prompt', {
        productCount: products.length,
        promptLength: prompt.length
      });

      const startTime = performance.now();
      const response = await this.session.prompt(prompt);
      const processingTime = performance.now() - startTime;

      PromptBridgeHelpers.log('✅ Product comparison completed', {
        processingTimeMs: Math.round(processingTime),
        responseLength: response.length
      });

      return this.parseComparisonResponse(response, products);

    } catch (error) {
      PromptBridgeHelpers.error('❌ Product comparison failed', error);
      return {
        error: error.message,
        bestValue: null,
        recommendation: 'Unable to compare products due to AI processing error.'
      };
    }
  }

  static buildComparisonPrompt(products) {
    const productSummaries = products.map((product, index) => 
      `Product ${index + 1}: ${product.title} - $${product.price} (${product.source.site}) - Rating: ${product.rating || 'N/A'}`
    ).join('\n');

    return `Compare these ${products.length} products and help the user choose:

${productSummaries}

Provide a JSON response:
{
  "bestValue": 1, // index of best value product (1-based)
  "bestOverall": 1, // index of best overall product (1-based)
  "recommendation": "Which product to choose and why",
  "comparison": {
    "price": "Price comparison insights",
    "quality": "Quality comparison based on ratings",
    "features": "Feature differences"
  }
}`;
  }

  static parseComparisonResponse(response, products) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          bestValue: parsed.bestValue ? products[parsed.bestValue - 1] : null,
          bestOverall: parsed.bestOverall ? products[parsed.bestOverall - 1] : null,
          recommendation: parsed.recommendation,
          comparison: parsed.comparison || {}
        };
      }
    } catch (error) {
      PromptBridgeHelpers.error('❌ Comparison response parsing failed', error);
    }

    return {
      bestValue: products[0],
      recommendation: response.substring(0, 300),
      comparison: {}
    };
  }

  static async cleanup() {
    try {
      if (this.session) {
        await this.session.destroy();
        this.session = null;
        this.isInitialized = false;
        PromptBridgeHelpers.log('✅ AI session cleaned up successfully');
      }
    } catch (error) {
      PromptBridgeHelpers.error('❌ AI cleanup failed', error);
    }
  }
}

// Make processor available globally
window.PromptProcessor = PromptProcessor;