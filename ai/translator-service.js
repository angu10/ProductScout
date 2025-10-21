// Chrome Translator API Service for PromptBridge
class PromptBridgeTranslator {
  static isInitialized = false;
  static translatorEnToFr = null; // English to French translator
  static translatorFrToEn = null; // French to English translator
  static capabilities = null;
  static supportedLanguages = ['en', 'fr']; // English and French
  static currentLanguage = 'en'; // Default to English

  static async initialize() {
    try {
      PromptBridgeHelpers.log('🌐 Initializing Chrome Translator API...');
      
      // Check if Translator API is available
      if (!('Translator' in self)) {
        throw new Error('Chrome Translator API not available. Please use Chrome Canary with AI features enabled.');
      }

      PromptBridgeHelpers.log('✅ Translator API detected');

      // Check capabilities for English to French
      this.capabilities = await Translator.availability({
        sourceLanguage: 'en',
        targetLanguage: 'fr'
      });

      PromptBridgeHelpers.log('📊 Translator capabilities:', {
        enToFr: this.capabilities,
        supportedLanguages: this.supportedLanguages
      });

      // Create translator instances for both directions
      if (this.capabilities === 'available') {
        // English to French translator
        this.translatorEnToFr = await Translator.create({
          sourceLanguage: 'en',
          targetLanguage: 'fr',
          monitor(m) {
            m.addEventListener('downloadprogress', (e) => {
              PromptBridgeHelpers.log(`📥 EN→FR Translator model download progress: ${Math.round(e.loaded * 100)}%`);
            });
          }
        });

        // French to English translator
        this.translatorFrToEn = await Translator.create({
          sourceLanguage: 'fr',
          targetLanguage: 'en',
          monitor(m) {
            m.addEventListener('downloadprogress', (e) => {
              PromptBridgeHelpers.log(`📥 FR→EN Translator model download progress: ${Math.round(e.loaded * 100)}%`);
            });
          }
        });
        
        this.isInitialized = true;
        PromptBridgeHelpers.log('✅ Both direction translators initialized successfully');
      } else if (this.capabilities === 'downloadable') {
        PromptBridgeHelpers.log('📥 Translator models need to be downloaded first');
        // Models will be downloaded when first translation is attempted
        this.isInitialized = true;
      } else {
        throw new Error(`Translator not available. Status: ${this.capabilities}`);
      }

      return true;
    } catch (error) {
      PromptBridgeHelpers.error('❌ Translator initialization failed', error);
      this.isInitialized = false;
      return false;
    }
  }

  static async ensureInitialized() {
    if (!this.isInitialized) {
      PromptBridgeHelpers.log('🔄 Translator not initialized, attempting initialization...');
      return await this.initialize();
    }
    return true;
  }

  static async translateText(text, targetLanguage = 'es') {
    try {
      if (!await this.ensureInitialized()) {
        throw new Error('Translator initialization failed');
      }

      if (!text || typeof text !== 'string') {
        return text;
      }

      // Both directions are supported: English ↔ French

      // If already in target language, return as is
      if (targetLanguage === this.currentLanguage) {
        return text;
      }

      PromptBridgeHelpers.log('🔄 Translating text...', {
        textLength: text.length,
        from: this.currentLanguage,
        to: targetLanguage,
        preview: text.substring(0, 100) + '...'
      });

      // Use the appropriate translator for the language pair
      let translator;
      
      if (targetLanguage === 'fr' && this.currentLanguage === 'en') {
        // Use English to French translator
        translator = this.translatorEnToFr || await Translator.create({
          sourceLanguage: 'en',
          targetLanguage: 'fr'
        });
      } else if (targetLanguage === 'en' && this.currentLanguage === 'fr') {
        // Use French to English translator
        translator = this.translatorFrToEn || await Translator.create({
          sourceLanguage: 'fr',
          targetLanguage: 'en'
        });
      } else {
        // Create translator for any other language pairs
        translator = await Translator.create({
          sourceLanguage: this.currentLanguage,
          targetLanguage: targetLanguage
        });
      }

      const translatedText = await translator.translate(text);
      
      PromptBridgeHelpers.log('✅ Translation completed', {
        originalLength: text.length,
        translatedLength: translatedText.length,
        from: this.currentLanguage,
        to: targetLanguage
      });

      return translatedText;
    } catch (error) {
      PromptBridgeHelpers.error('❌ Translation failed', error);
      
      // For any translation errors, return original text
      return text;
    }
  }

  static async translateAnalysisData(analysisData, targetLanguage) {
    try {
      PromptBridgeHelpers.log('🔄 Translating analysis data...', {
        targetLanguage,
        hasRecommendation: !!analysisData.recommendation,
        prosCount: analysisData.pros?.length || 0,
        consCount: analysisData.cons?.length || 0
      });

      const translatedData = { ...analysisData };

      // Translate recommendation
      if (analysisData.recommendation) {
        translatedData.recommendation = await this.translateText(analysisData.recommendation, targetLanguage);
      }

      // Translate pros
      if (analysisData.pros && Array.isArray(analysisData.pros)) {
        translatedData.pros = await Promise.all(
          analysisData.pros.map(pro => this.translateText(pro, targetLanguage))
        );
      }

      // Translate cons
      if (analysisData.cons && Array.isArray(analysisData.cons)) {
        translatedData.cons = await Promise.all(
          analysisData.cons.map(con => this.translateText(con, targetLanguage))
        );
      }

      // Translate key insights
      if (analysisData.keyInsights && Array.isArray(analysisData.keyInsights)) {
        translatedData.keyInsights = await Promise.all(
          analysisData.keyInsights.map(insight => this.translateText(insight, targetLanguage))
        );
      }

      // Translate target audience
      if (analysisData.targetAudience) {
        translatedData.targetAudience = await this.translateText(analysisData.targetAudience, targetLanguage);
      }

      // Translate agent workflow data if present
      if (analysisData.agentWorkflow) {
        const translatedWorkflow = { ...analysisData.agentWorkflow };

        // Translate final recommendation
        if (translatedWorkflow.results?.finalRecommendation) {
          const finalRec = translatedWorkflow.results.finalRecommendation;
          if (finalRec.reasoning) {
            finalRec.reasoning = await this.translateText(finalRec.reasoning, targetLanguage);
          }
          if (finalRec.nextSteps && Array.isArray(finalRec.nextSteps)) {
            finalRec.nextSteps = await Promise.all(
              finalRec.nextSteps.map(step => this.translateText(step, targetLanguage))
            );
          }
        }

        // Translate decision reasoning
        if (translatedWorkflow.decisions && Array.isArray(translatedWorkflow.decisions)) {
          for (const decision of translatedWorkflow.decisions) {
            if (decision.reasoning && Array.isArray(decision.reasoning)) {
              decision.reasoning = await Promise.all(
                decision.reasoning.map(reason => this.translateText(reason, targetLanguage))
              );
            }
          }
        }

        translatedData.agentWorkflow = translatedWorkflow;
      }

      // Update current language
      this.currentLanguage = targetLanguage;

      PromptBridgeHelpers.log('✅ Analysis data translation completed', {
        targetLanguage,
        translatedFields: Object.keys(translatedData).length
      });

      return translatedData;
    } catch (error) {
      PromptBridgeHelpers.error('❌ Analysis data translation failed', error);
      throw error;
    }
  }

  static async translateProductData(productData, targetLanguage) {
    try {
      PromptBridgeHelpers.log('🔄 Translating product data...', {
        targetLanguage,
        title: productData.title?.substring(0, 50) + '...'
      });

      const translatedData = { ...productData };

      // Translate title
      if (productData.title) {
        translatedData.title = await this.translateText(productData.title, targetLanguage);
      }

      // Translate description
      if (productData.description) {
        translatedData.description = await this.translateText(productData.description, targetLanguage);
      }

      // Translate availability
      if (productData.availability) {
        translatedData.availability = await this.translateText(productData.availability, targetLanguage);
      }

      // Translate brand
      if (productData.brand) {
        translatedData.brand = await this.translateText(productData.brand, targetLanguage);
      }

      PromptBridgeHelpers.log('✅ Product data translation completed');
      return translatedData;
    } catch (error) {
      PromptBridgeHelpers.error('❌ Product data translation failed', error);
      throw error;
    }
  }

  static getLanguageDisplayName(languageCode) {
    const languageNames = {
      'en': 'English',
      'fr': 'Français'
    };
    return languageNames[languageCode] || languageCode;
  }

  static getCurrentLanguage() {
    return this.currentLanguage;
  }

  static setCurrentLanguage(language) {
    this.currentLanguage = language;
    PromptBridgeHelpers.log('🌐 Language changed to:', language);
  }

  static async cleanup() {
    try {
      if (this.translatorEnToFr || this.translatorFrToEn) {
        // Translator instances don't have a cleanup method, just clear references
        this.translatorEnToFr = null;
        this.translatorFrToEn = null;
        this.isInitialized = false;
        PromptBridgeHelpers.log('✅ Translators cleaned up');
      }
    } catch (error) {
      PromptBridgeHelpers.error('❌ Translator cleanup failed', error);
    }
  }
}

// Make translator available globally
window.PromptBridgeTranslator = PromptBridgeTranslator;
