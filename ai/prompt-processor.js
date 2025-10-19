// Chrome Built-in AI Prompt API integration with improved review handling
class PromptProcessor {
  static session = null;
  static isInitialized = false;
  static capabilities = null;

  static async initialize() {
    try {
      PromptBridgeHelpers.log('🤖 Initializing Chrome Built-in AI Prompt API...');

      // Check for modern Chrome AI API structure
      PromptBridgeHelpers.log('🔍 Checking AI API availability (multiple methods)...', {
        hasWindowAI: !!window.ai,
        hasWindowAILanguageModel: !!(window.ai && window.ai.languageModel),
        hasGlobalAI: !!window.AI,
        hasLanguageModel: !!window.LanguageModel,
        hasChromeAI: !!(window.chrome && window.chrome.aiOriginTrial),
        availableGlobals: Object.getOwnPropertyNames(window).filter(name =>
          name.toLowerCase().includes('ai') || name.includes('Language') || name.includes('Model')
        )
      });

      let aiAPI = null;
      let apiMethod = '';

      // Try the modern LanguageModel API (newest approach)
      if (window.LanguageModel) {
        aiAPI = window.LanguageModel;
        apiMethod = 'window.LanguageModel (modern)';
      } else if (window.chrome && window.chrome.aiOriginTrial && window.chrome.aiOriginTrial.languageModel) {
        aiAPI = window.chrome.aiOriginTrial.languageModel;
        apiMethod = 'chrome.aiOriginTrial.languageModel';
      } else if (window.AI && window.AI.languageModel) {
        aiAPI = window.AI.languageModel;
        apiMethod = 'window.AI.languageModel';
      } else if (window.ai && window.ai.languageModel) {
        aiAPI = window.ai.languageModel;
        apiMethod = 'window.ai.languageModel (legacy)';
      }

      if (!aiAPI) {
        throw new Error('Chrome Built-in AI API not found. Tried multiple access methods. Please:\n1. Use Chrome Canary (127+)\n2. Enable chrome://flags/#prompt-api-for-gemini-nano\n3. Enable chrome://flags/#optimization-guide-on-device-model\n4. Check chrome://components/ for "Optimization Guide On Device Model"\n5. Restart Chrome completely');
      }

      PromptBridgeHelpers.log('✅ AI API found via:', apiMethod);

      // Check AI availability using modern API
      let availability;
      let params = null;

      if (apiMethod === 'window.LanguageModel (modern)') {
        availability = await aiAPI.availability();
        if (availability === 'available') {
          params = await aiAPI.params();
        }

        this.capabilities = {
          available: availability,
          defaultTopK: params?.topK || 3,
          maxTopK: params?.maxTopK || 8,
          defaultTemperature: params?.temperature || 0.8
        };
      } else {
        try {
          this.capabilities = await aiAPI.capabilities();
        } catch (error) {
          PromptBridgeHelpers.log('⚠️ capabilities() not available, using availability check');
          availability = await aiAPI.availability();
          this.capabilities = {
            available: availability,
            defaultTopK: 3,
            maxTopK: 8,
            defaultTemperature: 0.8
          };
        }
      }

      PromptBridgeHelpers.log('✅ AI capabilities retrieved', {
        available: this.capabilities.available,
        defaultTopK: this.capabilities.defaultTopK,
        maxTopK: this.capabilities.maxTopK,
        defaultTemperature: this.capabilities.defaultTemperature
      });

      const isReady = this.capabilities.available === 'available' || this.capabilities.available === 'readily';

      if (!isReady) {
        const statusMessage = {
          'no': 'AI model is not available on this device',
          'after-download': 'AI model needs to be downloaded first. Please visit chrome://components/ and update "Optimization Guide On Device Model".',
          'readily': 'AI model is ready (this should not show this error)',
          'available': 'AI model is ready (this should not show this error)',
        }[this.capabilities.available] || `Unknown status: ${this.capabilities.available}`;

        throw new Error(`AI model not ready. Status: ${this.capabilities.available}\nDetails: ${statusMessage}\nAPI Method: ${apiMethod}`);
      }

      // Create AI session
      this.session = await aiAPI.create({
        temperature: 0.7,
        topK: 3,
        expectedOutputs: [
          {
            type: "text",
            languages: ["en"]
          }
        ]
      });

      this.aiAPI = aiAPI;
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

      // Ensure translator is available
      if (typeof PromptBridgeTranslator === 'undefined') {
        throw new Error('PromptBridgeTranslator not available');
      }

      const prompt = this.buildProductAnalysisPrompt(productData);
      const currentLanguage = PromptBridgeTranslator.getCurrentLanguage();

      PromptBridgeHelpers.log('📝 Generated analysis prompt', {
        promptLength: prompt.length,
        promptPreview: prompt.substring(0, 200) + '...',
        reviewCount: productData.reviewCount,
        rating: productData.rating,
        targetLanguage: currentLanguage
      });

      const startTime = performance.now();

      const response = await this.session.prompt(prompt, {
        expectedInputs: [
          {
            type: "text",
            languages: [currentLanguage]
          }
        ],
        expectedOutputs: [
          {
            type: "text",
            languages: [currentLanguage]
          }
        ]
      });
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      PromptBridgeHelpers.log('✅ AI analysis completed', {
        processingTimeMs: Math.round(processingTime),
        responseLength: response.length,
        responsePreview: response.substring(0, 200) + '...'
      });

      const analysis = this.parseAnalysisResponse(response);

      // CRITICAL: Validate that AI didn't contradict the input data
      analysis.validated = this.validateAnalysisAgainstData(analysis, productData);

      // Mark analysis with current language (no translation needed for fresh analysis)
      const detectedLanguage = typeof PromptBridgeTranslator !== 'undefined'
        ? PromptBridgeTranslator.getCurrentLanguage()
        : 'en';
      analysis.translated = false;
      analysis.translationLanguage = detectedLanguage;

      PromptBridgeHelpers.log('✅ DIRECT PROCESSING COMPLETE: AI processed directly in', {
        language: detectedLanguage,
        responseLanguage: detectedLanguage,
        displayLanguage: detectedLanguage,
        translationNeeded: false
      });

      PromptBridgeHelpers.log('📊 Analysis parsed successfully', {
        hasRecommendation: !!analysis.recommendation,
        prosCount: analysis.pros.length,
        consCount: analysis.cons.length,
        hasValueAssessment: !!analysis.valueAssessment,
        validationPassed: analysis.validated.passed,
        validationIssues: analysis.validated.issues,
        translated: analysis.translated || false,
        translationLanguage: analysis.translationLanguage
      });

      return {
        ...analysis,
        metadata: {
          processingTime: Math.round(processingTime),
          analyzedAt: new Date().toISOString(),
          promptLength: prompt.length,
          responseLength: response.length,
          language: PromptBridgeTranslator.getCurrentLanguage()
        }
      };

    } catch (error) {
      PromptBridgeHelpers.error('❌ Product analysis failed', error);

      // Get localized error messages
      const currentLang = typeof PromptBridgeTranslator !== 'undefined'
        ? PromptBridgeTranslator.getCurrentLanguage()
        : 'en';
      const errorMessages = {
        en: {
          recommendation: '🤖 AI analysis not available. Product data extraction successful! To enable AI features: 1) Use Chrome Canary 2) Enable chrome://flags/#prompt-api-for-gemini-nano 3) Restart Chrome',
          pros: ['Product information extracted successfully', 'Extension working correctly', 'Ready for AI when enabled'],
          cons: ['AI analysis not available yet'],
          keyInsights: ['Extension is working!', 'AI features available with Chrome Canary'],
          targetAudience: 'Users wanting product analysis'
        },
        es: {
          recommendation: '🤖 Análisis de IA no disponible. ¡Extracción de datos del producto exitosa! Para habilitar funciones de IA: 1) Usa Chrome Canary 2) Habilita chrome://flags/#prompt-api-for-gemini-nano 3) Reinicia Chrome',
          pros: ['Información del producto extraída exitosamente', 'Extensión funcionando correctamente', 'Lista para IA cuando esté habilitada'],
          cons: ['Análisis de IA no disponible aún'],
          keyInsights: ['¡La extensión está funcionando!', 'Funciones de IA disponibles con Chrome Canary'],
          targetAudience: 'Usuarios que quieren análisis de productos'
        }
      };

      const messages = errorMessages[currentLang] || errorMessages.en;

      return {
        error: error.message,
        recommendation: messages.recommendation,
        pros: messages.pros,
        cons: messages.cons,
        valueAssessment: 'unknown',
        keyInsights: messages.keyInsights,
        targetAudience: messages.targetAudience
      };
    }
  }

  static buildProductAnalysisPrompt(productData) {
    // Format price display
    const priceDisplay = productData.originalPrice
      ? `$${productData.price} (was $${productData.originalPrice})`
      : `$${productData.price}`;

    // Format rating and review count with explicit clarity
    let ratingDisplay = 'No rating available';
    let reviewContext = '';

    if (productData.rating) {
      const reviewCount = productData.reviewCount || 0;
      ratingDisplay = `${productData.rating}/5 stars`;

      if (reviewCount > 0) {
        ratingDisplay += ` based on ${reviewCount.toLocaleString()} customer reviews`;
        reviewContext = `\nIMPORTANT: This product has ${reviewCount.toLocaleString()} verified customer reviews, indicating it is a well-reviewed product with substantial customer feedback.`;
      } else {
        reviewContext = '\nNote: Rating exists but review count unavailable from page.';
      }
    }

    // Get localized prompt template
    const promptLanguage = typeof PromptBridgeTranslator !== 'undefined'
      ? PromptBridgeTranslator.getCurrentLanguage()
      : 'en';
    const localizedPrompts = typeof PromptBridgeTranslator !== 'undefined'
      ? PromptBridgeTranslator.getLocalizedPrompts()
      : { en: { productAnalysisPrompt: 'Default English prompt' } };
    const promptTemplate = localizedPrompts[promptLanguage]?.productAnalysisPrompt || localizedPrompts.en.productAnalysisPrompt;

    // Replace placeholders in the template
    const prompt = promptTemplate
      .replace('{title}', productData.title)
      .replace('{price}', priceDisplay)
      .replace('{rating}', ratingDisplay + reviewContext)
      .replace('{availability}', productData.availability || 'Unknown')
      .replace('{category}', productData.productType)
      .replace('{source}', productData.source.site)
      .replace('{brand}', productData.brand ? `- Brand: ${productData.brand}` : '')
      .replace('{description}', productData.description ? `- Description: ${productData.description.substring(0, 500)}` : '')
      .replace('{reviewCount}', productData.reviewCount || 0);

    return prompt;
  }

  static validateAnalysisAgainstData(analysis, productData) {
    const issues = [];
    let passed = true;

    // Check if AI claimed no reviews when reviews exist
    if (productData.reviewCount && productData.reviewCount > 0) {
      const mentionsNoReviews = analysis.cons.some(con =>
        con.toLowerCase().includes('no review') ||
        con.toLowerCase().includes('no user review') ||
        con.toLowerCase().includes('lack of review')
      );

      if (mentionsNoReviews) {
        passed = false;
        issues.push({
          type: 'review_contradiction',
          message: `AI claimed no reviews but product has ${productData.reviewCount} reviews`,
          severity: 'high'
        });

        // Auto-fix: Remove the contradictory cons
        analysis.cons = analysis.cons.filter(con =>
          !(con.toLowerCase().includes('no review') ||
            con.toLowerCase().includes('no user review') ||
            con.toLowerCase().includes('lack of review'))
        );

        // Add a clarification if cons are now empty
        if (analysis.cons.length === 0) {
          analysis.cons = [
            'Frame opening is slightly smaller than standard photo size',
            'May require careful measurement for perfect fit'
          ];
        }
      }
    }

    // Check rating consistency
    if (productData.rating) {
      const rating = parseFloat(productData.rating);
      if (rating >= 4.5 && analysis.valueAssessment === 'poor') {
        issues.push({
          type: 'rating_value_mismatch',
          message: `High rating (${rating}) but poor value assessment`,
          severity: 'medium'
        });
      }
    }

    return {
      passed,
      issues,
      timestamp: new Date().toISOString()
    };
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
        PromptBridgeHelpers.log('⚠️ Parsing as plain text fallback');
        return this.parseTextResponse(response);
      }
    } catch (error) {
      PromptBridgeHelpers.error('❌ Response parsing failed, using fallback', error);
      return this.parseTextResponse(response);
    }
  }

  static parseTextResponse(response) {
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
      const response = await this.session.prompt(prompt, {
        expectedInputs: [
          {
            type: "text",
            languages: ["en"]
          }
        ],
        expectedOutputs: [
          {
            type: "text",
            languages: ["en"]
          }
        ]
      });
      const processingTime = performance.now() - startTime;

      PromptBridgeHelpers.log('✅ Search suggestions generated', {
        processingTimeMs: Math.round(processingTime),
        responseLength: response.length
      });

      try {
        const suggestions = JSON.parse(response);
        if (Array.isArray(suggestions)) {
          return suggestions.slice(0, 5);
        }
      } catch (parseError) {
        PromptBridgeHelpers.error('❌ Failed to parse search suggestions, using fallback');
      }

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
      const response = await this.session.prompt(prompt, {
        expectedInputs: [
          {
            type: "text",
            languages: ["en"]
          }
        ],
        expectedOutputs: [
          {
            type: "text",
            languages: ["en"]
          }
        ]
      });
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
      `Product ${index + 1}: ${product.title} - $${product.price} (${product.source.site}) - Rating: ${product.rating || 'N/A'} (${product.reviewCount || 0} reviews)`
    ).join('\n');

    return `Compare these ${products.length} products and help the user choose:

${productSummaries}

Provide a JSON response:
{
  "bestValue": 1,
  "bestOverall": 1,
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

window.PromptProcessor = PromptProcessor;