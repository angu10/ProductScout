// Chrome Translator API integration for multilingual support
class PromptBridgeTranslator {
  static instance = null;
  static isInitialized = false;
  static supportedLanguages = {
    'en': 'English',
    'es': 'Spanish'
  };
  static defaultLanguage = 'en';
  static currentLanguage = 'en';
  // Cache language-direction pairs that are unsupported on this device to
  // avoid repeated Translator.create retries and noisy errors.
  static unsupportedDirections = new Set();

  static async initialize() {
    try {
      PromptBridgeHelpers.log('🌐 Initializing Translator API...');

      // Check if Translator API is available
      if (!('Translator' in self)) {
        throw new Error('Translator API not available. Please use Chrome Canary with AI features enabled.');
      }

      PromptBridgeHelpers.log('✅ Translator API detected');

      // Load user's language preference
      await this.loadLanguagePreference();

      // Check availability for both directions (en <-> es)
      const availabilityEnToEs = await Translator.availability({ sourceLanguage: 'en', targetLanguage: 'es' });
      const availabilityEsToEn = await Translator.availability({ sourceLanguage: 'es', targetLanguage: 'en' });

      PromptBridgeHelpers.log('📊 Translation availability:', {
        enToEs: availabilityEnToEs,
        esToEn: availabilityEsToEn,
        currentLanguage: this.currentLanguage
      });

      // If either direction is available or downloadable, consider translator usable
      if (availabilityEnToEs === 'available' || availabilityEsToEn === 'available') {
        PromptBridgeHelpers.log('✅ Translation models ready for at least one direction');
        this.isInitialized = true;
      } else if (availabilityEnToEs === 'downloadable' || availabilityEsToEn === 'downloadable') {
        PromptBridgeHelpers.log('📥 Translation models need to be downloaded for one or both directions');
        // Try downloading English<->Spanish models if needed
        if (availabilityEnToEs === 'downloadable') {
          await this.downloadTranslationModels('en', 'es');
        }
        if (availabilityEsToEn === 'downloadable') {
          await this.downloadTranslationModels('es', 'en');
        }
      } else {
        PromptBridgeHelpers.log('⚠️ Translation models not available for en<->es:', { availabilityEnToEs, availabilityEsToEn });
        // Continue without translation capability
        this.isInitialized = true;
      }

      return this.isInitialized;
    } catch (error) {
      PromptBridgeHelpers.error('❌ Translator initialization failed', error);
      this.isInitialized = false;
      return false;
    }
  }

  static async downloadTranslationModels(source = 'en', target = 'es') {
    try {
      PromptBridgeHelpers.log('📥 Downloading translation models...', { source, target });

      // Create translator to trigger download for a specific direction
      const translator = await Translator.create({
        sourceLanguage: source,
        targetLanguage: target,
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            const progress = Math.round(e.loaded * 100);
            PromptBridgeHelpers.log(`📥 Translation model download (${source}->${target}): ${progress}%`);

            // Notify UI of download progress
            if (window.PromptBridgeWidget && window.PromptBridgeWidget.instance) {
              const widget = window.PromptBridgeWidget.instance;
              const downloadIndicator = widget.querySelector('.translation-download-progress');
              if (downloadIndicator) {
                downloadIndicator.textContent = `Downloading translation models (${source}->${target}): ${progress}%`;
              }
            }
          });
        }
      });

      // Wait for download to complete
      await translator.ready;
      PromptBridgeHelpers.log('✅ Translation models downloaded successfully', { source, target });
      this.isInitialized = true;

    } catch (error) {
      PromptBridgeHelpers.error('❌ Translation model download failed', error);
      // Continue without translation capability
      this.isInitialized = true;
    }
  }

  static async loadLanguagePreference() {
    try {
      const settings = await PromptBridgeHelpers.getFromStorage('languageSettings');
      if (settings && settings.preferredLanguage) {
        this.currentLanguage = settings.preferredLanguage;
        PromptBridgeHelpers.log('🌐 Language preference loaded:', this.currentLanguage);
      } else {
        // Set default language
        this.currentLanguage = this.defaultLanguage;
        await this.saveLanguagePreference(this.currentLanguage);
        PromptBridgeHelpers.log('🌐 Default language set:', this.currentLanguage);
      }
    } catch (error) {
      PromptBridgeHelpers.error('❌ Failed to load language preference', error);
      this.currentLanguage = this.defaultLanguage;
    }
  }

  static async saveLanguagePreference(language) {
    try {
      const settings = {
        preferredLanguage: language,
        lastUpdated: new Date().toISOString()
      };

      await PromptBridgeHelpers.saveToStorage('languageSettings', settings);
      this.currentLanguage = language;

      PromptBridgeHelpers.log('💾 Language preference saved:', language);

      // Notify other components of language change
      this.notifyLanguageChange(language);

    } catch (error) {
      PromptBridgeHelpers.error('❌ Failed to save language preference', error);
    }
  }

  static notifyLanguageChange(language) {
    // Dispatch custom event for language change
    const event = new CustomEvent('promptbridge-language-changed', {
      detail: { language }
    });
    document.dispatchEvent(event);

    PromptBridgeHelpers.log('📢 Language change notification sent:', language);
  }

  static async translateText(text, targetLanguage = null) {
    try {
      if (!text || !this.isInitialized) {
        return text;
      }

      const targetLang = targetLanguage || this.currentLanguage;

      PromptBridgeHelpers.log('🔄 Translating text...', {
        textLength: text.length,
        targetLanguage: targetLang,
        preview: text.substring(0, 100) + '...'
      });

      // Create translator instance
      // Try creating the translator without specifying sourceLanguage to
      // allow the API to auto-detect. Some implementations, however,
      // require sourceLanguage. If we get that specific TypeError, retry
      // with a sensible fallback sourceLanguage (prefer currentLanguage).
      let translator = null;
      try {
        translator = await Translator.create({ targetLanguage: targetLang });
      } catch (createErr) {
        // Detect the specific error about missing sourceLanguage
        const errMsg = String(createErr || '');
        if (errMsg.includes("Required member is undefined") || errMsg.includes('sourceLanguage')) {
          const fallbackSource = (this.currentLanguage && this.currentLanguage !== targetLang) ? this.currentLanguage : 'en';
          const dirKey = `${fallbackSource}->${targetLang}`;

          // If we've previously determined this direction is unsupported,
          // skip retrying to avoid noisy errors.
          if (this.unsupportedDirections.has(dirKey)) {
            PromptBridgeHelpers.log('⚠️ Skipping translator retry: direction previously marked unsupported', { dirKey });
            return text;
          }

          PromptBridgeHelpers.log('⚠️ Translator.create required sourceLanguage, retrying with fallback', { fallbackSource, targetLang });
          try {
            translator = await Translator.create({ sourceLanguage: fallbackSource, targetLanguage: targetLang });
          } catch (retryErr) {
            // Some environments may not support the requested direction
            // (e.g. es->en). Cache and log a single warning, then return
            // original text to avoid repeated console errors.
            PromptBridgeHelpers.log('⚠️ Translator.create retry failed - direction not supported on this device', { dirKey, error: String(retryErr) });
            this.unsupportedDirections.add(dirKey);
            return text;
          }
        } else {
          // Re-throw if it's not the sourceLanguage problem
          throw createErr;
        }
      }

      // Translate the text
      const translatedText = await translator.translate(text);

      PromptBridgeHelpers.log('✅ Text translated successfully', {
        originalLength: text.length,
        translatedLength: translatedText.length,
        targetLanguage: targetLang
      });

      return translatedText;

    } catch (error) {
      PromptBridgeHelpers.error('❌ Translation failed', error);
      // Return original text if translation fails
      return text;
    }
  }

  static async translateAnalysis(analysis) {
    try {
      if (!analysis) {
        return analysis;
      }

      const sourceLanguage = analysis.translationLanguage || 'en';
      const targetLanguage = this.currentLanguage;

      // If source and target are the same, return original
      if (sourceLanguage === targetLanguage) {
        PromptBridgeHelpers.log('🌐 LANGUAGE SWITCH: No translation needed, same language');
        return analysis;
      }

      PromptBridgeHelpers.log('🔄 LANGUAGE SWITCH: Translating analysis...', {
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage,
        hasRecommendation: !!analysis.recommendation,
        prosCount: analysis.pros?.length || 0,
        consCount: analysis.cons?.length || 0
      });

      const translatedAnalysis = { ...analysis };

      // Translate recommendation
      if (analysis.recommendation) {
        translatedAnalysis.recommendation = await this.translateText(analysis.recommendation);
      }

      // Translate pros
      if (analysis.pros && Array.isArray(analysis.pros)) {
        translatedAnalysis.pros = await Promise.all(
          analysis.pros.map(pro => this.translateText(pro))
        );
      }

      // Translate cons
      if (analysis.cons && Array.isArray(analysis.cons)) {
        translatedAnalysis.cons = await Promise.all(
          analysis.cons.map(con => this.translateText(con))
        );
      }

      // Translate key insights
      if (analysis.keyInsights && Array.isArray(analysis.keyInsights)) {
        translatedAnalysis.keyInsights = await Promise.all(
          analysis.keyInsights.map(insight => this.translateText(insight))
        );
      }

      // Translate target audience
      if (analysis.targetAudience) {
        translatedAnalysis.targetAudience = await this.translateText(analysis.targetAudience);
      }

      // Mark as translated
      translatedAnalysis.translated = true;
      translatedAnalysis.translationLanguage = this.currentLanguage;

      PromptBridgeHelpers.log('✅ LANGUAGE SWITCH COMPLETE: Analysis translated successfully', {
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage,
        translatedFields: Object.keys(translatedAnalysis).filter(key =>
          typeof translatedAnalysis[key] === 'string' || Array.isArray(translatedAnalysis[key])
        )
      });

      return translatedAnalysis;

    } catch (error) {
      PromptBridgeHelpers.error('❌ Analysis translation failed', error);
      return analysis; // Return original analysis if translation fails
    }
  }

  static async translatePrompt(prompt) {
    try {
      if (!prompt || this.currentLanguage === 'en') {
        return prompt;
      }

      PromptBridgeHelpers.log('🔄 Translating AI prompt...', {
        language: this.currentLanguage,
        promptLength: prompt.length
      });

      const translatedPrompt = await this.translateText(prompt);

      PromptBridgeHelpers.log('✅ AI prompt translated successfully', {
        originalLength: prompt.length,
        translatedLength: translatedPrompt.length
      });

      return translatedPrompt;

    } catch (error) {
      PromptBridgeHelpers.error('❌ Prompt translation failed', error);
      return prompt; // Return original prompt if translation fails
    }
  }

  static getLocalizedPrompts() {
    return {
      en: {
        productAnalysisPrompt: `You are analyzing a product for a shopping assistant. STRICTLY use ONLY the information provided below. Do NOT make assumptions or add information not explicitly stated.

PRODUCT DETAILS:
- Title: {title}
- Price: {price}
- Rating: {rating}
- Availability: {availability}
- Category: {category}
- Source: {source}
{brand}
{description}

CRITICAL INSTRUCTIONS:
1. If the product has {reviewCount} reviews, you MUST acknowledge this in your analysis
2. Do NOT claim "no reviews" if review data is provided
3. Base ALL cons on actual product data or reasonable inferences from the information given
4. Do NOT fabricate concerns that contradict the provided data

Provide a JSON response with this EXACT structure:
{
  "recommendation": "Brief 2-3 sentence recommendation considering the actual review count and rating",
  "pros": ["List of 3-5 positive aspects based on the data provided"],
  "cons": ["List of genuine concerns or drawbacks - do NOT mention lack of reviews if {reviewCount} reviews exist"],
  "valueAssessment": "excellent|good|fair|poor",
  "keyInsights": ["2-3 most important insights based on actual data"],
  "targetAudience": "Who would benefit most from this product"
}

Focus on practical shopping advice using ONLY the information provided above.`
      },
      es: {
        productAnalysisPrompt: `Eres un asistente de compras analizando un producto. USA ÚNICAMENTE la información proporcionada a continuación. NO hagas suposiciones ni agregues información no explícitamente indicada.

DETALLES DEL PRODUCTO:
- Título: {title}
- Precio: {price}
- Calificación: {rating}
- Disponibilidad: {availability}
- Categoría: {category}
- Fuente: {source}
{brand}
{description}

INSTRUCCIONES CRÍTICAS:
1. Si el producto tiene {reviewCount} reseñas, DEBES reconocerlo en tu análisis
2. NO afirmes "sin reseñas" si se proporcionan datos de reseñas
3. Basa TODOS los contras en datos reales del producto o inferencias razonables de la información dada
4. NO fabriques preocupaciones que contradigan los datos proporcionados

Proporciona una respuesta JSON con esta estructura EXACTA:
{
  "recommendation": "Recomendación breve de 2-3 oraciones considerando el número real de reseñas y calificación",
  "pros": ["Lista de 3-5 aspectos positivos basados en los datos proporcionados"],
  "cons": ["Lista de preocupaciones o desventajas genuinas - NO menciones falta de reseñas si existen {reviewCount} reseñas"],
  "valueAssessment": "excelente|bueno|regular|pobre",
  "keyInsights": ["2-3 insights más importantes basados en datos reales"],
  "targetAudience": "Quién se beneficiaría más de este producto"
}

Enfócate en consejos de compra prácticos usando ÚNICAMENTE la información proporcionada arriba.`
      }
    };
  }

  static getLocalizedText(key, language = null) {
    const lang = language || this.currentLanguage;

    const localizedTexts = {
      en: {
        'analyzing': 'Analyzing product with AI...',
        'loading': 'This may take a few seconds',
        'refresh': 'Refresh',
        'compare': 'Compare',
        'save': 'Save',
        'debug': 'Debug',
        'minimize': 'Minimize',
        'close': 'Close',
        'ai_analysis': 'AI Analysis',
        'pros_cons': 'Pros & Cons',
        'pros': 'Pros',
        'cons': 'Cons',
        'key_insights': 'Key Insights',
        'value_assessment': 'Value Assessment',
        'excellent': 'excellent',
        'good': 'good',
        'fair': 'fair',
        'poor': 'poor',
        'unknown': 'unknown',
        'language_settings': 'Language Settings',
        'select_language': 'Select Language',
        'english': 'English',
        'spanish': 'Spanish'
      },
      es: {
        'analyzing': 'Analizando producto con IA...',
        'loading': 'Esto puede tomar unos segundos',
        'refresh': 'Actualizar',
        'compare': 'Comparar',
        'save': 'Guardar',
        'debug': 'Depurar',
        'minimize': 'Minimizar',
        'close': 'Cerrar',
        'ai_analysis': 'Análisis de IA',
        'pros_cons': 'Pros y Contras',
        'pros': 'Pros',
        'cons': 'Contras',
        'key_insights': 'Insights Clave',
        'value_assessment': 'Evaluación de Valor',
        'excellent': 'excelente',
        'good': 'bueno',
        'fair': 'regular',
        'poor': 'pobre',
        'unknown': 'desconocido',
        'language_settings': 'Configuración de Idioma',
        'select_language': 'Seleccionar Idioma',
        'english': 'Inglés',
        'spanish': 'Español'
      }
    };

    return localizedTexts[lang]?.[key] || localizedTexts['en'][key] || key;
  }

  static async setLanguage(language) {
    try {
      if (!this.supportedLanguages[language]) {
        throw new Error(`Unsupported language: ${language}`);
      }

      PromptBridgeHelpers.log('🌐 Changing language to:', language);

      await this.saveLanguagePreference(language);

      // Update UI elements
      this.updateUI();

      return true;
    } catch (error) {
      PromptBridgeHelpers.error('❌ Failed to set language', error);
      return false;
    }
  }

  static updateUI() {
    // This will be called by the widget to update UI elements
    if (window.PromptBridgeWidget && window.PromptBridgeWidget.instance) {
      window.PromptBridgeWidget.updateLanguageElements();
    }
  }

  static getCurrentLanguage() {
    return this.currentLanguage;
  }

  static getSupportedLanguages() {
    return this.supportedLanguages;
  }

  static isLanguageSupported(language) {
    return language in this.supportedLanguages;
  }
}

// Make translator available globally
window.PromptBridgeTranslator = PromptBridgeTranslator;
